import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// POST /api/notifications/read — mark all received messages as read
export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  await db.message.updateMany({
    where: {
      conversation: {
        participants: { some: { userId: dbUser.id } },
      },
      senderId: { not: dbUser.id },
      isRead: false,
    },
    data: { isRead: true },
  })

  return NextResponse.json({ ok: true })
}