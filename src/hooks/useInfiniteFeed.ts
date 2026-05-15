"use client"

import { useState, useCallback, useRef } from "react"
import type { Post, User, MediaFile } from "@prisma/client"

export type PostWithRelations = Post & { user: User; mediaFiles: MediaFile[] }

export type FeedPage = {
  posts: PostWithRelations[]
  nextCursor: string | null
  hasMore: boolean
}

export function useInfiniteFeed(initialData: FeedPage, tab: "latest" | "following") {
  const [pages, setPages] = useState<PostWithRelations[]>(initialData.posts)
  const [nextCursor, setNextCursor] = useState<string | null>(initialData.nextCursor)
  const [hasMore, setHasMore] = useState(initialData.hasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextCursor) return
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ cursor: nextCursor })
      if (tab === "following") params.set("tab", "following")
      const res = await fetch(`/api/posts?${params}`)
      const data: FeedPage = await res.json()
      setPages((prev) => [...prev, ...data.posts])
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch {
      setError(true)
    }
    finally { setLoading(false) }
  }, [loading, hasMore, nextCursor, tab])

  const highlightPost = useCallback((id: string) => {
    setNewPostIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setNewPostIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 3000)
  }, [])

  const prependPost = useCallback((post: PostWithRelations) => {
    setPages((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev
      return [post, ...prev]
    })
    highlightPost(post.id)
  }, [highlightPost])

  const prependMany = useCallback((newPosts: PostWithRelations[]) => {
    setPages((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const toAdd = newPosts.filter((p) => !existingIds.has(p.id))
      return [...toAdd, ...prev]
    })
    newPosts.forEach((p) => highlightPost(p.id))
  }, [highlightPost])

  const deletePost = useCallback((id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: "200px" }
    )
    observerRef.current.observe(node)
  }, [loadMore])

  return { posts: pages, hasMore, loading, error, prependPost, prependMany, deletePost, sentinelRef, newPostIds }
}