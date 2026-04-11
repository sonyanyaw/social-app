"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { PostCard } from "@/components/post/PostCard"
import { PostComposer } from "@/components/post/PostComposer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { PostCardFallback } from "@/components/PostCardFallback"
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed"
import type { Post, User, MediaFile } from "@prisma/client"

export type PostWithRelations = Post & { user: User; mediaFiles: MediaFile[] }

export type FeedPage = {
  posts: PostWithRelations[]
  nextCursor: string | null
  hasMore: boolean
}

type Tab = "latest" | "following"
const POLL_INTERVAL = 30_000

type Props = {
  latestData: FeedPage
  followingData: FeedPage
  hasFollowing: boolean
}

export function FeedClient({ latestData, followingData, hasFollowing }: Props) {
  const [tab, setTab] = useState<Tab>("latest")

  const latest   = useInfiniteFeed(latestData,   "latest")
  const following = useInfiniteFeed(followingData, "following")

  const active = tab === "latest" ? latest : following

  // Poll for new posts on the active tab
  const latestKnownDateRef = useRef<Date>(
    latestData.posts[0] ? new Date(latestData.posts[0].createdAt) : new Date(0)
  )
  const [pendingPosts, setPendingPosts] = useState<PostWithRelations[]>([])
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const endpoint = tab === "following"
          ? "/api/posts?tab=following&limit=5"
          : "/api/posts?limit=5"
        const res = await fetch(endpoint)
        if (!res.ok) return
        const data: FeedPage = await res.json()
        const fresh = data.posts.filter(
          (p) => new Date(p.createdAt) > latestKnownDateRef.current
        )
        if (fresh.length > 0) {
          setPendingPosts(fresh)
          setShowBanner(true)
        }
      } catch {}
    }

    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [tab])

  // Reset banner when switching tabs
  useEffect(() => {
    setPendingPosts([])
    setShowBanner(false)
    latestKnownDateRef.current =
      tab === "latest"
        ? latestData.posts[0] ? new Date(latestData.posts[0].createdAt) : new Date(0)
        : followingData.posts[0] ? new Date(followingData.posts[0].createdAt) : new Date(0)
  }, [tab, latestData.posts, followingData.posts])

  function showNewPosts() {
    if (!pendingPosts.length) return
    active.prependMany(pendingPosts)
    latestKnownDateRef.current = new Date(pendingPosts[0].createdAt)
    setPendingPosts([])
    setShowBanner(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNewPost = useCallback((post: PostWithRelations) => {
    latest.prependPost(post)
    following.prependPost(post)
    latestKnownDateRef.current = new Date(post.createdAt)
  }, [latest, following])

  const posts = active.posts
  const isLoading = active.loading
  const hasMore = active.hasMore

  return (
    <>
      {/* Composer */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <PostComposer onPost={handleNewPost} />
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid var(--rule)",
        marginBottom: 24,
      }}>
        {([
          { key: "latest",    label: "Latest"    },
          { key: "following", label: "Following" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              fontSize: 14, fontWeight: tab === key ? 500 : 400,
              color: tab === key ? "var(--ink)" : "var(--ink-3)",
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 16px",
              borderBottom: tab === key
                ? "2px solid var(--ink)"
                : "2px solid transparent",
              marginBottom: -1,
              fontFamily: "var(--font-sans)",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Following tab empty state when not following anyone */}
      {tab === "following" && !hasFollowing && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-3)" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginBottom: 8 }}>
            You&apos;re not following anyone yet
          </p>
          <p style={{ fontSize: 14 }}>
            Search for people and follow them to see their posts here.
          </p>
        </div>
      )}

      {/* New posts banner */}
      {showBanner && (
        <div style={{
          position: "sticky", top: 8, zIndex: 20,
          display: "flex", justifyContent: "center",
          marginBottom: 16, pointerEvents: "none",
        }}>
          <button
            onClick={showNewPosts}
            style={{
              pointerEvents: "all",
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 999,
              background: "var(--ink)", color: "var(--paper)",
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              fontFamily: "var(--font-sans)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              animation: "slideDown 0.25s ease both",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
            {pendingPosts.length === 1 ? "1 new post" : `${pendingPosts.length} new posts`}
          </button>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Posts */}
      {tab === "following" && hasFollowing && posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-3)" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginBottom: 8 }}>
            Nothing yet
          </p>
          <p style={{ fontSize: 14 }}>People you follow haven&apos;t posted anything.</p>
        </div>
      ) : tab === "latest" && posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-3)" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, marginBottom: 8 }}>
            Nothing here yet
          </p>
          <p style={{ fontSize: 14 }}>Be the first to post something.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {posts.map((post, i) => (
              <div
                key={post.id}
                className="fade-up"
                style={{
                  animationDelay: `${Math.min(i, 5) * 40}ms`,
                  transition: "background 1s ease",
                  background: active.newPostIds.has(post.id) ? "var(--accent-soft)" : "transparent",
                  borderRadius: "var(--radius-lg)",
                  margin: active.newPostIds.has(post.id) ? "0 -8px" : "0",
                  padding: active.newPostIds.has(post.id) ? "0 8px" : "0",
                }}
              >
                <ErrorBoundary fallback={<PostCardFallback />}>
                  <PostCard post={post} onDelete={active.deletePost} />
                </ErrorBoundary>
              </div>
            ))}
          </div>

          <div ref={active.sentinelRef} style={{ height: 1 }} />

          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0", gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--ink-3)",
                  animation: "bounce 1.2s ease infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
              <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)", fontSize: 13 }}>
              You&apos;re all caught up
            </div>
          )}
        </>
      )}
    </>
  )
}