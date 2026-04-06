import Link from "next/link"

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100dvh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
    }}>
      <p style={{
        fontFamily: "var(--font-serif)",
        fontSize: "clamp(60px, 12vw, 100px)",
        lineHeight: 1, color: "var(--rule)", marginBottom: 24,
      }}>
        404
      </p>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 24, marginBottom: 10 }}>
        Page not found
      </p>
      <p style={{ fontSize: 15, color: "var(--ink-3)", marginBottom: 32 }}>
        This page doesn&apos;t exist or was removed.
      </p>
      <Link href="/feed" style={{
        padding: "10px 24px", borderRadius: 999,
        background: "var(--ink)", color: "var(--paper)",
        textDecoration: "none", fontSize: 14, fontWeight: 500,
      }}>
        Go to feed
      </Link>
    </main>
  )
}