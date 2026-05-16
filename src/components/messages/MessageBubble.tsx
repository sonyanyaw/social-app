"use client"

import type { User } from "@prisma/client"
import Link from "next/link"
import type { ChatMessage } from "@/hooks/useWebSocket"
import { Avatar } from "../Avatar"
import { getInitials, formatTime } from "@/lib/format"

type Props = {
  message: ChatMessage
  isMine: boolean
  isOptimistic: boolean
  showAvatar: boolean
  isLastInGroup: boolean
  otherUser: User | null
}

export function MessageBubble({
  message, isMine, isOptimistic, showAvatar, isLastInGroup, otherUser
}: Props) {
  const initials = getInitials(otherUser?.displayName)

  return (
    <div style={{
      display: "flex",
      flexDirection: isMine ? "row-reverse" : "row",
      alignItems: "flex-end",
      // Only add left gap for other-person messages that show an avatar
      // — removes the awkward empty space when no avatar is shown
      gap: (!isMine && showAvatar) ? 8 : 0,
      marginBottom: isLastInGroup ? 10 : 2,
      paddingLeft: !isMine && !showAvatar ? 36 : 0,
      opacity: isOptimistic ? 0.6 : 1,
      transition: "opacity 0.2s",
    }}>

      {/* Avatar — only rendered when it should show, takes no space otherwise */}
      {!isMine && showAvatar && (
        <Link href={`/profile/${otherUser?.username}`} style={{ display: "contents" }}>
          <Avatar src={otherUser?.avatarUrl} alt={otherUser?.displayName ?? ""} size={28} initials={initials} />
        </Link>
      )}

      <div style={{
        maxWidth: "68%",
        display: "flex",
        flexDirection: "column",
        alignItems: isMine ? "flex-end" : "flex-start",
        gap: 3,
      }}>
        {/* Bubble */}
        <div style={{
          padding: "9px 13px",
          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isMine ? "var(--ink)" : "var(--paper-2)",
          border: isMine ? "none" : "1px solid var(--rule)",
          fontSize: 14,
          lineHeight: 1.5,
          color: isMine ? "var(--paper)" : "var(--ink)",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}>
          {message.content}
        </div>

        {/* Timestamp + status on last in group */}
        {isLastInGroup && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            paddingLeft: isMine ? 0 : 4,
            paddingRight: isMine ? 4 : 0,
          }}>
            <span style={{ fontSize: 10, color: "var(--ink-3)" }}>
              {formatTime(message.sentAt)}
            </span>
            {isMine && (
              <span style={{
                fontSize: 10,
                color: message.isRead ? "var(--accent)" : "var(--ink-3)",
                display: "flex", alignItems: "center", gap: 2,
              }}>
                {isOptimistic ? (
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 4 7 11 1"/>
                  </svg>
                ) : message.isRead ? (
                  <>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 4 7 11 1"/>
                    </svg>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -6 }}>
                      <polyline points="1 4 4 7 11 1"/>
                    </svg>
                  </>
                ) : (
                  <>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 4 7 11 1"/>
                    </svg>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -6 }}>
                      <polyline points="1 4 4 7 11 1"/>
                    </svg>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}