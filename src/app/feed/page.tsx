import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Header } from "@/components/Header"
import { PostComposer } from "@/components/post/PostComposer"
import { PostCard } from "@/components/post/PostCard"

export default async function FeedPage() {
  await auth.protect()

  const posts = await db.post.findMany({
    where: { visibility: "PUBLIC" },
    include: { user: true, mediaFiles: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <>
      <Header />
      <div className="page-scroll">
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <PostComposer />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
            <span style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Latest
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-3)" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, marginBottom: 8 }}>Nothing here yet</p>
              <p style={{ fontSize: 14 }}>Be the first to post something.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {posts.map((post, i) => (
                <div key={post.id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
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