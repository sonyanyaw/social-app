import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { createNotification, deleteNotification } from "@/lib/notifications"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  const post = await db.post.findUnique({ where: { id: postId } })
  if (!post) return new NextResponse("Post not found", { status: 404 })

  const existing = await db.like.findUnique({
    where: { userId_postId: { userId: dbUser.id, postId } },
  })

  if (existing) {
    await db.$transaction([
      db.like.delete({ where: { userId_postId: { userId: dbUser.id, postId } } }),
      db.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ])
    // Remove the like notification
    await deleteNotification({ userId: post.userId, actorId: dbUser.id, type: "LIKE", postId })
    return NextResponse.json({ liked: false })
  } else {
    await db.$transaction([
      db.like.create({ data: { userId: dbUser.id, postId } }),
      db.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ])
    // Notify post author
    await createNotification({ userId: post.userId, actorId: dbUser.id, type: "LIKE", postId })
    return NextResponse.json({ liked: true })
  }
}