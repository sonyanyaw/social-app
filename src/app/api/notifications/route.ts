import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import type { Message, User } from "@prisma/client"
 
type MessageWithSender = Message & { sender: User }

// GET /api/notifications — recent unread messages from others
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })
 
  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })
 
  const messages = await db.message.findMany({
    where: {
      conversation: {
        participants: { some: { userId: dbUser.id } },
      },
      senderId: { not: dbUser.id },
    },
    include: { sender: true },
    orderBy: { sentAt: "desc" },
    take: 20,
  })
 
  const notifications = messages.map((m: MessageWithSender) => ({
    id:             m.id,
    conversationId: m.conversationId,
    senderName:     m.sender.displayName,
    senderAvatar:   m.sender.avatarUrl,
    content:        m.content,
    sentAt:         m.sentAt.toISOString(),
    isRead:         m.isRead,
  }))
 
  return NextResponse.json(notifications)
}

// POST /api/notifications/read handled separately