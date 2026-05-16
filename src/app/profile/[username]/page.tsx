import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar } from "@/components/Avatar"
import { db } from "@/lib/db"
import { getInitials } from "@/lib/format"
import { Header } from "@/components/Header"
import { PostCard } from "@/components/post/PostCard"
import { FollowButton } from "@/components/profile/FollowButton"
import { ProfileStats } from "@/components/profile/ProfileStats"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
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

  if (!target) notFound()

  const isMe = me?.id === target.id

  const isFollowing = me && !isMe
    ? !!(await db.follow.findUnique({
        where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
      }))
    : false

  // Show posts based on relationship
  const posts = await db.post.findMany({
    where: {
      userId: target.id,
      OR: [
        { visibility: "PUBLIC" },
        // Own profile: see all your posts
        ...(isMe ? [{ userId: target.id }] : []),
        // Following: see followers-only posts
        ...(isFollowing ? [{ visibility: "FOLLOWERS" as const }] : []),
      ],
    },
    include: { user: true, mediaFiles: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  const initials = getInitials(target.displayName)

  return (
    <>
      <Header />
      <div className="page-scroll">
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>

          {/* Profile header */}
          <div className="fade-up" style={{
            display: "flex", alignItems: "flex-start", gap: 20,
            marginBottom: 32, paddingBottom: 28,
            borderBottom: "1px solid var(--rule)",
          }}>
            {/* Avatar */}
            <Avatar src={target.avatarUrl} alt={target.displayName} size={72} initials={initials} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                <div>
                  <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                    {target.displayName}
                  </h1>
                  <p style={{ fontSize: 14, color: "var(--ink-3)", margin: "2px 0 0" }}>
                    @{target.username}
                  </p>
                </div>
                {!isMe && me && (
                  <FollowButton
                    username={target.username}
                    initialFollowing={isFollowing}
                  />
                )}
                {isMe && (
                  <Link href="/profile/edit" style={{
                    fontSize: 13, padding: "7px 16px",
                    borderRadius: 999, border: "1px solid var(--rule)",
                    color: "var(--ink-2)", textDecoration: "none",
                    background: "transparent", display: "inline-block",
                    transition: "border-color 0.15s",
                  }}>
                    Edit profile
                  </Link>
                )}
              </div>

              {target.bio && (
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: "10px 0 0" }}>
                  {target.bio}
                </p>
              )}

              <ProfileStats
                username={target.username}
                postCount={target._count.posts}
                followerCount={target._count.followers}
                followingCount={target._count.following}
              />
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-3)" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginBottom: 6 }}>
                {isMe ? "You haven't posted yet" : "No posts yet"}
              </p>
              <p style={{ fontSize: 14 }}>
                {isMe ? "Share something with your followers." : `${target.displayName} hasn't posted anything.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {posts.map((post, i) => (
                <div key={post.id} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}