"use client"

import { useState, useTransition } from "react"
import type { Post, User, MediaFile } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { MediaUpload } from "@/components/ui/MediaUpload"
import { Avatar } from "../Avatar"
import { getInitials } from "@/lib/format"

type UploadedFile = { key: string; publicUrl: string; name: string; size: number }
type PostWithRelations = Post & { user: User; mediaFiles: MediaFile[] }
type Visibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE"

export function PostComposer({ onPost }: { onPost?: (post: PostWithRelations) => void } = {}) {
  const { user } = useUser()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState("")
  const [media, setMedia] = useState<UploadedFile[]>([])
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC")
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [mediaKey, setMediaKey] = useState(0) // increment to force MediaUpload remount

  const charLimit = 500
  const remaining = charLimit - content.length
  const canPost = content.trim().length > 0 && remaining >= 0 && !isPending

  const initials = getInitials(user?.fullName)

  async function handleSubmit() {
    if (!canPost) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            visibility,
            mediaKeys: media.map((f) => ({ key: f.key, publicUrl: f.publicUrl })),
          }),
        })
        if (!res.ok) { setError(await res.text()); return }
        const post = await res.json() as PostWithRelations
        setContent("")
        setMedia([])
        setVisibility("PUBLIC")
        setFocused(false)
        setMediaKey((k) => k + 1) // force MediaUpload to remount and clear its internal state
        if (onPost) onPost(post)
        else router.refresh()
      } catch { setError("Something went wrong.") }
    })
  }

  return (
    <div
      data-composer="true"
      style={{
        background: "var(--paper-2)",
        border: `1px solid ${focused ? "#c0bbb5" : "var(--rule)"}`,
        borderRadius: "var(--radius-lg)",
        padding: 16,
        transition: "border-color 0.15s",
      }}>
      {/* onMouseDown on inner elements prevents textarea blur when clicking within composer */}
      <div style={{ display: "flex", gap: 12 }}>
        {/* Avatar */}
        <Avatar src={user?.imageUrl} alt={user?.fullName ?? ""} size={36} initials={initials} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              // Delay so clicks inside composer (visibility, file input) register first
              setTimeout(() => {
                const active = document.activeElement
                const composer = document.querySelector("[data-composer]")
                if (!composer?.contains(active)) {
                  if (!content.trim() && media.length === 0) setFocused(false)
                }
              }, 150)
            }}
            placeholder="What's on your mind?"
            maxLength={charLimit}
            rows={focused || content ? 3 : 1}
            style={{
              width: "100%", resize: "none", border: "none", outline: "none",
              background: "transparent", fontSize: 15, color: "var(--ink)",
              fontFamily: "var(--font-sans)", lineHeight: 1.6,
              boxSizing: "border-box", transition: "height 0.15s",
            }}
          />
        </div>
      </div>

      {/* Media — show once focused, keep visible until post is submitted */}
      {(focused || content.length > 0 || media.length > 0) && (
        <div style={{ marginTop: 12 }}>
          <MediaUpload key={mediaKey} onUpload={setMedia} maxFiles={4} maxSizeMB={10} />
        </div>
      )}

      {/* Footer */}
      {(focused || content.length > 0) && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--rule)",
        }}>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            style={{
              fontSize: 12, color: "var(--ink-2)",
              background: "var(--rule-2)", border: "1px solid var(--rule)",
              borderRadius: "var(--radius)", padding: "4px 8px", cursor: "pointer",
            }}
          >
            <option value="PUBLIC">Everyone</option>
            <option value="FOLLOWERS">Followers only</option>
            <option value="PRIVATE">Only me</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 12,
              color: remaining < 50
                ? remaining < 0 ? "#c84b2f" : "#c4860a"
                : "var(--ink-3)",
            }}>{remaining}</span>

            <button
              onClick={handleSubmit}
              disabled={!canPost}
              style={{
                fontSize: 13, fontWeight: 500, padding: "7px 18px",
                borderRadius: 999, border: "none", cursor: canPost ? "pointer" : "default",
                background: canPost ? "var(--ink)" : "var(--rule)",
                color: canPost ? "var(--paper)" : "var(--ink-3)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ marginTop: 8, fontSize: 12, color: "var(--accent)" }}>{error}</p>}
    </div>
  )
}