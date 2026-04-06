export function PostCardFallback() {
  return (
    <div style={{
      padding: "20px 0 20px 48px",
      borderBottom: "1px solid var(--rule)",
    }}>
      <div style={{
        fontSize: 13, color: "var(--ink-3)",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        This post couldn&apos;t be displayed.
      </div>
    </div>
  )
}