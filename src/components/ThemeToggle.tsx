"use client"

import { useState, useRef, useEffect } from "react"
import { useTheme } from "@/components/ThemeProvider"

const options = [
  {
    value: "light" as const,
    label: "Light",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    value: "dark" as const,
    label: "Dark",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
  },
  {
    value: "system" as const,
    label: "System",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const current = options.find((o) => o.value === theme) ?? options[2]

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        style={{
          width: 34, height: 34, borderRadius: "50%",
          border: "1px solid var(--rule)",
          background: "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-2)",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        {current.icon}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: "var(--radius-lg)",
          padding: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          zIndex: 200,
          minWidth: 120,
          animation: "fadeUp 0.15s ease both",
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTheme(opt.value); setOpen(false) }}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                borderRadius: 6,
                border: "none",
                background: theme === opt.value ? "var(--rule-2)" : "transparent",
                cursor: "pointer",
                color: theme === opt.value ? "var(--ink)" : "var(--ink-2)",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                fontWeight: theme === opt.value ? 500 : 400,
                textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (theme !== opt.value)
                  (e.currentTarget as HTMLElement).style.background = "var(--rule-2)"
              }}
              onMouseLeave={(e) => {
                if (theme !== opt.value)
                  (e.currentTarget as HTMLElement).style.background = "transparent"
              }}
            >
              {opt.icon}
              {opt.label}
              {theme === opt.value && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ marginLeft: "auto" }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}