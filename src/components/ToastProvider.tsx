"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useWebSocketConnection } from "@/hooks/useWebSocketConnection"

type MessageToast = {
  id: string
  kind: "message"
  conversationId: string
  senderName: string
  senderAvatar: string | null
  content: string
}

type ErrorToast = {
  id: string
  kind: "error"
  message: string
}

type Toast = MessageToast | ErrorToast

type ToastCtx = {
  addToast: (t: Omit<MessageToast, "id" | "kind">) => void
  addErrorToast: (message: string) => void
}
const ToastContext = createContext<ToastCtx>({ addToast: () => {}, addErrorToast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<MessageToast, "id" | "kind">) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { ...t, kind: "message", id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000)
  }, [])

  const addErrorToast = useCallback((message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { kind: "error", message, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; notification: Omit<MessageToast, "id" | "kind"> & { conversationId: string } }
    if (msg.type === "notification") {
      const isInConversation = window.location.pathname.includes(msg.notification.conversationId)
      if (!isInConversation) addToast(msg.notification)
    }
  }, [addToast])

  useWebSocketConnection({
    conversationId: "__notifications__",
    onMessage: handleMessage,
    reconnectDelay: 4000,
  })

  return (
    <ToastContext.Provider value={{ addToast, addErrorToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map((toast) =>
          toast.kind === "error"
            ? <ErrorToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
            : <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        )}
      </div>
    </ToastContext.Provider>
  )
}

function ErrorToastItem({ toast, onDismiss }: { toast: ErrorToast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      pointerEvents: "all", width: 320,
      background: "var(--paper-2)", border: "1px solid color-mix(in srgb, red 30%, var(--rule))",
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      animation: "slideInUp 0.25s ease both",
      opacity: visible ? 1 : 0, transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ margin: 0, flex: 1, fontSize: 13, color: "var(--ink)" }}>{toast.message}</p>
        <button
          onClick={onDismiss}
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
      </div>
      <div style={{ height: 2, background: "var(--rule-2)" }}>
        <div style={{ height: "100%", background: "var(--accent)", animation: "shrink 4s linear forwards" }} />
      </div>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: MessageToast; onDismiss: () => void }) {
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