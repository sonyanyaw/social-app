"use client"

import { useState, useTransition } from "react"

type Props = {
  username: string
  initialFollowing: boolean
}

export function FollowButton({ username, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [hovered, setHovered] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${username}/follow`, { method: "POST" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setFollowing(data.following)
      } catch {}
    })
  }

  const label = following
    ? hovered ? "Unfollow" : "Following"
    : "Follow"

  const isDanger = following && hovered

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "7px 18px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        cursor: isPending ? "default" : "pointer",
        flexShrink: 0,
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
        border: following
          ? `1px solid ${isDanger ? "var(--accent)" : "var(--rule)"}`
          : "none",
        background: following
          ? isDanger ? "var(--accent-soft)" : "var(--rule-2)"
          : "var(--ink)",
        color: following
          ? isDanger ? "var(--accent)" : "var(--ink-2)"
          : "var(--paper)",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? "…" : label}
    </button>
  )
}