"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Avatar } from "@/components/Avatar"
import { getInitials } from "@/lib/format"

type UserRow = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  _count: { followers: number }
}

type Props = {
  username: string
  type: "followers" | "following"
  count: number
  onClose: () => void
}

export function FollowListModal({ username, type, count, onClose }: Props) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch(`/api/users/${username}/followers?type=${type}`)
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [username, type])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  if (!mounted) return null

  const title = type === "followers" ? "Followers" : "Following"

  return createPortal(
    <>
      <style>{`
        @keyframes modalFade { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlide { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(10,9,8,0.6)",
          animation: "modalFade 0.18s ease both",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--paper-2)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 420,
            maxHeight: "80dvh",
            display: "flex",
            flexDirection: "column",
            animation: "modalSlide 0.22s ease both",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--rule)",
            flexShrink: 0,
          }}>
            <h2 style={{
              fontFamily: "var(--font-serif)", fontSize: 20,
              fontWeight: 400, color: "var(--ink)", margin: 0,
            }}>
              {title}
              {count > 0 && (
                <span style={{ fontSize: 14, color: "var(--ink-3)", fontFamily: "var(--font-sans)", marginLeft: 8 }}>
                  {count}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--rule-2)", border: "none",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "var(--ink-3)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" as const }}>
            {loading ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                Loading…
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)" }}>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginBottom: 6 }}>
                  {type === "followers" ? "No followers yet" : "Not following anyone"}
                </p>
                <p style={{ fontSize: 13 }}>
                  {type === "followers"
                    ? "When people follow this account, they'll appear here."
                    : "When this account follows people, they'll appear here."}
                </p>
              </div>
            ) : (
              users.map((u) => {
                const initials = getInitials(u.displayName)
                return (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 20px",
                      borderBottom: "1px solid var(--rule)",
                      textDecoration: "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--rule-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Avatar src={u.avatarUrl} alt={u.displayName} size={44} initials={initials} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                        {u.displayName}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>
                        @{u.username}
                        {u._count.followers > 0 && (
                          <span style={{ marginLeft: 8 }}>
                            {u._count.followers} {u._count.followers === 1 ? "follower" : "followers"}
                          </span>
                        )}
                      </p>
                      {u.bio && (
                        <p style={{
                          margin: "3px 0 0", fontSize: 12, color: "var(--ink-2)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}