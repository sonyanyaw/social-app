"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  username: string
  displayName: string
  bio: string
  avatarUrl: string | null
}

export function ProfileEditForm({ user }: { user: User }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = displayName
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be under 5 MB")
      return
    }

    setUploadingAvatar(true)
    setError(null)

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)

    try {
      // Get presigned upload URL
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      })
      if (!res.ok) throw new Error("Failed to get upload URL")
      const { uploadUrl, token, publicUrl } = await res.json()

      // Upload directly to Supabase Storage
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "Authorization": `Bearer ${token}`,
        },
        body: file,
      })
      if (!upload.ok) throw new Error("Upload failed")

      setAvatarUrl(publicUrl)
    } catch {
      setError("Failed to upload image. Try again.")
      setAvatarPreview(user.avatarUrl)
      setAvatarUrl(user.avatarUrl)
    } finally {
      setUploadingAvatar(false)
    }
  }

  function handleSubmit() {
    if (!displayName.trim()) { setError("Display name is required"); return }
    setError(null)
    setSaved(false)

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: displayName.trim(),
            bio: bio.trim(),
            avatarUrl,
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--accent-soft)", border: "1px solid var(--rule)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 500, color: "var(--accent)", overflow: "hidden",
          }}>
            {avatarPreview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          {uploadingAvatar && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: "spin 0.8s linear infinite" }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <circle cx="10" cy="10" r="8" stroke="var(--ink-3)" strokeWidth="2" fill="none" strokeDasharray="30" strokeDashoffset="10"/>
              </svg>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              fontSize: 13, padding: "7px 16px", borderRadius: 999,
              border: "1px solid var(--rule)", background: "transparent",
              color: "var(--ink-2)", cursor: uploadingAvatar ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
              opacity: uploadingAvatar ? 0.6 : 1,
            }}
          >
            {uploadingAvatar ? "Uploading…" : "Change photo"}
          </button>
          {avatarUrl && (
            <button
              onClick={() => { setAvatarUrl(null); setAvatarPreview(null) }}
              style={{
                fontSize: 12, padding: "4px 0",
                background: "none", border: "none",
                color: "var(--accent)", cursor: "pointer",
                fontFamily: "var(--font-sans)", textAlign: "left",
              }}
            >
              Remove photo
            </button>
          )}
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
            JPG, PNG or WebP · max 5 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
      </div>

      {/* Display name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          Display name
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          placeholder="Your name"
          style={{
            padding: "10px 12px", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--rule)", background: "var(--paper-2)",
            fontSize: 15, color: "var(--ink)", fontFamily: "var(--font-sans)",
            outline: "none", width: "100%",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#c0bbb5")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--rule)")}
        />
        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, textAlign: "right" }}>
          {50 - displayName.length} characters left
        </p>
      </div>

      {/* Username — read only */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          Username
        </label>
        <div style={{
          padding: "10px 12px", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--rule)", background: "var(--rule-2)",
          fontSize: 15, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ color: "var(--ink-3)" }}>@</span>
          <span>{user.username}</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
          Username cannot be changed.
        </p>
      </div>

      {/* Bio */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Tell people a bit about yourself…"
          style={{
            padding: "10px 12px", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--rule)", background: "var(--paper-2)",
            fontSize: 15, color: "var(--ink)", fontFamily: "var(--font-sans)",
            outline: "none", resize: "none", width: "100%", lineHeight: 1.6,
          }}
          onFocus={(e) => (e.target.style.borderColor = "#c0bbb5")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--rule)")}
        />
        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, textAlign: "right" }}>
          {200 - bio.length} characters left
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--accent)" }}>{error}</p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={isPending || uploadingAvatar}
          style={{
            fontSize: 14, fontWeight: 500, padding: "10px 28px",
            borderRadius: 999, border: "none",
            background: isPending ? "var(--rule)" : "var(--ink)",
            color: isPending ? "var(--ink-3)" : "var(--paper)",
            cursor: isPending || uploadingAvatar ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
            transition: "background 0.15s",
          }}
        >
          {isPending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>

        <button
          onClick={() => router.push(`/profile/${user.username}`)}
          style={{
            fontSize: 14, padding: "10px 20px", borderRadius: 999,
            border: "1px solid var(--rule)", background: "transparent",
            color: "var(--ink-2)", cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}