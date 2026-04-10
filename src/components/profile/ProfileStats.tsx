"use client"

import { useState } from "react"
import { FollowListModal } from "@/components/profile/FollowListModal"

type Props = {
  username: string
  postCount: number
  followerCount: number
  followingCount: number
}

type ModalType = "followers" | "following" | null

export function ProfileStats({ username, postCount, followerCount, followingCount }: Props) {
  const [modal, setModal] = useState<ModalType>(null)

  const stats = [
    { key: "posts",     label: "posts",     value: postCount,     clickable: false },
    { key: "followers", label: "followers", value: followerCount, clickable: true  },
    { key: "following", label: "following", value: followingCount, clickable: true  },
  ] as const

  return (
    <>
      <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
        {stats.map(({ key, label, value, clickable }) => (
          <button
            key={key}
            onClick={() => clickable ? setModal(key as "followers" | "following") : undefined}
            style={{
              background: "none", border: "none", padding: 0,
              cursor: clickable ? "pointer" : "default",
              display: "flex", alignItems: "baseline", gap: 4,
            }}
            onMouseEnter={(e) => {
              if (clickable) {
                const span = e.currentTarget.querySelector("span:last-child") as HTMLElement
                if (span) span.style.textDecoration = "underline"
              }
            }}
            onMouseLeave={(e) => {
              if (clickable) {
                const span = e.currentTarget.querySelector("span:last-child") as HTMLElement
                if (span) span.style.textDecoration = "none"
              }
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{value}</span>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{label}</span>
          </button>
        ))}
      </div>

      {modal && (
        <FollowListModal
          username={username}
          type={modal}
          count={modal === "followers" ? followerCount : followingCount}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}