import { useRef, useState } from "react"
import { FaUpload, FaLink, FaCommentDots, FaCopy, FaTrash, FaTimes, FaCheck } from "react-icons/fa"
import type { ImageCard } from "../Canvas/imgModule"

interface Props {
  card: ImageCard
  allCards: ImageCard[]
  onUpdate: (card: ImageCard) => void
  onCopy: () => void
  onDelete: () => void
  onComment: () => void
}

const Divider = () => (
  <div style={{
    width: 1, height: 30,
    background: "rgba(255,255,255,0.15)",
    margin: "0 6px", flexShrink: 0,
  }} />
)

function Btn({
  onClick, title, children, danger = false, disabled = false, active = false,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",

        gap: 4, padding: "6px 10px", minWidth: 44,
        background: active ? "rgba(255,255,255,0.18)"
          : danger ? "rgba(220,38,38,0.7)"
            : "transparent",
        border: "none", borderRadius: 10, color: "#fff",
        fontSize: 10, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "background 0.15s",
        whiteSpace: "nowrap", letterSpacing: "0.3px",
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = danger
          ? "rgba(220,38,38,0.9)"
          : active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active
          ? "rgba(255,255,255,0.18)"
          : danger ? "rgba(220,38,38,0.7)" : "transparent"
      }}
    >
      {children}
    </button>
  )
}

const Label = ({ text }: { text: string }) => (
  <span style={{ fontSize: 9, opacity: 0.75, letterSpacing: "0.4px" }}>{text}</span>
)

// ── URL Popover — rendered via fixed position independent of toolbar ──────────
function UrlPopover({ onConfirm, onCancel }: { onConfirm: (url: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = () => {
    const trimmed = value.trim()
    if (!trimmed) { setError("Please enter a URL"); return }
    try { new URL(trimmed) } catch { setError("Invalid URL — must start with https://"); return }
    onConfirm(trimmed)
  }

  return (
    // Fixed position so it's never clipped by the toolbar's stacking context
    <div style={{
      position: "fixed",
      bottom: 100,           // sits above the toolbar (toolbar is at bottom:24, ~60px tall)
      left: "50%",
      color: "#fff",
      transform: "translateX(-50%)",
      background: "#001836",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 14,
      padding: "16px 18px",
      width: 360,
      boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
      zIndex: 4000,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: "0.7px", textTransform: "uppercase" }}>
        Load image from URL
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.07)",
          border: `1px solid ${error ? "rgba(220,80,80,0.8)" : "rgba(255,255,255,0.18)"}`,
          borderRadius: 9, padding: "0 12px", gap: 8,
          transition: "border-color 0.15s",
        }}>
          <FaLink size={11} style={{ color: "#fff", flexShrink: 0 }} />
          <input
            autoFocus
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError("") }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm()
              if (e.key === "Escape") onCancel()
            }}
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", color: "#fff", fontSize: 13,
              padding: "10px 0", fontFamily: "inherit",
            }}
          />
        </div>

        <button onClick={handleConfirm} title="Load image" style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: value.trim() ? "#2563eb" : "rgba(255,255,255,0.15)", border: "none", cursor: value.trim() ? "pointer" : "default",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}>
          ✓
        </button>

        <button onClick={onCancel} title="Cancel" style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.4)",
          cursor: "pointer",
          color: "#fff",
          fontSize: 18, fontWeight: "bold",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          ✕
        </button>
      </div>

      {error && <div style={{ color: "rgba(255,110,110,0.95)", fontSize: 11 }}>{error}</div>}

      <div style={{ color: "#fff", fontSize: 10 }}>
        Tip: must be a direct image link ending in .jpg, .png, .webp, .gif or .svg
      </div>
    </div >
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ImageBottomBar({ card, allCards, onUpdate, onCopy, onDelete, onComment }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUrlPopover, setShowUrlPopover] = useState(false)
  const isEmpty = !card.src

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const MAX_W = 520
        const scale = img.width > MAX_W ? MAX_W / img.width : 1
        onUpdate({ ...card, src, width: Math.round(img.width * scale), height: Math.round(img.height * scale) })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  // ── URL load ──────────────────────────────────────────────────────────────
  const loadFromUrl = (url: string) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const MAX_W = 520
      const scale = img.width > MAX_W ? MAX_W / img.width : 1
      onUpdate({ ...card, src: url, width: Math.round(img.width * scale), height: Math.round(img.height * scale) })
    }
    img.onerror = () => {
      // CORS blocked — set src directly and let Konva try
      onUpdate({ ...card, src: url })
    }
    img.src = url
    setShowUrlPopover(false)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* URL popover — rendered at fixed position, NOT inside toolbar div */}
      {showUrlPopover && (
        <UrlPopover
          onConfirm={loadFromUrl}
          onCancel={() => setShowUrlPopover(false)}
        />
      )}

      {/* Toolbar */}
      <div style={{
        position: "fixed", bottom: "5vh", left: "50%",
        // color:"white",
        transform: "translateX(-50%)",
        background: "#001F46",
        borderRadius: 18, padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 2,
        color: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.25)",
        zIndex: 3000, userSelect: "none",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>

        {/* Upload */}
        <Btn
          onClick={() => { setShowUrlPopover(false); fileInputRef.current?.click() }}
          title="Upload from device"
          active={isEmpty}
        >
          <FaUpload size={15} />
          <Label text="Upload" />
        </Btn>

        {/* URL */}
        <Btn
          onClick={() => setShowUrlPopover((v) => !v)}
          title="Load from URL"
          active={showUrlPopover || isEmpty}
        >
          <FaLink size={15} />
          <Label text="URL" />
        </Btn>

        <Divider />

        {/* Comment */}
        <Btn onClick={onComment} title="Open discussion">
          <FaCommentDots size={16} />
          <Label text="Comment" />
        </Btn>

        <Divider />

        {/* Copy */}
        <Btn onClick={onCopy} title="Duplicate image">
          <FaCopy size={15} />
          <Label text="Copy" />
        </Btn>

        {/* Delete */}
        <Btn onClick={onDelete} title="Delete image" danger>
          <FaTrash size={14} />
          <Label text="Delete" />
        </Btn>
      </div>
    </>
  )
}
