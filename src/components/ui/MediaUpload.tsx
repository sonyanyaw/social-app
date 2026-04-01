"use client"

import { useState, useRef, useCallback } from "react"
import { uploadFile } from "@/hooks/useUpload"

type UploadedFile = {
  key: string
  publicUrl: string
  name: string
  preview: string
  size: number
}

type Props = {
  onUpload?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
}

export function MediaUpload({
  onUpload,
  maxFiles = 4,
  maxSizeMB = 10,
  accept = "image/*,video/*",
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    async (raw: FileList | File[]) => {
      const list = Array.from(raw)
      setErrors([])

      const tooBig = list.filter((f) => f.size > maxSizeMB * 1024 * 1024)
      if (tooBig.length) {
        setErrors((e) => [...e, `${tooBig.map((f) => f.name).join(", ")} exceeds ${maxSizeMB} MB`])
      }

      const valid = list
        .filter((f) => f.size <= maxSizeMB * 1024 * 1024)
        .slice(0, maxFiles - files.length)

      if (!valid.length) return

      setUploading((u) => [...u, ...valid.map((f) => f.name)])

      await Promise.all(
        valid.map(async (file) => {
          const preview = URL.createObjectURL(file)
          try {
            const { publicUrl, key } = await uploadFile(file)
            const uploaded: UploadedFile = {
              key,
              publicUrl,
              name: file.name,
              preview,
              size: file.size,
            }
            setFiles((prev) => {
              const next = [...prev, uploaded]
              onUpload?.(next)
              return next
            })
          } catch {
            setErrors((e) => [...e, `Failed to upload ${file.name}`])
          } finally {
            setUploading((u) => u.filter((n) => n !== file.name))
          }
        })
      )
    },
    [files.length, maxFiles, maxSizeMB, onUpload]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const removeFile = (key: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.key !== key)
      onUpload?.(next)
      return next
    })
  }

  const isUploading = uploading.length > 0
  const canAddMore = files.length < maxFiles && !isUploading

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragging ? "var(--color-border-info)" : "var(--color-border-secondary)"}`,
            borderRadius: "var(--border-radius-lg)",
            background: dragging ? "var(--color-background-info)" : "var(--color-background-secondary)",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke={dragging ? "var(--color-text-info)" : "var(--color-text-tertiary)"}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: dragging ? "var(--color-text-info)" : "var(--color-text-primary)" }}>
            {dragging ? "Drop to upload" : "Drag files here or click to browse"}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Up to {maxFiles} files · max {maxSizeMB} MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            style={{ display: "none" }}
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Uploading indicators */}
      {uploading.map((name) => (
        <div key={name} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "10px 14px",
        }}>
          <Spinner />
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Uploading {name}…
          </span>
        </div>
      ))}

      {/* Uploaded previews */}
      {files.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: files.length === 1 ? "1fr" : "repeat(2, 1fr)",
          gap: 8,
        }}>
          {files.map((f) => (
            <div key={f.key} style={{
              position: "relative",
              borderRadius: "var(--border-radius-md)",
              overflow: "hidden",
              aspectRatio: files.length === 1 ? "16/9" : "1",
              background: "var(--color-background-tertiary)",
              border: "0.5px solid var(--color-border-tertiary)",
            }}>
              {f.publicUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={f.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.preview} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {/* Overlay with filename + remove */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)",
                display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                padding: "8px 10px",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                  {f.name}
                </span>
                <button
                  onClick={() => removeFile(f.key)}
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add more button when some files uploaded */}
      {files.length > 0 && files.length < maxFiles && !isUploading && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            fontSize: 13, padding: "7px 14px",
            borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)",
            background: "transparent", color: "var(--color-text-secondary)",
            cursor: "pointer", alignSelf: "flex-start",
          }}
        >
          + Add more ({maxFiles - files.length} remaining)
        </button>
      )}

      {/* Errors */}
      {errors.map((err, i) => (
        <p key={i} style={{ margin: 0, fontSize: 12, color: "var(--color-text-danger)" }}>
          {err}
        </p>
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="var(--color-border-secondary)" strokeWidth="2"/>
      <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--color-text-info)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}