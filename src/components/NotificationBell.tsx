"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Avatar } from "@/components/Avatar"
import { useWebSocketConnection } from "@/hooks/useWebSocketConnection"
import { timeAgo } from "@/lib/format"

type NotifType = "LIKE" | "COMMENT" | "FOLLOW" | "MESSAGE"

type Notification = {
  id:            string
  type:          NotifType
  actorName:     string
  actorUsername: string
  actorAvatar:   string | null
  postPreview:   string | null
  postId:        string | null
  isRead:        boolean
  createdAt:     string
}

function notifLabel(n: Notification): string {
  switch (n.type) {
    case "LIKE":    return `liked your post`
    case "COMMENT": return `commented on your post`
    case "FOLLOW":  return `started following you`
    case "MESSAGE": return `sent you a message`
  }
}

function notifHref(n: Notification): string {
  switch (n.type) {
    case "LIKE":
    case "COMMENT": return n.postId ? `/feed#${n.postId}` : "/feed"
    case "FOLLOW":  return `/profile/${n.actorUsername}`
    case "MESSAGE": return "/messages"
  }
}

function NotifIcon({ type }: { type: NotifType }) {
  const color = type === "LIKE"    ? "#c84b2f"
              : type === "COMMENT" ? "#3B8BD4"
              : type === "FOLLOW"  ? "#1D9E75"
              :                      "#7F77DD"
  return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      background: color + "22",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {type === "LIKE" && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill={color} stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      )}
      {type === "COMMENT" && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )}
      {type === "FOLLOW" && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      )}
      {type === "MESSAGE" && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )}
    </div>
  )
}


export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef<Set<string>>(new Set())

  const addNotif = useCallback((n: Notification) => {
    if (seenIds.current.has(n.id)) return
    seenIds.current.add(n.id)
    setNotifs((prev) => [n, ...prev].slice(0, 30))
  }, [])

  // Load from DB on mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data: Notification[]) => {
        if (Array.isArray(data)) data.forEach((n) => addNotif(n))
      })
      .catch(() => {})
  }, [addNotif])

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; notification: Notification & { postId?: string | null } }
    if (msg.type === "notification")
      addNotif({ ...msg.notification, postId: msg.notification.postId ?? null })
  }, [addNotif])

  useWebSocketConnection({
    conversationId: "__notifications__",
    onMessage: handleMessage,
    reconnectDelay: 4000,
  })

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unreadCount = notifs.filter((n) => !n.isRead).length

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    fetch("/api/notifications/read", { method: "POST" }).catch(() => {})
  }



  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unreadCount > 0) markAllRead() }}
        style={{
          position: "relative", width: 34, height: 34,
          borderRadius: "50%", border: "1px solid var(--rule)",
          background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-2)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "var(--accent)", border: "2px solid var(--paper)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 600, color: "white", padding: "0 3px",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, background: "var(--paper-2)",
          border: "1px solid var(--rule)", borderRadius: "var(--radius-lg)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)", zIndex: 200, overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 14px", borderBottom: "1px solid var(--rule)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Notifications</span>
            {notifs.some((n) => !n.isRead) && (
              <button onClick={markAllRead} style={{
                fontSize: 11, color: "var(--ink-3)", background: "none",
                border: "none", cursor: "pointer", padding: 0,
              }}>
                Mark all read
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={notifHref(n)}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 14px",
                    background: n.isRead ? "transparent" : "var(--accent-soft)",
                    borderBottom: "1px solid var(--rule)",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar src={n.actorAvatar} alt={n.actorName} size={32} initials={n.actorName[0]?.toUpperCase() ?? "?"} />
                    <div style={{ position: "absolute", bottom: -2, right: -2 }}>
                      <NotifIcon type={n.type} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.4 }}>
                      <b style={{ fontWeight: 500 }}>{n.actorName}</b>{" "}
                      <span style={{ color: "var(--ink-2)" }}>{notifLabel(n)}</span>
                    </p>
                    {n.postPreview && (
                      <p style={{
                        margin: "3px 0 0", fontSize: 11, color: "var(--ink-3)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {n.postPreview}
                      </p>
                    )}
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ink-3)" }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}