"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"

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
  const { getToken } = useAuth()
  const wsRef        = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef   = useRef<() => void>(() => {})

  const connect = useCallback(async () => {
    const token = await getToken()
    if (!token) return

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/api/ws?token=${token}&conversationId=${conversationId}`
    )
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const data: WSMessage = JSON.parse(e.data)
        if (data.type === "connected") onConnected?.()
        if (data.type === "message")   onMessage(data.message)
        if (data.type === "typing")    onTyping(data.userId, data.isTyping)
        if (data.type === "read")      onRead(data.messageId, data.userId)
      } catch {}
    }

    ws.onclose = () => {
      reconnectRef.current = setTimeout(() => connectRef.current(), 3000)
    }

    ws.onerror = () => ws.close()
  }, [conversationId, getToken, onMessage, onTyping, onRead, onConnected])

  useEffect(() => { connectRef.current = connect }, [connect])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (typingRef.current)    clearTimeout(typingRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "message", conversationId, content }))
  }, [conversationId])

  const sendTypingRaw = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "typing", conversationId, isTyping }))
  }, [conversationId])

  const sendRead = useCallback((messageId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: "read", conversationId, messageId }))
  }, [conversationId])

  const sendTyping = useCallback(() => {
    sendTypingRaw(true)
    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => sendTypingRaw(false), 2000)
  }, [sendTypingRaw])

  return { sendMessage, sendTyping, sendRead }
}