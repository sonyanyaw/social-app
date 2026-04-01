"use client"

import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type UserResult = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  _count: { followers: number; posts: number }
}

export function UserSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [startingConvo, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
      setOpen(true)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => search(query), 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    if (e.key === "Enter" && activeIdx >= 0) {
      router.push(`/profile/${results[activeIdx].username}`)
      setOpen(false); setQuery("")
    }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur() }
  }

  function startConversation(userId: string) {
    startTransition(async () => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      })
      const conv = await res.json()
      setOpen(false); setQuery("")
      router.push(`/messages/${conv.id}`)
    })
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>

      {/* Search input */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--rule-2)",
        border: "1px solid var(--rule)",
        borderRadius: 999,
        padding: "7px 14px",
        transition: "border-color 0.15s",
      }}>
        {loading ? (
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0, opacity: 0.4 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeDasharray="20" strokeDashoffset="8"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1) }}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search people…"
          style={{
            flex: 1, border: "none", outline: "none",
            background: "transparent", fontSize: 13,
            color: "var(--ink)", fontFamily: "var(--font-sans)",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus() }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--ink-3)", lineHeight: 1, flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          zIndex: 100,
          overflow: "hidden",
        }}>
          {results.length === 0 && !loading && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              No users found for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.map((user, i) => {
            const initials = user.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
            const isActive = i === activeIdx

            return (
              <div
                key={user.id}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: isActive ? "var(--rule-2)" : "transparent",
                  borderBottom: i < results.length - 1 ? "1px solid var(--rule)" : "none",
                  transition: "background 0.1s",
                }}
              >
                {/* Avatar */}
                <Link href={`/profile/${user.username}`} onClick={() => { setOpen(false); setQuery("") }}
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: "var(--accent-soft)", border: "1px solid var(--rule)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 500, color: "var(--accent)",
                  }}>
                    {user.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      : initials}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.displayName}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>
                      @{user.username}
                      <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
                      {user._count.followers} followers
                    </p>
                  </div>
                </Link>

                {/* Message button */}
                <button
                  onClick={() => startConversation(user.id)}
                  disabled={startingConvo}
                  title="Send message"
                  style={{
                    flexShrink: 0,
                    width: 30, height: 30,
                    borderRadius: "50%",
                    border: "1px solid var(--rule)",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--ink-3)",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink-2)"; e.currentTarget.style.color = "var(--ink)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--rule)"; e.currentTarget.style.color = "var(--ink-3)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}