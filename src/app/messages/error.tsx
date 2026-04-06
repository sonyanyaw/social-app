"use client"

import { useEffect } from "react"
import { Header } from "@/components/Header"

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Messages error]", error)
  }, [error])

  return (
    <>
      <Header />
      <div style={{
        maxWidth: 640, margin: "0 auto",
        padding: "80px 20px", textAlign: "center",
      }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 12 }}>
          Messages unavailable
        </p>
        <p style={{ fontSize: 15, color: "var(--ink-3)", marginBottom: 28, lineHeight: 1.6 }}>
          Something went wrong loading your messages.
          <br />No data was lost.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px", borderRadius: 999,
            background: "var(--ink)", color: "var(--paper)",
            border: "none", fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          Try again
        </button>
      </div>
    </>
  )
}