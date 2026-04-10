import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") // "followers" | "following"

  const user = await db.user.findUnique({ where: { username } })
  if (!user) return new NextResponse("Not found", { status: 404 })

  if (type === "following") {
    const rows = await db.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, _count: { select: { followers: true } } } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(rows.map((r) => r.following))
  }

  // default: followers
  const rows = await db.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, _count: { select: { followers: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(rows.map((r) => r.follower))
}