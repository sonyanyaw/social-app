"use client"

import { usePathname, useRouter } from "next/navigation"

export function MessagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const inConversation = pathname !== "/messages"

  return (
    <div className={`messages-shell${inConversation ? " in-conversation" : ""}`}>
      {inConversation && (
        <button
          className="mobile-back-btn"
          onClick={() => router.push("/messages")}
          aria-label="Back to conversations"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Messages
        </button>
      )}
      {children}
    </div>
  )
}