"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"

type Options = {
  conversationId: string
  onMessage: (data: unknown) => void
  reconnectDelay?: number
}

export function useWebSocketConnection({
  conversationId,
  onMessage,
  reconnectDelay = 3000,
}: Options) {
  const { getToken } = useAuth()
  const wsRef         = useRef<WebSocket | null>(null)
  const reconnectRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectingRef = useRef(false)
  const cancelledRef  = useRef(false)
  const connectRef    = useRef<() => void>(() => {})
  const onMessageRef  = useRef(onMessage)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const connect = useCallback(async () => {
    if (
      connectingRef.current ||
      cancelledRef.current ||
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) return

    connectingRef.current = true
    const token = await getToken()
    connectingRef.current = false

    if (!token || cancelledRef.current) return

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/api/ws?token=${token}&conversationId=${conversationId}`
    )
    wsRef.current = ws

    ws.onmessage = (e) => {
      try { onMessageRef.current(JSON.parse(e.data)) } catch {}
    }
    ws.onclose = () => {
      wsRef.current = null
      if (!cancelledRef.current) {
        reconnectRef.current = setTimeout(() => connectRef.current(), reconnectDelay)
      }
    }
    ws.onerror = () => ws.close()
  }, [conversationId, getToken, reconnectDelay])

  useEffect(() => { connectRef.current = connect }, [connect])

  useEffect(() => {
    cancelledRef.current = false
    connect()
    return () => {
      cancelledRef.current = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(data))
  }, [])

  return { send }
}
