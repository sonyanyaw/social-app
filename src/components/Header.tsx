"use client"

import Link from "next/link"
import { UserButton, useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { UserSearch } from "@/components/UserSearch"
import { NotificationBell } from "@/components/NotificationBell"

export function Header() {
  const path = usePathname()
  const { user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: "/feed",     label: "Feed"     },
    { href: "/messages", label: "Messages" },
    { href: user?.username ? `/profile/${user.username}` : "/profile",  label: "Profile"  },
  ]

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(250,248,245,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--rule)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {/* Wordmark */}
        <Link href="/feed" style={{
          fontFamily: "var(--font-serif)", fontSize: 22,
          color: "var(--ink)", textDecoration: "none",
          letterSpacing: "-0.02em", flexShrink: 0,
        }}>
          Pulse
        </Link>

        {/* Search — desktop only, controlled by .h-search in globals.css */}
        <div className="h-search">
          <UserSearch />
        </div>

        {/* Desktop nav — controlled by .h-nav in globals.css */}
        <nav className="h-nav">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontSize: 13,
              fontWeight: path.startsWith(href) ? 500 : 400,
              color: path.startsWith(href) ? "var(--ink)" : "var(--ink-3)",
              textDecoration: "none", padding: "5px 10px",
              borderRadius: "var(--radius)",
              background: path.startsWith(href) ? "var(--rule-2)" : "transparent",
              transition: "color 0.15s, background 0.15s",
            }}>
              {label}
            </Link>
          ))}
          <div style={{ width: 1, height: 20, background: "var(--rule)", margin: "0 6px" }} />
          <NotificationBell />
          <div style={{ width: 8 }} />
          <UserButton appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }} />
        </nav>

        {/* Mobile right — controlled by .h-mobile-right in globals.css */}
        <div className="h-mobile-right">
          <NotificationBell />
          <UserButton appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }} />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius)",
              border: "1px solid var(--rule)",
              background: menuOpen ? "var(--rule-2)" : "transparent",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "var(--ink-2)", flexShrink: 0,
            }}
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — only renders when menuOpen, always hidden on desktop */}
      {menuOpen && (
        <div style={{
          borderTop: "1px solid var(--rule)",
          background: "var(--paper)",
          padding: "12px 16px 16px",
        }}>
          <div style={{ marginBottom: 10 }}>
            <UserSearch />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href} href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 15, padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  color: path.startsWith(href) ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: path.startsWith(href) ? 500 : 400,
                  background: path.startsWith(href) ? "var(--rule-2)" : "transparent",
                  textDecoration: "none", display: "block",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}