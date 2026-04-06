import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Header } from "@/components/Header"
import { FeedClient } from "@/components/feed/FeedClient"

const LIMIT = 20

export default async function FeedPage() {
  const { userId: clerkId } = await auth.protect()

  const dbUser = clerkId
    ? await db.user.findUnique({ where: { clerkId }, include: { _count: { select: { following: true } } } })
    : null

  // Latest tab — public posts + own posts + followers-only from people you follow
  const latestPostsRaw = await db.post.findMany({
    where: {
      OR: [
        { visibility: "PUBLIC" },
        ...(dbUser ? [{ userId: dbUser.id }] : []),
        ...(dbUser ? [{
          visibility: "FOLLOWERS" as const,
          user: { followers: { some: { followerId: dbUser.id } } },
        }] : []),
      ],
    },
    include: { user: true, mediaFiles: true },
    orderBy: { createdAt: "desc" },
    take: LIMIT + 1,
  })

  // Following tab — only posts from people you follow (+ your own)
  const followingPostsRaw = dbUser
    ? await db.post.findMany({
        where: {
          OR: [
            {
              user: { followers: { some: { followerId: dbUser.id } } },
              visibility: { in: ["PUBLIC", "FOLLOWERS"] },
            },
            { userId: dbUser.id },
          ],
        },
        include: { user: true, mediaFiles: true },
        orderBy: { createdAt: "desc" },
        take: LIMIT + 1,
      })
    : []

  // Fetch liked post IDs for current user
  const allPosts = [...latestPostsRaw, ...followingPostsRaw]
  const likedSet = new Set<string>()
  if (dbUser && allPosts.length > 0) {
    const likes = await db.like.findMany({
      where: { userId: dbUser.id, postId: { in: allPosts.map((p) => p.id) } },
      select: { postId: true },
    })
    likes.forEach((l) => likedSet.add(l.postId))
  }

  function paginate(posts: typeof latestPostsRaw) {
    const hasMore = posts.length > LIMIT
    const items = hasMore ? posts.slice(0, LIMIT) : posts
    return {
      posts: items.map((p) => ({ ...p, isLiked: likedSet.has(p.id) })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    }
  }

  return (
    <>
      <Header />
      <div className="page-scroll">
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
          <FeedClient
            latestData={paginate(latestPostsRaw)}
            followingData={paginate(followingPostsRaw)}
            hasFollowing={(dbUser?._count?.following ?? 0) > 0}
            currentUserId={dbUser?.id ?? null}
          />
        </main>
      </div>
    </>
  )
}