"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"

type Notification = {
  id: string
  conversationId: string
  senderName: string
  senderAvatar: string | null
  content: string
  sentAt: string
  isRead: boolean
}

export function NotificationBell() {
  const { getToken } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef<Set<string>>(new Set())

  // Deduplicated add — ignores anything with an ID we've already seen
  const addNotif = useCallback((n: Notification) => {
    if (seenIds.current.has(n.id)) return
    seenIds.current.add(n.id)
    setNotifs((prev) => [n, ...prev].slice(0, 20))
  }, [])

  // Load initial notifications from API
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: Notification[]) => {
        data.forEach((n) => addNotif(n))
      })
      .catch(() => {})
  }, [addNotif])

  // Listen for new messages via WS
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnect: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    async function connect() {
      const token = await getToken()
      if (!token || cancelled) return

      const protocol = window.location.protocol === "https:" ? "wss" : "ws"
      ws = new WebSocket(
        `${protocol}://${window.location.host}/api/ws?token=${token}&conversationId=__notifications__`
      )

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === "notification") {
            addNotif({ ...data.notification, isRead: false, sentAt: new Date().toISOString() })
          }
        } catch {}
      }

      ws.onclose = () => {
        if (!cancelled) reconnect = setTimeout(connect, 4000)
      }
      ws.onerror = () => ws?.close()
    }

    connect()
    return () => {
      cancelled = true
      if (reconnect) clearTimeout(reconnect)
      ws?.close()
    }
  }, [getToken, addNotif])

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
    seenIds.current = new Set(notifs.map((n) => n.id))
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    fetch("/api/notifications/read", { method: "POST" }).catch(() => {})
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => {
          setOpen((o) => !o)
          if (!open && unreadCount > 0) markAllRead()
        }}
        style={{
          position: "relative", width: 34, height: 34,
          borderRadius: "50%", border: "1px solid var(--rule)",
          background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-2)", transition: "border-color 0.15s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
          width: 300, background: "var(--paper-2)",
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
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={`/messages/${n.conversationId}`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", gap: 10, padding: "10px 14px",
                    background: n.isRead ? "transparent" : "var(--accent-soft)",
                    borderBottom: "1px solid var(--rule)",
                    textDecoration: "none", transition: "background 0.1s",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "var(--rule-2)", border: "1px solid var(--rule)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 500, color: "var(--accent)", overflow: "hidden",
                  }}>
                    {n.senderAvatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={n.senderAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : n.senderName[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", fontWeight: n.isRead ? 400 : 500 }}>
                      <b style={{ fontWeight: 500 }}>{n.senderName}</b> sent you a message
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.content}
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