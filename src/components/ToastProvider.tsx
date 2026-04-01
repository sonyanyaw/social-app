"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"

type Toast = {
  id: string
  conversationId: string
  senderName: string
  senderAvatar: string | null
  content: string
}

type ToastCtx = { addToast: (t: Omit<Toast, "id">) => void }
const ToastContext = createContext<ToastCtx>({ addToast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const { getToken } = useAuth()
  const wsRef        = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectingRef = useRef(false)

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function connect() {
      if (
        connectingRef.current ||
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) return

      connectingRef.current = true
      const token = await getToken()
      connectingRef.current = false

      if (!token || cancelled) return

      const protocol = window.location.protocol === "https:" ? "wss" : "ws"
      const ws = new WebSocket(
        `${protocol}://${window.location.host}/api/ws?token=${token}&conversationId=__notifications__`
      )
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === "notification") {
            const isInConversation = window.location.pathname.includes(
              data.notification.conversationId
            )
            if (!isInConversation) addToast(data.notification)
          }
        } catch {}
      }

      ws.onclose = () => {
        wsRef.current = null
        if (!cancelled) {
          reconnectRef.current = setTimeout(connect, 4000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)

      wsRef.current?.close()
      wsRef.current = null
    }

  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const initials = toast.senderName
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={{
        pointerEvents: "all", width: 320,
        background: "var(--paper-2)", border: "1px solid var(--rule)",
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        animation: "slideInUp 0.25s ease both",
        opacity: visible ? 1 : 0, transition: "opacity 0.2s",
      }}>
        <Link
          href={`/messages/${toast.conversationId}`}
          onClick={onDismiss}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", textDecoration: "none" }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "var(--accent-soft)", border: "1px solid var(--rule)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 500, color: "var(--accent)", overflow: "hidden",
          }}>
            {toast.senderAvatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={toast.senderAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
              {toast.senderName}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {toast.content}
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss() }}
            style={{
              width: 20, height: 20, borderRadius: "50%", border: "none",
              background: "var(--rule)", cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
            </svg>
          </button>
        </Link>
        <div style={{ height: 2, background: "var(--rule-2)" }}>
          <div style={{ height: "100%", background: "var(--accent)", animation: "shrink 5s linear forwards" }} />
        </div>
      </div>
    </>
  )
}