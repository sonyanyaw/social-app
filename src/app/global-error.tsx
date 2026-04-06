"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", margin: 0 }}>
        <main style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", textAlign: "center",
          background: "#faf8f5",
        }}>
          <p style={{ fontSize: 22, fontWeight: 500, marginBottom: 10, color: "#1a1714" }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 15, color: "#8a8784", marginBottom: 28 }}>
            An unexpected error occurred. Please try refreshing.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px", borderRadius: 999,
              background: "#1a1714", color: "#faf8f5",
              border: "none", fontSize: 14, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </main>
      </body>
    </html>
  )
}