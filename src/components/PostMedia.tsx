"use client"

import { useState } from "react"
import Image from "next/image"
import type { MediaFile } from "@prisma/client"
import { MediaLightbox } from "./MediaLightbox"

type Props = {
  files: MediaFile[]
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video")
}

function isNextImageCompatible(src: string): boolean {
  return src.startsWith("https://") || src.startsWith("/")
}

export function PostMedia({ files }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (files.length === 0) return null

  const isSingle = files.length === 1

  return (
    <>
      <div style={{
        paddingLeft: 48,
        marginBottom: 14,
        display: "grid",
        gridTemplateColumns: isSingle ? "1fr" : "1fr 1fr",
        gap: 4,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}>
        {files.map((f, i) => (
          <div
            key={f.id}
            onClick={() => setLightboxIndex(i)}
            style={{
              position: "relative",
              aspectRatio: isSingle ? "16/9" : "1",
              background: "var(--rule-2)",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {isVideo(f.mimeType) ? (
              /* Videos show a thumbnail with a play button overlay */
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <video
                  src={f.storageKey}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  preload="metadata"
                  muted
                />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                  transition: "background 0.15s",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1714">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
              </div>
            ) : isNextImageCompatible(f.storageKey) ? (
              <>
                <Image
                  src={f.storageKey}
                  alt=""
                  fill
                  sizes={isSingle
                    ? "(max-width: 640px) 100vw, 592px"
                    : "(max-width: 640px) 50vw, 296px"}
                  style={{ objectFit: "cover", transition: "transform 0.2s" }}
                  loading="lazy"
                />
                {/* Hover zoom hint */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "transparent",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.previousElementSibling as HTMLElement
                    if (img) img.style.transform = "scale(1.03)"
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.previousElementSibling as HTMLElement
                    if (img) img.style.transform = "scale(1)"
                  }}
                />
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.storageKey}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />
            )}

            {/* Multi-image indicator on first thumbnail */}
            {!isSingle && i === 0 && files.length > 2 && (
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.55)",
                borderRadius: 999, padding: "2px 8px",
                fontSize: 11, color: "white", fontWeight: 500,
              }}>
                +{files.length - 1}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <MediaLightbox
          files={files}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}