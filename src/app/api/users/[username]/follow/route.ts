import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// POST /api/users/[username]/follow — toggle follow
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 })

  const [me, target] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.user.findUnique({ where: { username } }),
  ])

  if (!me) return new NextResponse("User not found", { status: 404 })
  if (!target) return new NextResponse("Target user not found", { status: 404 })
  if (me.id === target.id) return new NextResponse("Cannot follow yourself", { status: 400 })

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
  })

  if (existing) {
    await db.follow.delete({
      where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    })
    return NextResponse.json({ following: false })
  } else {
    await db.follow.create({
      data: { followerId: me.id, followingId: target.id },
    })
    return NextResponse.json({ following: true })
  }
}

// GET /api/users/[username]/follow — check if you follow this user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ following: false })

  const [me, target] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.user.findUnique({ where: { username } }),
  ])

  if (!me || !target) return NextResponse.json({ following: false })

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
  })

  return NextResponse.json({ following: !!existing })
}