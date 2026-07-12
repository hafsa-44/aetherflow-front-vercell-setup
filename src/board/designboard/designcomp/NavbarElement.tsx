// NavbarElement.tsx
// Changes:
//  1. Default height halved then +5%  →  Math.round(58/2*1.05) = 30
//  2. Increased font sizes throughout (logo, links, CTA)
//  3. Component is fully prop-driven — any cfg change instantly re-renders
//  4. Bottom editor bar exported as <NavbarBottomBar> using position:fixed bottom:0
//     so it always sits on the real bottom edge of the viewport, never hidden under canvas

import React, { useState, useCallback } from "react";

export interface NavLink {
  id: string;
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
}

export interface NavbarConfig {
  bg: string;
  textColor: string;
  accent: string;
  borderColor: string;

  style: "solid" | "glass" | "bordered" | "gradient" | "transparent";
  position: "sticky" | "fixed" | "static" | "floating";
  align: "spread" | "center-logo" | "links-left" | "links-right";
  height: number;
  borderRadius: number;
  paddingX: number;

  logoText: string;
  logoStyle: "box" | "pill" | "dot" | "bracket" | "text";

  font: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
  linkStyle: "none" | "underline" | "pill" | "dot" | "fade";
  letterSpacing: number;

  links: NavLink[];

  showSearch: boolean;
  showCart: boolean;
  showNotif: boolean;
  showUser: boolean;
  showCTA: boolean;
  showThemeToggle: boolean;
  showLoginOut: boolean;

  ctaLabel: string;
  ctaStyle: "filled" | "outline" | "ghost";

  cartCount: number;
  notifCount: number;

  shadow: boolean;
  blur: number;
  showDivider: boolean;
}

// ── Req 1: height = Math.round(58/2*1.05) = 30
// ── Req 2: fontSize bumped from 13 → 15
export const DEFAULT_NAVBAR_CFG: NavbarConfig = {
  bg: "#0f1f3d",
  textColor: "#e8edf8",
  accent: "#3b82f6",
  borderColor: "rgba(255,255,255,0.08)",

  style: "solid",
  position: "sticky",
  align: "spread",
  height: 30,           // ← was 58; halved = 29, +5% ≈ 30
  borderRadius: 0,
  paddingX: 28,

  logoText: "Brand",
  logoStyle: "box",

  font: "DM Sans",
  fontSize: 15,         // ← was 13; increased
  fontWeight: "500",
  linkStyle: "pill",
  letterSpacing: 0,

  links: [
    { id: "l1", label: "Home", active: true, hasDropdown: false },
    { id: "l2", label: "Products", active: false, hasDropdown: true },
    { id: "l3", label: "Pricing", active: false, hasDropdown: false },
    { id: "l4", label: "About", active: false, hasDropdown: false },
  ],

  showSearch: true,
  showCart: true,
  showNotif: true,
  showUser: true,
  showCTA: true,
  showThemeToggle: false,
  showLoginOut: false,

  ctaLabel: "Get Started",
  ctaStyle: "filled",

  cartCount: 3,
  notifCount: 5,

  shadow: false,
  blur: 12,
  showDivider: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shiftHue(hex: string, deg: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
    }
    h = ((h * 360 + deg) % 360) / 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p2 = 2 * l - q;
    const hf = (p: number, q: number, t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return `#${[hf(p2, q, h + 1 / 3), hf(p2, q, h), hf(p2, q, h - 1 / 3)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
  } catch { return hex; }
}

function IBtn({ children, accent, badge, badgeBg, navBg }: { children: React.ReactNode; accent: string; badge?: number; badgeBg?: string; navBg: string }) {
  return (
    <div style={{ position: "relative", width: 26, height: 26, borderRadius: 7, background: `${accent}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
      {badge != null && badge > 0 && (
        <span style={{ position: "absolute", top: -3, right: -3, minWidth: 13, height: 13, borderRadius: 8, background: badgeBg || accent, fontSize: 7, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, border: `1.5px solid ${navBg}`, padding: "0 2px", lineHeight: 1 }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  );
}

function Svg({ d, size = 13, color = "currentColor", sw = 2 }: { d: string | string[]; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ─── Logo — font sizes bumped for req 2 ───────────────────────────────────────
function Logo({ cfg }: { cfg: NavbarConfig }) {
  const { logoStyle, logoText, accent, textColor, font } = cfg;
  const letter = logoText[0]?.toUpperCase() || "B";
  // Req 2: logo text size 17 (was 15), letter 15 (was 13)
  const base: React.CSSProperties = { color: textColor, fontWeight: 800, fontSize: 17, fontFamily: `'${font}',DM Sans,sans-serif`, letterSpacing: "-0.02em", flexShrink: 0 };

  if (logoStyle === "box") return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg,${accent},${shiftHue(accent, 35)})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${accent}44` }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, fontFamily: `'${font}',DM Sans,sans-serif` }}>{letter}</span>
      </div>
      <span style={base}>{logoText}</span>
    </div>
  );

  if (logoStyle === "pill") return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, background: `${accent}20`, border: `1px solid ${accent}44`, borderRadius: 20, padding: "3px 12px 3px 6px" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 9 }}>{letter}</span>
      </div>
      <span style={{ ...base, fontSize: 15 }}>{logoText}</span>
    </div>
  );

  if (logoStyle === "dot") return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span style={base}>{logoText}</span>
    </div>
  );

  if (logoStyle === "bracket") return (
    <span style={{ ...base, flexShrink: 0 }}>
      <span style={{ color: accent, opacity: 0.7 }}>[</span>{logoText}<span style={{ color: accent, opacity: 0.7 }}>]</span>
    </span>
  );

  return <span style={base}>{logoText}</span>;
}

// ─── Link — font size driven by cfg.fontSize ──────────────────────────────────
function NavLinkItem({ link, cfg }: { link: NavLink; cfg: NavbarConfig }) {
  const { linkStyle, accent, textColor, font, fontSize, fontWeight, letterSpacing } = cfg;
  const active = link.active;
  const base: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 3,
    fontSize,                                      // ← uses cfg.fontSize (now default 15)
    fontWeight: active ? "700" : fontWeight,
    fontFamily: `'${font}',DM Sans,sans-serif`,
    color: active ? accent : `${textColor}cc`,
    cursor: "pointer", position: "relative", whiteSpace: "nowrap",
    userSelect: "none",
    letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
  };

  const chevron = link.hasDropdown ? (
    <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
  ) : null;

  if (linkStyle === "pill") return <span style={{ ...base, padding: "4px 10px", borderRadius: 7, background: active ? `${accent}1e` : "transparent" }}>{link.label}{chevron}</span>;
  if (linkStyle === "underline") return <span style={{ ...base, padding: "4px 5px", borderBottom: active ? `2px solid ${accent}` : "2px solid transparent" }}>{link.label}{chevron}</span>;
  if (linkStyle === "dot") return (
    <span style={{ ...base, padding: "4px 6px", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{link.label}{chevron}</span>
      {active && <span style={{ width: 4, height: 4, borderRadius: "50%", background: accent }} />}
    </span>
  );
  if (linkStyle === "fade") return <span style={{ ...base, padding: "4px 7px", opacity: active ? 1 : 0.45 }}>{link.label}{chevron}</span>;
  return <span style={{ ...base, padding: "4px 7px" }}>{link.label}{chevron}</span>;
}

// ─── Main NavbarElement ───────────────────────────────────────────────────────
// Req 3: fully prop-driven — passes cfg straight through, no internal state.
//         Parent updates cfg → this re-renders instantly.
interface NavbarElementProps {
  cfg: NavbarConfig;
  width: number;
}

export default function NavbarElement({ cfg, width }: NavbarElementProps) {
  const bgCss =
    cfg.style === "gradient" ? `linear-gradient(135deg,${cfg.bg} 0%,${shiftHue(cfg.bg, 28)} 100%)`
      : cfg.style === "transparent" ? "transparent"
        : cfg.bg;

  const outerStyle: React.CSSProperties = {
    width,
    height: cfg.height,
    background: bgCss,
    backdropFilter: cfg.style === "glass" ? `blur(${cfg.blur}px)` : "none",
    WebkitBackdropFilter: cfg.style === "glass" ? `blur(${cfg.blur}px)` : "none",
    borderBottom: cfg.style === "bordered" ? `2px solid ${cfg.accent}` : cfg.showDivider ? `1px solid ${cfg.borderColor}` : "none",
    borderRadius: cfg.position === "floating" ? cfg.borderRadius || 12 : cfg.borderRadius || 0,
    boxShadow: cfg.shadow ? "0 4px 24px rgba(0,0,0,0.22)" : "none",
    display: "flex", alignItems: "center",
    paddingInline: cfg.paddingX,
    gap: 4,
    fontFamily: `'${cfg.font}',DM Sans,sans-serif`,
    overflow: "hidden",
    userSelect: "none" as const,
    boxSizing: "border-box" as const,
    transition: "all 0.18s ease",   // smooth live-preview transitions
  };

  const links = cfg.links;
  const half = Math.ceil(links.length / 2);

  const LinkGroup = ({ slice }: { slice: NavLink[] }) => (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {slice.map(l => <NavLinkItem key={l.id} link={l} cfg={cfg} />)}
    </div>
  );

  const RightActions = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      {cfg.showSearch && (
        <IBtn accent={cfg.accent} navBg={cfg.bg}>
          <Svg d="M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35" color={cfg.accent} />
        </IBtn>
      )}
      {cfg.showThemeToggle && (
        <IBtn accent={cfg.accent} navBg={cfg.bg}>
          <Svg d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" color={cfg.accent} />
        </IBtn>
      )}
      {cfg.showNotif && (
        <IBtn accent={cfg.accent} badge={cfg.notifCount} badgeBg="#ef4444" navBg={cfg.bg}>
          <Svg d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"]} color={cfg.accent} />
        </IBtn>
      )}
      {cfg.showCart && (
        <IBtn accent={cfg.accent} badge={cfg.cartCount} navBg={cfg.bg}>
          <Svg d={["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 01-8 0"]} color={cfg.accent} />
        </IBtn>
      )}
      {cfg.showLoginOut && (
        <IBtn accent={cfg.accent} navBg={cfg.bg}>
          <Svg d={["M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4", "M10 17l5-5-5-5", "M15 12H3"]} color={cfg.accent} />
        </IBtn>
      )}
      {cfg.showUser && (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${cfg.accent},${shiftHue(cfg.accent, 40)})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${cfg.accent}44`, cursor: "pointer" }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none">
            <circle cx={12} cy={8} r={4} /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
      )}
      {cfg.showCTA && (() => {
        // Req 2: CTA font size bumped to 13 (was 12)
        const s: React.CSSProperties = { padding: "5px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700, fontFamily: `'${cfg.font}',DM Sans,sans-serif`, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 };
        if (cfg.ctaStyle === "outline") return <div style={{ ...s, background: "transparent", color: cfg.accent, border: `1.5px solid ${cfg.accent}` }}>{cfg.ctaLabel}</div>;
        if (cfg.ctaStyle === "ghost") return <div style={{ ...s, background: `${cfg.accent}18`, color: cfg.accent, border: "none" }}>{cfg.ctaLabel}</div>;
        return <div style={{ ...s, background: cfg.accent, color: "#fff", border: "none", boxShadow: `0 2px 10px ${cfg.accent}55` }}>{cfg.ctaLabel}</div>;
      })()}
    </div>
  );

  return (
    <div style={outerStyle}>
      {cfg.align === "center-logo" && <>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}><LinkGroup slice={links.slice(0, half)} /></div>
        <div style={{ width: 12 }} />
        <Logo cfg={cfg} />
        <div style={{ width: 12 }} />
        <div style={{ flex: 1 }}><LinkGroup slice={links.slice(half)} /></div>
        <RightActions />
      </>}
      {cfg.align === "links-left" && <>
        <Logo cfg={cfg} />
        <div style={{ width: 14, flexShrink: 0 }} />
        <LinkGroup slice={links} />
        <div style={{ flex: 1 }} />
        <RightActions />
      </>}
      {cfg.align === "links-right" && <>
        <Logo cfg={cfg} />
        <div style={{ flex: 1 }} />
        <LinkGroup slice={links} />
        <div style={{ width: 10, flexShrink: 0 }} />
        <RightActions />
      </>}
      {cfg.align === "spread" && <>
        <Logo cfg={cfg} />
        <div style={{ flex: 1 }} />
        <LinkGroup slice={links} />
        <div style={{ flex: 1 }} />
        <RightActions />
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NavbarBottomBar — Req 4
// ─────────────────────────────────────────────────────────────────────────────
// position: fixed; bottom: 0  →  always floats on the real screen bottom.
// Same pattern as icon picker / image modal in LeftSideBar.
// Usage: <NavbarBottomBar cfg={cfg} onChange={setCfg} />
// Every control calls onChange with the full updated config → NavbarElement
// re-renders instantly (Req 3).
// ═══════════════════════════════════════════════════════════════════════════════

const BB_BG = "#0d1b2e";
const BB_NAVY = "#162847";
const BB_BORDER = "#1e3a5f";
const BB_WHITE = "#ffffff";
const BB_GRAY = "#94a3b8";
const BB_ACCENT = "#3b82f6";

interface BottomBarProps {
  cfg: NavbarConfig;
  onChange: (next: NavbarConfig) => void;
  onClose: () => void;
}

type Tab = "style" | "layout" | "links" | "actions" | "colors";

// Small reusable chip toggle
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "3px 11px", borderRadius: 20, border: "none", cursor: "pointer",
      fontSize: 11, fontFamily: "DM Sans,sans-serif", whiteSpace: "nowrap", flexShrink: 0,
      background: active ? BB_ACCENT : BB_NAVY,
      color: active ? BB_WHITE : BB_GRAY,
      transition: "background 0.12s,color 0.12s",
    }}>{label}</button>
  );
}

// Labelled colour swatch
function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, cursor: "pointer", alignItems: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, border: `2px solid ${BB_BORDER}`, background: value, cursor: "pointer", overflow: "hidden", position: "relative" }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
      </div>
      <span style={{ fontSize: 9, color: BB_GRAY, fontFamily: "DM Sans,sans-serif" }}>{label}</span>
    </label>
  );
}

// Small number stepper
function Stepper({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontSize: 9, color: BB_GRAY, fontFamily: "DM Sans,sans-serif", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <button onClick={() => onChange(Math.max(min, value - step))} style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${BB_BORDER}`, background: BB_NAVY, color: BB_WHITE, cursor: "pointer", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>−</button>
        <span style={{ fontSize: 11, color: BB_WHITE, fontFamily: "DM Sans,sans-serif", minWidth: 26, textAlign: "center" }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + step))} style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${BB_BORDER}`, background: BB_NAVY, color: BB_WHITE, cursor: "pointer", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>+</button>
      </div>
    </div>
  );
}

export function NavbarBottomBar({ cfg, onChange, onClose }: BottomBarProps) {
  const [tab, setTab] = useState<Tab>("style");

  // Helper: patch one field and call onChange
  const patch = useCallback(<K extends keyof NavbarConfig>(key: K, value: NavbarConfig[K]) => {
    onChange({ ...cfg, [key]: value });
  }, [cfg, onChange]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "style", label: "Style" },
    { id: "layout", label: "Layout" },
    { id: "links", label: "Links" },
    { id: "actions", label: "Actions" },
    { id: "colors", label: "Colors" },
  ];

  return (
    // Req 4: position fixed bottom 0 — always visible at the true screen bottom
    // 20% margin from right so it floats without covering the full width
    <div style={{
      position: "fixed", bottom: 0, left: 52, right: "20%", zIndex: 300,
      background: BB_BG, borderTop: `1px solid ${BB_BORDER}`,
      borderTopRightRadius: 12,
      boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
      display: "flex", flexDirection: "column",
      fontFamily: "DM Sans,sans-serif",
    }}>
      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 6px", flexShrink: 0, borderBottom: `1px solid ${BB_BORDER}` }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={BB_ACCENT} strokeWidth={2} strokeLinecap="round"><path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v3H2V7z" /><path d="M6 8.5h.01M9 8.5h.01M16 8h5" /></svg>
        <span style={{ color: BB_WHITE, fontWeight: 600, fontSize: 13 }}>Navbar</span>
        <div style={{ flex: 1 }} />
        {/* Tab strip */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "3px 12px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? BB_ACCENT : "transparent",
              color: tab === t.id ? BB_WHITE : BB_GRAY,
              transition: "all 0.12s",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: BB_GRAY, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>

      {/* ── Always-visible Height control strip ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px 6px", borderBottom: `1px solid ${BB_BORDER}`, flexShrink: 0, background: "rgba(0,0,0,0.15)" }}>
        <span style={{ fontSize: 9, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Height</span>
        <button onClick={() => patch("height", Math.max(20, cfg.height - 2))} style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${BB_BORDER}`, background: BB_NAVY, color: BB_WHITE, cursor: "pointer", fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>−</button>
        <input
          type="range" min={20} max={120} step={1} value={cfg.height}
          onChange={e => patch("height", +e.target.value)}
          style={{ flex: 1, accentColor: BB_ACCENT, cursor: "pointer", maxWidth: 200 }}
        />
        <button onClick={() => patch("height", Math.min(120, cfg.height + 2))} style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${BB_BORDER}`, background: BB_NAVY, color: BB_WHITE, cursor: "pointer", fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>+</button>
        <span style={{ fontSize: 11, color: BB_WHITE, fontFamily: "DM Sans,sans-serif", minWidth: 32, textAlign: "center", fontWeight: 600 }}>{cfg.height}px</span>
        {/* Quick height presets */}
        <div style={{ width: 1, height: 16, background: BB_BORDER, flexShrink: 0 }} />
        {[30, 44, 56, 72].map(h => (
          <button key={h} onClick={() => patch("height", h)} style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${cfg.height === h ? BB_ACCENT : BB_BORDER}`, background: cfg.height === h ? `${BB_ACCENT}30` : "transparent", color: cfg.height === h ? BB_ACCENT : BB_GRAY, cursor: "pointer", fontSize: 10, fontFamily: "DM Sans,sans-serif", fontWeight: cfg.height === h ? 700 : 400, flexShrink: 0 }}>{h}</button>
        ))}
      </div>

      {/* ── Content row ── */}
      <div style={{ display: "flex", gap: 16, padding: "10px 16px 12px", overflowX: "auto", alignItems: "flex-start" }}>

        {/* ────── STYLE tab ────── */}
        {tab === "style" && <>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Bar style</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["solid", "glass", "bordered", "gradient", "transparent"] as const).map(s => (
                <Chip key={s} label={s} active={cfg.style === s} onClick={() => patch("style", s)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Link style</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["none", "underline", "pill", "dot", "fade"] as const).map(s => (
                <Chip key={s} label={s} active={cfg.linkStyle === s} onClick={() => patch("linkStyle", s)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Logo style</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["box", "pill", "dot", "bracket", "text"] as const).map(s => (
                <Chip key={s} label={s} active={cfg.logoStyle === s} onClick={() => patch("logoStyle", s)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>CTA style</span>
            <div style={{ display: "flex", gap: 4 }}>
              {(["filled", "outline", "ghost"] as const).map(s => (
                <Chip key={s} label={s} active={cfg.ctaStyle === s} onClick={() => patch("ctaStyle", s)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Stepper label="Height" value={cfg.height} min={24} max={120} onChange={v => patch("height", v)} />
            <Stepper label="Font size" value={cfg.fontSize} min={10} max={22} onChange={v => patch("fontSize", v)} />
            <Stepper label="Pad X" value={cfg.paddingX} min={0} max={80} step={4} onChange={v => patch("paddingX", v)} />
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Extras</span>
            <div style={{ display: "flex", gap: 4 }}>
              <Chip label="Shadow" active={cfg.shadow} onClick={() => patch("shadow", !cfg.shadow)} />
              <Chip label="Divider" active={cfg.showDivider} onClick={() => patch("showDivider", !cfg.showDivider)} />
            </div>
          </div>
        </>}

        {/* ────── LAYOUT tab ────── */}
        {tab === "layout" && <>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Alignment</span>
            <div style={{ display: "flex", gap: 4 }}>
              {(["spread", "center-logo", "links-left", "links-right"] as const).map(a => (
                <Chip key={a} label={a.replace("-", " ")} active={cfg.align === a} onClick={() => patch("align", a)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Position</span>
            <div style={{ display: "flex", gap: 4 }}>
              {(["sticky", "fixed", "static", "floating"] as const).map(p => (
                <Chip key={p} label={p} active={cfg.position === p} onClick={() => patch("position", p)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Font weight</span>
            <div style={{ display: "flex", gap: 4 }}>
              {(["400", "500", "600", "700"] as const).map(w => (
                <Chip key={w} label={w} active={cfg.fontWeight === w} onClick={() => patch("fontWeight", w)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Logo text</span>
            <input value={cfg.logoText} onChange={e => patch("logoText", e.target.value)}
              style={{ background: BB_NAVY, border: `1px solid ${BB_BORDER}`, borderRadius: 7, color: BB_WHITE, fontSize: 12, fontFamily: "DM Sans,sans-serif", padding: "5px 10px", outline: "none", width: 100 }} />
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Stepper label="Border R" value={cfg.borderRadius} min={0} max={24} onChange={v => patch("borderRadius", v)} />
            <Stepper label="Blur" value={cfg.blur} min={0} max={40} onChange={v => patch("blur", v)} />
          </div>
        </>}

        {/* ────── LINKS tab ────── */}
        {tab === "links" && <>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Nav links — click label to edit, click dot to toggle active</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cfg.links.map((lnk, i) => (
                <div key={lnk.id} style={{ display: "flex", alignItems: "center", gap: 4, background: BB_NAVY, border: `1px solid ${lnk.active ? BB_ACCENT : BB_BORDER}`, borderRadius: 8, padding: "3px 8px" }}>
                  {/* active toggle dot */}
                  <div onClick={() => {
                    const next = cfg.links.map((l, j) => ({ ...l, active: j === i }));
                    patch("links", next);
                  }} style={{ width: 8, height: 8, borderRadius: "50%", background: lnk.active ? BB_ACCENT : BB_GRAY, cursor: "pointer", flexShrink: 0 }} />
                  {/* editable label */}
                  <input value={lnk.label} onChange={e => {
                    const next = [...cfg.links]; next[i] = { ...next[i], label: e.target.value }; patch("links", next);
                  }} style={{ background: "transparent", border: "none", outline: "none", color: BB_WHITE, fontSize: 12, fontFamily: "DM Sans,sans-serif", width: 70 }} />
                  {/* dropdown toggle */}
                  <div onClick={() => {
                    const next = [...cfg.links]; next[i] = { ...next[i], hasDropdown: !next[i].hasDropdown }; patch("links", next);
                  }} title="Toggle dropdown" style={{ cursor: "pointer", color: lnk.hasDropdown ? BB_ACCENT : BB_GRAY, fontSize: 10 }}>▾</div>
                  {/* remove */}
                  {cfg.links.length > 1 && (
                    <div onClick={() => patch("links", cfg.links.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: BB_GRAY, fontSize: 13, lineHeight: 1 }}>×</div>
                  )}
                </div>
              ))}
              {cfg.links.length < 8 && (
                <button onClick={() => patch("links", [...cfg.links, { id: `l${Date.now()}`, label: "Link", active: false, hasDropdown: false }])}
                  style={{ padding: "3px 12px", borderRadius: 8, border: `1px dashed ${BB_BORDER}`, background: "transparent", color: BB_GRAY, cursor: "pointer", fontSize: 12, fontFamily: "DM Sans,sans-serif" }}>+ Add</button>
              )}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>CTA label</span>
            <input value={cfg.ctaLabel} onChange={e => patch("ctaLabel", e.target.value)}
              style={{ background: BB_NAVY, border: `1px solid ${BB_BORDER}`, borderRadius: 7, color: BB_WHITE, fontSize: 12, fontFamily: "DM Sans,sans-serif", padding: "5px 10px", outline: "none", width: 120 }} />
          </div>
        </>}

        {/* ────── ACTIONS tab ────── */}
        {tab === "actions" && <>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Show / hide elements</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {([
                ["showSearch", "Search"], ["showCart", "Cart"], ["showNotif", "Notif"],
                ["showUser", "User"], ["showCTA", "CTA"], ["showThemeToggle", "Theme"],
                ["showLoginOut", "Login"],
              ] as [keyof NavbarConfig, string][]).map(([key, label]) => (
                <Chip key={key} label={label} active={!!cfg[key]} onClick={() => patch(key, !cfg[key] as any)} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Stepper label="Cart badge" value={cfg.cartCount} min={0} max={99} onChange={v => patch("cartCount", v)} />
            <Stepper label="Notif badge" value={cfg.notifCount} min={0} max={99} onChange={v => patch("notifCount", v)} />
          </div>
        </>}

        {/* ────── COLORS tab ────── */}
        {tab === "colors" && <>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Palette</span>
            <div style={{ display: "flex", gap: 10 }}>
              <ColorSwatch label="Background" value={cfg.bg} onChange={v => patch("bg", v)} />
              <ColorSwatch label="Text" value={cfg.textColor} onChange={v => patch("textColor", v)} />
              <ColorSwatch label="Accent" value={cfg.accent} onChange={v => patch("accent", v)} />
              <ColorSwatch label="Border" value={cfg.borderColor === "rgba(255,255,255,0.08)" ? "#1e3a5f" : cfg.borderColor} onChange={v => patch("borderColor", v)} />
            </div>
          </div>
          <div style={{ width: 1, background: BB_BORDER, alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, color: BB_GRAY, textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick themes</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "Ocean", bg: "#0f1f3d", accent: "#3b82f6" },
                { label: "Forest", bg: "#0d2818", accent: "#22c55e" },
                { label: "Sunset", bg: "#1a0a00", accent: "#f97316" },
                { label: "Rose", bg: "#1a0a14", accent: "#ec4899" },
                { label: "Slate", bg: "#0f172a", accent: "#94a3b8" },
                { label: "White", bg: "#ffffff", accent: "#6366f1" },
              ].map(t => (
                <div key={t.label} onClick={() => onChange({ ...cfg, bg: t.bg, accent: t.accent })}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
                  <div style={{ width: 36, height: 20, borderRadius: 6, border: `2px solid ${BB_BORDER}`, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, overflow: "hidden" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.accent }} />
                  </div>
                  <span style={{ fontSize: 9, color: BB_GRAY, fontFamily: "DM Sans,sans-serif" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}
