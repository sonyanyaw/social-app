"use client"

import { useState, useEffect } from "react"
import { Avatar } from "@/components/Avatar"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { getInitials, formatAbsoluteTime } from "@/lib/format"
import type { Conversation, ConversationParticipant, User, Message } from "@prisma/client"

type ConversationWithDetails = Conversation & {
  participants: (ConversationParticipant & { user: User })[]
  messages: Message[]
}

type Props = {
  initialConversations?: ConversationWithDetails[]
  currentUserId: string
  activeId: string | null
}


export function ConversationList({ initialConversations = [], currentUserId, activeId }: Props) {
  const { getToken } = useAuth()
  const [conversations, setConversations] = useState(initialConversations)

  // Open one WS per conversation to receive last-message updates in real time
  useEffect(() => {
    if (!initialConversations.length) return
    let cancelled = false
    const sockets: WebSocket[] = []

    async function connectAll() {
      const token = await getToken()
      if (!token || cancelled) return

      const protocol = window.location.protocol === "https:" ? "wss" : "ws"

      initialConversations.forEach((conv) => {
        const ws = new WebSocket(
          `${protocol}://${window.location.host}/api/ws?token=${token}&conversationId=${conv.id}`
        )
        sockets.push(ws)

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.type !== "message") return
            setConversations((prev) =>
              prev
                .map((c) =>
                  c.id === data.conversationId
                    ? {
                        ...c,
                        messages: [{
                          id:             data.message.id,
                          conversationId: data.conversationId,
                          senderId:       data.message.senderId,
                          content:        data.message.content,
                          isRead:         data.message.isRead,
                          sentAt:         new Date(data.message.sentAt),
                        } as Message],
                      }
                    : c
                )
                .sort((a, b) => {
                  const aTime = a.messages[0] ? new Date(a.messages[0].sentAt).getTime() : new Date(a.createdAt).getTime()
                  const bTime = b.messages[0] ? new Date(b.messages[0].sentAt).getTime() : new Date(b.createdAt).getTime()
                  return bTime - aTime
                })
            )
          } catch {}
        }

        ws.onerror = () => ws.close()
      })
    }

    connectAll()
    return () => {
      cancelled = true
      sockets.forEach((ws) => ws.close())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (conversations.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
        No conversations yet.<br />Search for someone to start chatting.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.userId !== currentUserId)?.user
        const lastMsg = conv.messages[0]
        const isActive = conv.id === activeId
        const isUnread = lastMsg && lastMsg.senderId !== currentUserId && !lastMsg.isRead
        const initials = getInitials(other?.displayName)

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              background: isActive ? "var(--rule-2)" : "transparent",
              borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
              textDecoration: "none", transition: "background 0.1s",
            }}
          >
            <div style={{ position: "relative" }}>
              <Avatar src={other?.avatarUrl} alt={other?.displayName ?? ""} size={40} initials={initials} />
              {isUnread && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: 10, height: 10, borderRadius: "50%",
                  background: "var(--accent)", border: "2px solid var(--paper)",
                }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                <span style={{
                  fontSize: 14, fontWeight: isUnread ? 500 : 400,
                  color: "var(--ink)", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {other?.displayName ?? "Unknown"}
                </span>
                {lastMsg && (
                  <span suppressHydrationWarning style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0, marginLeft: 8 }}>
                    {formatAbsoluteTime(lastMsg.sentAt)}
                  </span>
                )}
              </div>
              <p style={{
                fontSize: 12,
                color: isUnread ? "var(--ink-2)" : "var(--ink-3)",
                fontWeight: isUnread ? 500 : 400,
                margin: 0, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {lastMsg
                  ? (lastMsg.senderId === currentUserId ? "You: " : "") + lastMsg.content
                  : "No messages yet"}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}