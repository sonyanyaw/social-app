import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

// GET /api/posts/[id]/comments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params

  const comments = await db.comment.findMany({
    where: { postId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(comments)
}

// POST /api/posts/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const { content } = z.object({ content: z.string().min(1).max(500) }).parse(await req.json())

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  const [comment] = await db.$transaction([
    db.comment.create({
      data: { postId, userId: dbUser.id, content },
      include: { user: true },
    }),
    db.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ])

  return NextResponse.json(comment, { status: 201 })
}