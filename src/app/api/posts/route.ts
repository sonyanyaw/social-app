import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const CreatePostSchema = z.object({
  content: z.string().min(1).max(500),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
  mediaKeys: z
    .array(z.object({ key: z.string(), publicUrl: z.string().url() }))
    .max(4)
    .default([]),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const posts = await db.post.findMany({
    where: { visibility: "PUBLIC" },
    include: { user: true, mediaFiles: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = CreatePostSchema.safeParse(body)
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 })
  }

  const { content, visibility, mediaKeys } = parsed.data

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  const post = await db.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: {
        userId: dbUser.id,
        content,
        visibility,
      },
    })

    if (mediaKeys.length > 0) {
      await tx.mediaFile.createMany({
        data: mediaKeys.map(({ key, publicUrl }) => ({
          userId: dbUser.id,
          postId: newPost.id,
          storageKey: key,
          mimeType: publicUrl.match(/\.(mp4|webm|mov)$/i)
            ? "video/mp4"
            : "image/jpeg",
          sizeBytes: 0,
        })),
      })
    }

    return tx.post.findUnique({
      where: { id: newPost.id },
      include: { user: true, mediaFiles: true },
    })
  })

  return NextResponse.json(post, { status: 201 })
}