import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  // Check if already liked
  const existing = await db.like.findUnique({
    where: { userId_postId: { userId: dbUser.id, postId } },
  })

  if (existing) {
    // Unlike
    await db.$transaction([
      db.like.delete({ where: { userId_postId: { userId: dbUser.id, postId } } }),
      db.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ])
    return NextResponse.json({ liked: false })
  } else {
    // Like
    await db.$transaction([
      db.like.create({ data: { userId: dbUser.id, postId } }),
      db.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ])
    return NextResponse.json({ liked: true })
  }
}