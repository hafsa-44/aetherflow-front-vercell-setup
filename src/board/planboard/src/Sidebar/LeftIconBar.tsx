import React from "react"
import { useNavigate } from "react-router-dom"
import {
  MdDashboard,
  MdGridView,
  MdAutoAwesome,
  MdLayers,
  MdPalette,
  MdCode,
} from "react-icons/md"
import { RiLayoutGridLine } from "react-icons/ri"
import { MdLock } from "react-icons/md"
import logoSvg from "../Canvas/assets/logo.svg"

type BoardPhase = "planning" | "design" | "development"

type Props = {
  aiPanelOpen: boolean
  onToggleAI: () => void
  navPanelOpen: boolean
  onToggleNav: () => void
  phase: BoardPhase
}

export default function LeftIconBar({
  aiPanelOpen,
  onToggleAI,
  navPanelOpen,
  onToggleNav,
  phase,
}: Props) {
  const navigate = useNavigate()

  return (
    <div style={styles.bar}>

      {/* ── Logo ── */}
      <div style={styles.logo}>
        <img src={logoSvg} alt="Logo" style={{ width: 26, height: 26, objectFit: "contain" }} />
      </div>

      <div style={styles.divider} />

      {/* ── Dashboard ── */}
      <BarIcon title="Dashboard" active={false} onClick={() => navigate("/dashboard")}>
        <MdDashboard />
      </BarIcon>

      {/* ── Tools Nav Toggle ── */}
      <BarIcon
        title={navPanelOpen ? "Hide Tools" : "Show Tools"}
        active={navPanelOpen}
        onClick={onToggleNav}
      >
        <RiLayoutGridLine />
      </BarIcon>

      {/* ── Planning — always active when on planning phase ── */}
      <BarIcon
        title="Planning Board"
        active={phase === "planning"}
        onClick={() => {}}
      >
        <MdGridView />
      </BarIcon>

      {/* ── Design — locked until phase advances past planning ── */}
      <BarIcon
        title={phase === "planning" ? "🔒 Complete AI Context form to unlock Design" : "Design Board"}
        active={phase === "design"}
        locked={phase === "planning"}
        onClick={() => {
          // Design board is rendered by board.tsx when phase === "design"
          // Navigation via navigate() is NOT used — phase controls rendering
          // So this button is intentionally a no-op when locked
          // When unlocked, the board is already showing DesignPhase
        }}
      >
        <MdPalette />
      </BarIcon>

      {/* ── Dev — locked until phase === "development" ── */}
      <BarIcon
        title={phase !== "development" ? "🔒 Complete Design phase to unlock Dev" : "Dev Board"}
        active={phase === "development"}
        locked={phase !== "development"}
        onClick={() => {
          // Same pattern — dev board renders when phase === "development"
        }}
      >
        <MdCode />
      </BarIcon>

      {/* ── Spacer ── */}
      <div style={{ flex: 1}} />

      {/* ── AI Toggle ── */}
      <BarIcon
        title={aiPanelOpen ? "Close AI Panel" : "Open AI Panel"}
        active={aiPanelOpen}
        onClick={onToggleAI}
        accent
      >
        <MdAutoAwesome />
      </BarIcon>

      <div style={{ height: 16}} />
    </div>
  )
}

// ── BarIcon ───────────────────────────────────────────────────────────────────

function BarIcon({
  children,
  onClick,
  active,
  title,
  accent,
  locked,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  title?: string
  accent?: boolean
  locked?: boolean
}) {
  const [hovered, setHovered] = React.useState(false)

  const bg = locked
    ? "transparent"
    : active
      ? accent
        ? "linear-gradient(135deg, #7C3AED, #4F46E5)"
        : "rgba(255,255,255,0.16)"
      : hovered
        ? "rgba(255,255,255,0.09)"
        : "transparent"

  const shadow = locked
    ? "none"
    : active && accent
      ? "0 0 16px rgba(124,58,237,0.65), 0 2px 8px rgba(0,0,0,0.3)"
      : active
        ? "0 0 0 2px rgba(255,255,255,0.18)"
        : "none"

  const iconColor = locked
    ? "rgba(255,255,255,0.2)"          // dimmed — locked
    : active
      ? "#ffffff"                       // bright — active phase
      : hovered
        ? "rgba(255,255,255,0.8)"       // hover
        : "rgba(255,255,255,0.45)"      // default

  return (
    <div
      title={title}
      onClick={locked ? undefined : onClick}   // ← clicks completely ignored when locked
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        margin: "4px auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 21,
        color: iconColor,
        background: bg,
        boxShadow: shadow,
        border: active && !locked
          ? "1px solid rgba(255,255,255,0.22)"
          : locked && hovered
            ? "1px solid rgba(255,255,255,0.08)"  // subtle hint on hover
            : "1px solid transparent",
        cursor: locked ? "not-allowed" : "pointer",
        transition: "all 0.18s ease",
        transform: hovered && !active && !locked ? "scale(1.1)" : "scale(1)",
        position: "relative",
      }}
    >
      {children}

      {/* ── Lock badge — shows on hover when locked ── */}
      {locked && hovered && (
        <div style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          lineHeight: 1,
        }}>
          🔒
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: { [k: string]: React.CSSProperties } = {
  bar: {
    width: 56,
    height: "100%",
    backgroundColor: "#00112e",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    flexShrink: 0,
  },
  divider: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    margin: "10px 0",
    flexShrink: 0,
  },
}