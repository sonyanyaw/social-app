"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import type { MediaFile } from "@prisma/client"

type Props = {
  files: MediaFile[]
  initialIndex: number
  onClose: () => void
}

export function MediaLightbox({ files, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const current = files[index]
  const isVideo  = current.mimeType.startsWith("video")
  const hasMultiple = files.length > 1

  const prev = useCallback(() => setIndex((i) => (i - 1 + files.length) % files.length), [files.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % files.length), [files.length])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")     onClose()
      if (e.key === "ArrowLeft")  prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, prev, next])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <>
      <style>{`
        @keyframes lbFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes lbSlideIn {
          from { opacity: 0; transform: scale(0.96) }
          to   { opacity: 1; transform: scale(1) }
        }
        .lb-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(10,9,8,0.92);
          display: flex; align-items: center; justify-content: center;
          animation: lbFadeIn 0.18s ease both;
        }
        .lb-media {
          animation: lbSlideIn 0.22s ease both;
          position: relative;
        }
        .lb-btn {
          position: absolute;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white; transition: background 0.15s;
          backdrop-filter: blur(4px);
        }
        .lb-btn:hover { background: rgba(255,255,255,0.22); }
        .lb-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.35);
          cursor: pointer; transition: background 0.15s, transform 0.15s;
          border: none; padding: 0;
        }
        .lb-dot.active { background: white; transform: scale(1.3); }
        .lb-dot:hover  { background: rgba(255,255,255,0.7); }
        @media (max-width: 680px) {
          .lb-nav-btn { display: none !important; }
        }
      `}</style>

      {/* Overlay — click outside to close */}
      <div
        className="lb-overlay"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          className="lb-btn"
          onClick={onClose}
          style={{ position: "fixed", top: 16, right: 16, zIndex: 10 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Counter */}
        {hasMultiple && (
          <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: "0.04em",
            zIndex: 10,
          }}>
            {index + 1} / {files.length}
          </div>
        )}

        {/* Media container — stop click propagation */}
        <div
          className="lb-media"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "min(92vw, 1000px)",
            maxHeight: "90dvh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isVideo ? (
            <video
              src={current.storageKey}
              controls
              autoPlay
              style={{
                maxWidth: "100%", maxHeight: "90dvh",
                borderRadius: 8, display: "block",
              }}
            />
          ) : (
            <div style={{
              position: "relative",
              width: "min(92vw, 1000px)",
              height: "min(80dvh, 700px)",
            }}>
              <Image
                src={current.storageKey}
                alt=""
                fill
                sizes="min(92vw, 1000px)"
                style={{ objectFit: "contain", borderRadius: 4 }}
                priority
              />
            </div>
          )}
        </div>

        {/* Prev / Next arrows */}
        {hasMultiple && (
          <>
            <button
              className="lb-btn lb-nav-btn"
              onClick={(e) => { e.stopPropagation(); prev() }}
              style={{ position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              className="lb-btn lb-nav-btn"
              onClick={(e) => { e.stopPropagation(); next() }}
              style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators + swipe hint on mobile */}
        {hasMultiple && (
          <div style={{
            position: "fixed", bottom: 24,
            left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 8, alignItems: "center", zIndex: 10,
          }}>
            {files.map((_, i) => (
              <button
                key={i}
                className={`lb-dot${i === index ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setIndex(i) }}
              />
            ))}
          </div>
        )}

        {/* Mobile swipe — track touch */}
        <MobileSwipe onSwipeLeft={next} onSwipeRight={prev} />
      </div>
    </>,
    document.body
  )
}

// Lightweight touch swipe handler
function MobileSwipe({ onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void; onSwipeRight: () => void }) {
  useEffect(() => {
    let startX = 0
    function onStart(e: TouchEvent) { startX = e.touches[0].clientX }
    function onEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 60) dx < 0 ? onSwipeLeft() : onSwipeRight()
    }
    window.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchend", onEnd, { passive: true })
    return () => {
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchend", onEnd)
    }
  }, [onSwipeLeft, onSwipeRight])
  return null
}