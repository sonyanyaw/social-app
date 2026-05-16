"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useWebSocket, type ChatMessage } from "@/hooks/useWebSocket"
import { MessageBubble } from "@/components/messages/MessageBubble"
import { useToast } from "@/components/ToastProvider"
import { getInitials } from "@/lib/format"
import type { Message, User } from "@prisma/client"
import { Avatar } from "../Avatar"

type MessageWithSender = Message & { sender: User }

type Props = {
  conversationId: string
  initialMessages: MessageWithSender[]
  currentUser: User
  otherUser: User | null
}

export function ChatWindow({ conversationId, initialMessages, currentUser, otherUser }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({
      id:             m.id,
      conversationId: m.conversationId,
      senderId:       m.senderId,
      content:        m.content,
      isRead:         m.isRead,
      sentAt:         m.sentAt.toISOString(),
      sender: {
        id:          m.sender.id,
        displayName: m.sender.displayName,
        username:    m.sender.username,
        avatarUrl:   m.sender.avatarUrl,
      },
    }))
  )
  const [input, setInput] = useState("")
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const { addErrorToast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  // Keep a ref to sendRead so callbacks can use the latest version
  const sendReadRef = useRef<(id: string) => void>(() => {})

  // Called once WS handshake completes — mark any unread messages from initial load
  const onConnected = useCallback(() => {
    setConnected(true)
    setMessages((prev) => {
      const lastUnread = [...prev].reverse().find(
        (m) => m.senderId !== currentUser.id && !m.isRead
      )
      if (lastUnread) {
        sendReadRef.current(lastUnread.id)
        return prev.map((m) =>
          m.senderId !== currentUser.id ? { ...m, isRead: true } : m
        )
      }
      return prev
    })
  }, [currentUser.id])

  // Called when a new message arrives over WS
  const onMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      let next: ChatMessage[]

      if (msg.senderId === currentUser.id) {
        // Own message echoed back — replace optimistic placeholder
        const tmpIdx = prev.findIndex(
          (m) => m.id.startsWith("tmp-") && m.content === msg.content
        )
        if (tmpIdx !== -1) {
          next = [...prev]
          next[tmpIdx] = msg
          return next
        }
      }

      // Deduplicate
      if (prev.some((m) => m.id === msg.id)) return prev
      next = [...prev, msg]

      // If it's from the other person and WS is open, mark as read immediately
      if (msg.senderId !== currentUser.id) {
        sendReadRef.current(msg.id)
        return next.map((m) =>
          m.id === msg.id ? { ...m, isRead: true } : m
        )
      }

      return next
    })
  }, [currentUser.id])

  const onTyping = useCallback((userId: string, isTyping: boolean) => {
    if (userId === currentUser.id) return
    setTypingUsers((prev) => {
      const next = new Set(prev)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isTyping ? next.add(userId) : next.delete(userId)
      return next
    })
  }, [currentUser.id])

  const onRead = useCallback((_messageId: string, userId: string) => {
    if (userId === currentUser.id) return
    // Other person read our messages — mark all ours as read
    setMessages((prev) =>
      prev.map((m) =>
        m.senderId === currentUser.id ? { ...m, isRead: true } : m
      )
    )
  }, [currentUser.id])

  const { sendMessage, sendTyping, sendRead } = useWebSocket({
    conversationId,
    onMessage,
    onTyping,
    onRead,
    onConnected,
  })

  // Keep sendReadRef current so onConnected/onMessage callbacks can call it
  useEffect(() => {
    sendReadRef.current = sendRead
  }, [sendRead])

  // Scroll to bottom on new messages or typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typingUsers])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    if (!connected) {
      addErrorToast("Not connected — try again in a moment")
      return
    }
    setSending(true)

    const tmpId = `tmp-${Date.now()}`
    const optimistic: ChatMessage = {
      id:             tmpId,
      conversationId,
      senderId:       currentUser.id,
      content,
      isRead:         false,
      sentAt:         new Date().toISOString(),
      sender: {
        id:          currentUser.id,
        displayName: currentUser.displayName,
        username:    currentUser.username,
        avatarUrl:   currentUser.avatarUrl,
      },
    }
    setMessages((prev) => [...prev, optimistic])
    setInput("")
    setSending(false)
    inputRef.current?.focus()
    sendMessage(content)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const otherInitials = getInitials(otherUser?.displayName)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", minHeight: 0 }}>

      {/* Header */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--rule)",
        display: "flex", alignItems: "center", gap: 12,
        flexShrink: 0, background: "var(--paper)",
      }}>
        <Link href={`/profile/${otherUser?.username}`} style={{ display: "contents" }}>
          <Avatar src={otherUser?.avatarUrl} alt={otherUser?.displayName ?? ""} size={34} initials={otherInitials} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
              {otherUser?.displayName ?? "Unknown"}
            </p>
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
              @{otherUser?.username}
              {connected && (
                <span style={{ marginLeft: 6, color: "var(--accent)", fontSize: 11 }}>● online</span>
              )}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px",
        display: "flex", flexDirection: "column", gap: 2,
        minHeight: 0,  
        WebkitOverflowScrolling: "touch", 
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13, margin: "auto" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginBottom: 4 }}>Say hello</p>
            <p>Start the conversation with {otherUser?.displayName}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine      = msg.senderId === currentUser.id
          const isOptimistic = msg.id.startsWith("tmp-")
          const nextMsg     = messages[i + 1]
          const prevMsg     = messages[i - 1]
          const showAvatar  = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId)
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              isOptimistic={isOptimistic}
              showAvatar={showAvatar}
              isLastInGroup={isLastInGroup}
              otherUser={otherUser}
            />
          )
        })}

        {typingUsers.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", paddingLeft: 46 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)",
                  animation: "bounce 1.2s ease infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
            <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 20px", borderTop: "1px solid var(--rule)",
        flexShrink: 0, background: "var(--paper)",   /* never compress */
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "center",
          background: "var(--paper-2)", border: "1px solid var(--rule)",
          borderRadius: 24, padding: "8px 8px 8px 16px",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); sendTyping() }}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={1}
            style={{
              flex: 1, resize: "none", border: "none", outline: "none",
              background: "transparent", fontSize: 14, color: "var(--ink)",
              fontFamily: "var(--font-sans)", lineHeight: 1.5,
              maxHeight: 120, overflowY: "auto",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              flexShrink: 0, cursor: input.trim() ? "pointer" : "default",
              background: input.trim() ? "var(--ink)" : "var(--rule)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={input.trim() ? "var(--paper)" : "var(--ink-3)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: "rotate(90deg)" }}>
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, paddingLeft: 4 }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}