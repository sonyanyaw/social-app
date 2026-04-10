import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  try {
    const notifs = await db.notification.findMany({
      where: { userId: dbUser.id },
      include: {
        actor: { select: { displayName: true, username: true, avatarUrl: true } },
        post:  { select: { id: true, content: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    return NextResponse.json(notifs.map((n) => ({
      id:            n.id,
      type:          n.type,
      actorName:     n.actor.displayName,
      actorUsername: n.actor.username,
      actorAvatar:   n.actor.avatarUrl,
      postPreview:   n.post?.content?.slice(0, 60) ?? null,
      postId:        n.postId ?? null,
      isRead:        n.isRead,
      createdAt:     n.createdAt.toISOString(),
    })))
  } catch {
    // Table may not exist yet — return empty list instead of 500
    return NextResponse.json([])
  }
}