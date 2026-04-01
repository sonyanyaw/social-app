import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId: dbUser.id } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(conversations)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const { targetUserId } = z.object({ targetUserId: z.string() }).parse(await req.json())

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  // Check if conversation already exists between these two users
  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: dbUser.id } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  })

  if (existing) return NextResponse.json(existing)

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [
          { userId: dbUser.id },
          { userId: targetUserId },
        ],
      },
    },
    include: { participants: { include: { user: true } } },
  })

  return NextResponse.json(conversation, { status: 201 })
}