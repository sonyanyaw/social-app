import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const { userId: clerkId } = await auth()

  const [me, target] = await Promise.all([
    clerkId ? db.user.findUnique({ where: { clerkId } }) : null,
    db.user.findUnique({
      where: { username },
      include: {
        _count: { select: { posts: true, followers: true, following: true } },
      },
    }),
  ])

  if (!target) return new NextResponse("Not found", { status: 404 })

  const isFollowing = me
    ? !!(await db.follow.findUnique({
        where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
      }))
    : false

  return NextResponse.json({
    id:          target.id,
    username:    target.username,
    displayName: target.displayName,
    avatarUrl:   target.avatarUrl,
    bio:         target.bio,
    isMe:        me?.id === target.id,
    isFollowing,
    counts: {
      posts:     target._count.posts,
      followers: target._count.followers,
      following: target._count.following,
    },
  })
}