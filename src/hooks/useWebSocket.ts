"use client"

import { useRef, useCallback } from "react"
import { useWebSocketConnection } from "@/hooks/useWebSocketConnection"

export type WSMessage =
  | { type: "connected"; userId: string }
  | { type: "message"; conversationId: string; message: ChatMessage }
  | { type: "typing"; conversationId: string; userId: string; isTyping: boolean }
  | { type: "read"; conversationId: string; userId: string; messageId: string }
  | { type: "error"; message: string }

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  sentAt: string
  sender: { id: string; displayName: string; username: string; avatarUrl: string | null }
}

type Options = {
  conversationId: string
  onMessage:   (msg: ChatMessage) => void
  onTyping:    (userId: string, isTyping: boolean) => void
  onRead:      (messageId: string, userId: string) => void
  onConnected?: () => void
}

export function useWebSocket({
  conversationId, onMessage, onTyping, onRead, onConnected
}: Options) {
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as WSMessage
    if (msg.type === "connected") onConnected?.()
    if (msg.type === "message")   onMessage(msg.message)
    if (msg.type === "typing")    onTyping(msg.userId, msg.isTyping)
    if (msg.type === "read")      onRead(msg.messageId, msg.userId)
  }, [onConnected, onMessage, onTyping, onRead])

  const { send } = useWebSocketConnection({ conversationId, onMessage: handleMessage })

  const sendMessage = useCallback((content: string) => {
    send({ type: "message", conversationId, content })
  }, [send, conversationId])

  const sendTypingRaw = useCallback((isTyping: boolean) => {
    send({ type: "typing", conversationId, isTyping })
  }, [send, conversationId])

  const sendRead = useCallback((messageId: string) => {
    send({ type: "read", conversationId, messageId })
  }, [send, conversationId])

  const sendTyping = useCallback(() => {
    sendTypingRaw(true)
    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => sendTypingRaw(false), 2000)
  }, [sendTypingRaw])

  return { sendMessage, sendTyping, sendRead }
}
