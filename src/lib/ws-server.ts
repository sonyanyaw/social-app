import "dotenv/config"
import { WebSocketServer, WebSocket } from "ws"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { db } from "@/lib/db"
import { redis } from "@/lib/redis"

type ConnectedClient = {
  ws: WebSocket
  userId: string
  conversationId: string
}

const clients = new Map<string, ConnectedClient>()
let wss: WebSocketServer | null = null

const clerkJWKS = createRemoteJWKSet(
  new URL(process.env.CLERK_JWKS_URL!)
)

const subscriber = redis.duplicate()
const publisher  = redis.duplicate()

subscriber.on("connect",    () => console.log("[Redis SUB] connected"))
subscriber.on("error", (e) => console.error("[Redis SUB] error:", e.message))
publisher.on("connect",     () => console.log("[Redis PUB] connected"))
publisher.on("error",  (e) => console.error("[Redis PUB] error:", e.message))

export function getWSS(): WebSocketServer {
  if (wss) return wss

  wss = new WebSocketServer({ noServer: true })

  subscriber.psubscribe("chat:*", "notif:*", (err, count) => {
    if (err) console.error("[Redis] psubscribe error:", err)
    else console.log(`[Redis] psubscribed to chat:* and notif:* (${count} patterns)`)
  })

  subscriber.on("pmessage", (_pattern, channel, message) => {
    console.log(`[Redis] pmessage on channel: ${channel}`)

    if (channel.startsWith("chat:")) {
      const conversationId = channel.replace("chat:", "")
      let delivered = 0
      for (const [id, client] of clients.entries()) {
        if (client.conversationId === conversationId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message)
          delivered++
        }
      }
      console.log(`[WS] chat:${conversationId} → ${delivered} client(s) of ${clients.size} total`)
    }

    if (channel.startsWith("notif:")) {
      const targetUserId = channel.replace("notif:", "")
      console.log(`[WS] Looking for notif clients for userId: ${targetUserId}`)
      console.log(`[WS] All clients:`, Array.from(clients.values()).map(c => `${c.userId}:${c.conversationId}`))

      let delivered = 0
      for (const client of clients.values()) {
        if (client.userId === targetUserId && client.ws.readyState === WebSocket.OPEN) {
          console.log(`[WS] Delivering notif to client in channel: ${client.conversationId}`)
          client.ws.send(message)
          delivered++
        }
      }
      console.log(`[WS] notif:${targetUserId} → ${delivered} client(s)`)
    }
  })

  wss.on("connection", async (ws, req) => {
    const url            = new URL(req.url ?? "/", `http://${req.headers.host}`)
    const token          = url.searchParams.get("token")
    const conversationId = url.searchParams.get("conversationId") ?? ""

    if (!token) { ws.close(4001, "Missing token"); return }

    let userId: string
    try {
      const { payload } = await jwtVerify(token, clerkJWKS)
      userId = payload.sub!
      console.log(`[WS] Token ok, clerkId: ${userId}`)
    } catch (err) {
      console.error("[WS] Token verification failed:", err)
      ws.close(4001, "Invalid token")
      return
    }

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) { ws.close(4002, "User not found"); return }

    console.log(`[WS] DB user found: ${dbUser.id} (${dbUser.displayName}), channel: ${conversationId}`)

    if (conversationId !== "__notifications__") {
      const participant = await db.conversationParticipant.findUnique({
        where: { userId_conversationId: { userId: dbUser.id, conversationId } },
      })
      if (!participant) {
        console.warn(`[WS] User ${dbUser.id} not a participant of ${conversationId}`)
        ws.close(4003, "Not a participant")
        return
      }
    }

    const clientId = conversationId === "__notifications__"
      ? `${dbUser.id}:__notifications__`
      : `${dbUser.id}:${conversationId}:${Date.now()}`

    const existing = clients.get(clientId)
    if (existing && existing.ws.readyState === WebSocket.OPEN) {
      existing.ws.close(1000, "Replaced by new connection")
    }

    clients.set(clientId, { ws, userId: dbUser.id, conversationId })
    console.log(`[WS] Client registered: ${clientId} (${clients.size} total)`)

    ws.send(JSON.stringify({ type: "connected", userId: dbUser.id }))

    ws.on("message", async (data) => {
      if (conversationId === "__notifications__") return

      try {
        const event = JSON.parse(data.toString())
        console.log(`[WS] Event '${event.type}' from ${dbUser.displayName}`)

        if (event.type === "message") {
          const message = await db.message.create({
            data: { conversationId, senderId: dbUser.id, content: event.content },
            include: { sender: true },
          })
          console.log(`[WS] Message saved: ${message.id}`)

          const chatPayload = JSON.stringify({
            type: "message", conversationId,
            message: {
              id: message.id, conversationId: message.conversationId,
              senderId: message.senderId, content: message.content,
              isRead: message.isRead, sentAt: message.sentAt.toISOString(),
              sender: {
                id: message.sender.id, displayName: message.sender.displayName,
                username: message.sender.username, avatarUrl: message.sender.avatarUrl,
              },
            },
          })

          const chatResult = await publisher.publish(`chat:${conversationId}`, chatPayload)
          console.log(`[Redis] Published to chat:${conversationId}, receivers: ${chatResult}`)

          // Find all other participants and push a notification to each
          const otherParticipants = await db.conversationParticipant.findMany({
            where: { conversationId, userId: { not: dbUser.id } },
          })
          console.log(`[WS] Notifying ${otherParticipants.length} other participant(s)`)

          const notifPayload = JSON.stringify({
            type: "notification",
            notification: {
              id: message.id, conversationId,
              senderName: message.sender.displayName,
              senderAvatar: message.sender.avatarUrl,
              content: message.content,
            },
          })

          for (const p of otherParticipants) {
            const notifResult = await publisher.publish(`notif:${p.userId}`, notifPayload)
            console.log(`[Redis] Published notif:${p.userId}, receivers: ${notifResult}`)
          }
        }

        if (event.type === "typing") {
          await publisher.publish(`chat:${conversationId}`, JSON.stringify({
            type: "typing", conversationId, userId: dbUser.id, isTyping: event.isTyping,
          }))
        }

        if (event.type === "read") {
          await db.message.update({ where: { id: event.messageId }, data: { isRead: true } })
          await publisher.publish(`chat:${conversationId}`, JSON.stringify({
            type: "read", conversationId, userId: dbUser.id, messageId: event.messageId,
          }))
        }

      } catch (err) {
        console.error("[WS] Error:", err)
        ws.send(JSON.stringify({ type: "error", message: "Failed to process message" }))
      }
    })

    ws.on("close", (code) => {
      clients.delete(clientId)
      console.log(`[WS] Disconnected: ${clientId} (code ${code}) — ${clients.size} remaining`)
    })

    ws.on("error", (err) => console.error(`[WS] Socket error for ${clientId}:`, err))
  })

  return wss
}