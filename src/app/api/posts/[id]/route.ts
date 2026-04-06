import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(
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
  if (post.userId !== dbUser.id) return new NextResponse("Forbidden", { status: 403 })

  // Cascade deletes likes, comments, mediaFiles via schema onDelete: Cascade
  await db.post.delete({ where: { id: postId } })

  return new NextResponse(null, { status: 204 })
}