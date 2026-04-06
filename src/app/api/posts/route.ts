import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"

const CreatePostSchema = z.object({
  content: z.string().min(1).max(500),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
  mediaKeys: z
    .array(z.object({ key: z.string(), publicUrl: z.string() }))
    .max(4)
    .default([]),
})

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor     = searchParams.get("cursor") || undefined
  const tab        = searchParams.get("tab")    // "following" or null = latest
  const limitParam = searchParams.get("limit")
  const limit      = limitParam ? Math.min(parseInt(limitParam), 20) : 20

  const dbUser = await db.user.findUnique({ where: { clerkId } })

  const where = tab === "following" && dbUser
    ? {
        // Following tab: posts from people you follow + your own
        OR: [
          {
            user: { followers: { some: { followerId: dbUser.id } } },
            visibility: { in: ["PUBLIC", "FOLLOWERS"] as ("PUBLIC" | "FOLLOWERS")[] },
          },
          { userId: dbUser.id },
        ],
      }
    : {
        // Latest tab: public + own + followers-only from people you follow
        OR: [
          { visibility: "PUBLIC" as const },
          ...(dbUser ? [{ userId: dbUser.id }] : []),
          ...(dbUser ? [{
            visibility: "FOLLOWERS" as const,
            user: { followers: { some: { followerId: dbUser.id } } },
          }] : []),
        ],
      }

  const posts = await db.post.findMany({
    where,
    include: { user: true, mediaFiles: true },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = posts.length > limit
  const items   = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? items[items.length - 1].id : null

  // Annotate which posts the current user has liked
  let likedPostIds = new Set<string>()
  if (dbUser && items.length > 0) {
    const likes = await db.like.findMany({
      where: {
        userId: dbUser.id,
        postId: { in: items.map((p) => p.id) },
      },
      select: { postId: true },
    })
    likedPostIds = new Set(likes.map((l) => l.postId))
  }

  const postsWithLiked = items.map((p) => ({
    ...p,
    isLiked: likedPostIds.has(p.id),
  }))

  return NextResponse.json({ posts: postsWithLiked, nextCursor, hasMore })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const body   = await req.json()
  const parsed = CreatePostSchema.safeParse(body)
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 })

  const { content, visibility, mediaKeys } = parsed.data

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return new NextResponse("User not found", { status: 404 })

  const post = await db.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: { userId: dbUser.id, content, visibility },
    })
    if (mediaKeys.length > 0) {
      await tx.mediaFile.createMany({
        data: mediaKeys.map(({ key, publicUrl }) => ({
          userId:     dbUser.id,
          postId:     newPost.id,
          storageKey: publicUrl, 
          mimeType:   key.match(/\.(mp4|webm|mov)$/i) ? "video/mp4" : "image/jpeg",
          sizeBytes:  0,
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