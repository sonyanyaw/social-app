"use client"

import { Component, type ReactNode } from "react"

type Props = {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
    console.error("[ErrorBoundary]", error)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <DefaultFallback error={this.state.error} reset={this.reset} />
      )
    }
    return this.props.children
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      padding: "20px",
      background: "var(--paper-2)",
      border: "1px solid var(--rule)",
      borderRadius: "var(--radius-lg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Something went wrong
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        style={{
          fontSize: 13, padding: "6px 16px",
          borderRadius: 999, border: "1px solid var(--rule)",
          background: "transparent", color: "var(--ink-2)",
          cursor: "pointer", fontFamily: "var(--font-sans)",
        }}
      >
        Try again
      </button>
    </div>
  )
}