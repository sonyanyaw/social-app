"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Avatar } from "@/components/Avatar"
import { PostMedia } from "@/components/PostMedia"
import type { Post, User, MediaFile } from "@prisma/client"

type PostWithRelations = Post & {
  user: User
  mediaFiles: MediaFile[]
  isLiked?: boolean
}

type Comment = {
  id: string
  content: string
  createdAt: string
  user: { id: string; displayName: string; username: string; avatarUrl: string | null }
}

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export function PostCard({ post, onDelete }: { post: PostWithRelations; onDelete?: (id: string) => void }) {
  const { user } = useUser()
  const isOwner = user?.id !== undefined && post.user.clerkId === user.id
  const [deleted, setDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [liked, setLiked] = useState(post.isLiked ?? false)
  // Start from DB value — no double counting
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = post.user.displayName
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  async function toggleLike() {
    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => wasLiked ? c - 1 : c + 1)

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Sync with server response in case of race
      setLiked(data.liked)
    } catch {
      // Revert on error
      setLiked(wasLiked)
      setLikeCount((c) => wasLiked ? c + 1 : c - 1)
    }
  }

  async function loadComments() {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`)
      const data = await res.json()
      setComments(data)
    } catch {}
    finally { setLoadingComments(false) }
  }

  function handleToggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) loadComments()
    if (next) setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    const content = commentInput.trim()
    if (!content || submitting) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error()
      const newComment = await res.json()
      setComments((prev) => [...prev, newComment])
      setCommentCount((c) => c + 1)
      setCommentInput("")
    } catch {}
    finally { setSubmitting(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setDeleted(true)
      onDelete?.(post.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (deleted) return null

  return (
    <article style={{ padding: "20px 0", borderBottom: "1px solid var(--rule)" }}>
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Link href={`/profile/${post.user.username}`} style={{ display: "contents" }}>
          <Avatar src={post.user.avatarUrl} alt={post.user.displayName} size={36} initials={initials} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <Link href={`/profile/${post.user.username}`} style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{post.user.displayName}</span>
            </Link>
            <Link href={`/profile/${post.user.username}`} style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>@{post.user.username}</span>
            </Link>
            <span suppressHydrationWarning style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: "auto" }}>
              {timeAgo(post.createdAt)}
            </span>
            {isOwner && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    title="Delete post"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "2px 4px", borderRadius: "var(--radius)",
                      color: "var(--ink-3)", display: "flex", alignItems: "center",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-3)")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Delete?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 999,
                        border: "none", background: "var(--accent)",
                        color: "white", cursor: "pointer", fontFamily: "var(--font-sans)",
                        opacity: deleting ? 0.6 : 1,
                      }}
                    >
                      {deleting ? "…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 999,
                        border: "1px solid var(--rule)", background: "transparent",
                        color: "var(--ink-3)", cursor: "pointer", fontFamily: "var(--font-sans)",
                      }}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <p style={{
        fontSize: 15, lineHeight: 1.65, color: "var(--ink)",
        marginBottom: post.mediaFiles.length > 0 ? 14 : 16,
        paddingLeft: 48, whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {post.content}
      </p>

      <PostMedia files={post.mediaFiles} />

      {/* Actions */}
      <div style={{ paddingLeft: 48, display: "flex", alignItems: "center", gap: 20 }}>
        {/* Like */}
        <button
          onClick={toggleLike}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 13, color: liked ? "var(--accent)" : "var(--ink-3)",
            background: "none", border: "none", cursor: "pointer",
            padding: 0, transition: "color 0.15s",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Comment toggle */}
        <button
          onClick={handleToggleComments}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 13, color: showComments ? "var(--ink)" : "var(--ink-3)",
            background: "none", border: "none", cursor: "pointer",
            padding: 0, transition: "color 0.15s",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ paddingLeft: 48, marginTop: 14 }}>
          {/* Existing comments */}
          {loadingComments ? (
            <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}>Loading…</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {comments.map((c) => {
                const ci = c.user.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                return (
                  <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Avatar src={c.user.avatarUrl} alt={c.user.displayName} size={26} initials={ci} />
                    <div style={{
                      background: "var(--rule-2)", borderRadius: "0 12px 12px 12px",
                      padding: "7px 11px", flex: 1,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", marginRight: 6 }}>
                        {c.user.displayName}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink)" }}>{c.content}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* New comment input */}
          <form onSubmit={submitComment} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={inputRef}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment…"
              maxLength={500}
              style={{
                flex: 1, padding: "7px 12px",
                background: "var(--rule-2)", border: "1px solid var(--rule)",
                borderRadius: 999, fontSize: 13, color: "var(--ink)",
                fontFamily: "var(--font-sans)", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || submitting}
              style={{
                padding: "7px 14px", borderRadius: 999, border: "none",
                fontSize: 12, fontWeight: 500, cursor: commentInput.trim() ? "pointer" : "default",
                background: commentInput.trim() ? "var(--ink)" : "var(--rule)",
                color: commentInput.trim() ? "var(--paper)" : "var(--ink-3)",
                transition: "background 0.15s, color 0.15s", flexShrink: 0,
              }}
            >
              {submitting ? "…" : "Reply"}
            </button>
          </form>
        </div>
      )}
    </article>
  )
}