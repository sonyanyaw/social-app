"use client"

import { useState, useRef } from "react"
import type { Post, User, MediaFile } from "@prisma/client"

type PostWithRelations = Post & {
  user: User
  mediaFiles: MediaFile[]
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

export function PostCard({ post }: { post: PostWithRelations }) {
  const [liked, setLiked] = useState(false)
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
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => wasLiked ? c - 1 : c + 1)

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()

      setLiked(data.liked)
    } catch {

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

  return (
    <article style={{ padding: "20px 0", borderBottom: "1px solid var(--rule)" }}>
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--accent-soft)", border: "1px solid var(--rule)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 12, fontWeight: 500, color: "var(--accent)",
          overflow: "hidden",
        }}>
          {post.user.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={post.user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              {post.user.displayName}
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>@{post.user.username}</span>
            <span suppressHydrationWarning style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: "auto" }}>
              {timeAgo(post.createdAt)}
            </span>
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

      {/* Media */}
      {post.mediaFiles.length > 0 && (
        <div style={{
          paddingLeft: 48, marginBottom: 14,
          display: "grid",
          gridTemplateColumns: post.mediaFiles.length === 1 ? "1fr" : "1fr 1fr",
          gap: 4, borderRadius: "var(--radius-lg)", overflow: "hidden",
        }}>
          {post.mediaFiles.map((f) => (
            <div key={f.id} style={{
              aspectRatio: post.mediaFiles.length === 1 ? "16/9" : "1",
              background: "var(--rule-2)", overflow: "hidden",
            }}>
              {f.mimeType.startsWith("video")
                // eslint-disable-next-line @next/next/no-img-element
                ? <video src={f.storageKey} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
                : <img src={f.storageKey} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
          ))}
        </div>
      )}

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
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: "var(--rule-2)", border: "1px solid var(--rule)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 500, color: "var(--ink-2)", overflow: "hidden",
                    }}>
                      {c.user.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={c.user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : ci}
                    </div>
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