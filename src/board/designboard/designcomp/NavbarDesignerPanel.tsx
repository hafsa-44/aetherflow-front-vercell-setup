// NavbarDesignerPanel.tsx
// Renders as a fixed bottom panel (same z-index / position pattern as the icon picker).
// Contains a compact live-preview navbar + full customisation controls on one horizontal strip,
// plus a scrollable slide-out settings drawer that appears above the strip.

import { useState } from "react";

/* ─── Design tokens (mirrors LeftSideBar / DesignPhase palette) ─────────────── */
const T = {
     navy: "#0f1f3d",
     navy2: "#162847",
     navy3: "#1e3a5f",
     navy4: "#0d1b2e",          // panel bg (same as icon picker)
     accent: "#3b82f6",
     purple: "#a855f7",
     white: "#ffffff",
     gray: "#e2e8f0",
     gray2: "#94a3b8",
};

/* ─── Colour presets ────────────────────────────────────────────────────────── */
const PRESETS: Record<string, NavbarCfg> = {
     "Midnight": { bg: "#0a0f1e", text: "#e8edf8", accent: "#6366f1", sub: "#8892aa", border: "rgba(255,255,255,0.07)", style: "solid", position: "sticky", align: "spread", height: 56, logoStyle: "gradient-box", logoText: "Brand", showSearch: true, showCart: true, showNotif: true, showUser: true, showCTA: true, ctaLabel: "Get Started", cartCount: 3, notifCount: 5, linkStyle: "pill", links: [{ id: "l1", label: "Home", dropdown: false }, { id: "l2", label: "Products", dropdown: true }, { id: "l3", label: "Pricing", dropdown: false }, { id: "l4", label: "Blog", dropdown: false }], font: "DM Sans" },
     "Arctic": { bg: "#ffffff", text: "#111827", accent: "#2563eb", sub: "#6b7280", border: "#e5e7eb", style: "solid", position: "sticky", align: "spread", height: 56, logoStyle: "dot-prefix", logoText: "Brand", showSearch: true, showCart: true, showNotif: false, showUser: true, showCTA: true, ctaLabel: "Sign Up", cartCount: 2, notifCount: 0, linkStyle: "fade", links: [{ id: "l1", label: "Home", dropdown: false }, { id: "l2", label: "Shop", dropdown: true }, { id: "l3", label: "About", dropdown: false }, { id: "l4", label: "Contact", dropdown: false }], font: "Outfit" },
     "Forest": { bg: "#1a2418", text: "#d4e6ce", accent: "#4ade80", sub: "#7aad72", border: "rgba(74,222,128,0.12)", style: "glass", position: "sticky", align: "links-left", height: 60, logoStyle: "bracket", logoText: "Brand", showSearch: true, showCart: false, showNotif: false, showUser: true, showCTA: true, ctaLabel: "Explore", cartCount: 0, notifCount: 0, linkStyle: "dot", links: [{ id: "l1", label: "Home", dropdown: false }, { id: "l2", label: "Menu", dropdown: true }, { id: "l3", label: "Gallery", dropdown: false }, { id: "l4", label: "Events", dropdown: false }], font: "Syne" },
     "Sand": { bg: "#fdf8f0", text: "#2d1f0e", accent: "#d97706", sub: "#92400e", border: "#e8d5b7", style: "bordered", position: "sticky", align: "center-logo", height: 64, logoStyle: "text-only", logoText: "Brand", showSearch: false, showCart: true, showNotif: false, showUser: true, showCTA: false, ctaLabel: "Buy Now", cartCount: 5, notifCount: 0, linkStyle: "solid", links: [{ id: "l1", label: "Home", dropdown: false }, { id: "l2", label: "Store", dropdown: true }, { id: "l3", label: "Blog", dropdown: false }, { id: "l4", label: "About", dropdown: false }], font: "Syne" },
     "Neon": { bg: "#0d0d14", text: "#e0e0ff", accent: "#00ffcc", sub: "#666899", border: "rgba(0,255,204,0.15)", style: "glass", position: "floating", align: "spread", height: 52, logoStyle: "gradient-box", logoText: "Brand", showSearch: true, showCart: true, showNotif: true, showUser: true, showCTA: true, ctaLabel: "Launch", cartCount: 1, notifCount: 2, linkStyle: "pill", links: [{ id: "l1", label: "Home", dropdown: false }, { id: "l2", label: "Docs", dropdown: false }, { id: "l3", label: "Pricing", dropdown: false }, { id: "l4", label: "Login", dropdown: false }], font: "Space Mono" },
};

/* ─── Types ─────────────────────────────────────────────────────────────────── */
export interface NavLink { id: string; label: string; dropdown: boolean; }

export interface NavbarCfg {
     bg: string; text: string; accent: string; sub: string; border: string;
     style: "solid" | "glass" | "transparent" | "bordered" | "gradient";
     position: "sticky" | "fixed" | "static" | "floating";
     align: "spread" | "center-logo" | "links-left" | "links-right";
     height: number;
     logoStyle: "gradient-box" | "text-only" | "dot-prefix" | "bracket";
     logoText: string;
     showSearch: boolean; showCart: boolean; showNotif: boolean;
     showUser: boolean; showCTA: boolean;
     ctaLabel: string;
     cartCount: number; notifCount: number;
     linkStyle: "none" | "solid" | "dot" | "pill" | "fade";
     links: NavLink[];
     font: string;
}

const uid = () => Math.random().toString(36).slice(2, 7);

const DEFAULT_CFG: NavbarCfg = PRESETS["Midnight"];

/* ─── Tiny UI helpers ───────────────────────────────────────────────────────── */
const inp = (w?: number): React.CSSProperties => ({
     background: T.navy2, border: `1px solid ${T.navy3}`,
     borderRadius: 7, color: T.white,
     fontFamily: "DM Sans, sans-serif", fontSize: 11,
     padding: "4px 8px", outline: "none",
     width: w ?? "auto",
});

function Pill({ active, onClick, children, accent = T.accent }: { active: boolean; onClick: () => void; children: React.ReactNode; accent?: string }) {
     return (
          <button onClick={onClick} style={{
               padding: "3px 9px", borderRadius: 20, border: "none", cursor: "pointer",
               fontSize: 10, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
               background: active ? accent : T.navy3,
               color: active ? T.white : T.gray2,
               transition: "background 0.15s",
               whiteSpace: "nowrap" as const,
          }}>{children}</button>
     );
}

function Toggle({ value, onChange, accent = T.accent }: { value: boolean; onChange: (v: boolean) => void; accent?: string }) {
     return (
          <button onClick={() => onChange(!value)} style={{
               width: 32, height: 18, borderRadius: 99, cursor: "pointer",
               background: value ? accent : T.navy3,
               border: `1px solid ${value ? accent : T.navy3}`,
               position: "relative", transition: "all 0.18s", flexShrink: 0,
          }}>
               <div style={{
                    position: "absolute", top: 1, left: value ? 15 : 1,
                    width: 14, height: 14, borderRadius: "50%",
                    background: value ? T.white : T.gray2,
                    transition: "left 0.18s",
               }} />
          </button>
     );
}

function ColorDot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
     return (
          <label style={{ position: "relative", width: 22, height: 22, flexShrink: 0, cursor: "pointer" }}>
               <div style={{ width: 22, height: 22, borderRadius: 6, background: value, border: `1.5px solid ${T.navy3}` }} />
               <input type="color" value={value.startsWith("rgba") ? "#6366f1" : value}
                    onChange={e => onChange(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "200%", height: "200%" }} />
          </label>
     );
}

// function SectionLabel({ children }: { children: React.ReactNode }) {
//      return <span style={{ fontSize: 9, color: T.gray2, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "DM Sans, sans-serif", fontWeight: 700, whiteSpace: "nowrap" as const }}>{children}</span>;
// }

/* ─── Mini live navbar preview ──────────────────────────────────────────────── */
function MiniPreview({ cfg }: { cfg: NavbarCfg }) {
     const [activeIdx, setActiveIdx] = useState(0);

     const navBg = {
          solid: cfg.bg,
          glass: cfg.bg,
          transparent: "transparent",
          bordered: cfg.bg,
          gradient: `linear-gradient(135deg, ${cfg.bg}, ${shiftHue(cfg.bg, 20)})`,
     }[cfg.style] ?? cfg.bg;
     type NavbarCfg = {
          logo: string
          theme: string
          [key: string]: unknown
     };
     return (
          <div style={{
               width: "100%",
               height: cfg.height,
               background: navBg,
               backdropFilter: cfg.style === "glass" ? "blur(12px)" : "none",
               borderBottom: cfg.style === "bordered" ? `2px solid ${cfg.accent}` : `1px solid ${cfg.border}`,
               borderRadius: cfg.position === "floating" ? 12 : 0,
               display: "flex", alignItems: "center",
               paddingInline: 16,
               gap: 10,
               overflow: "hidden",
               flexShrink: 0,
               fontFamily: `'${cfg.font}', DM Sans, sans-serif`,
               transition: "all 0.25s",
          }}>
               {/* Logo */}
               {cfg.align !== "center-logo" && <MiniLogo cfg={cfg} />}

               {/* Left links */}
               {cfg.align === "links-left" && (
                    <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                         {cfg.links.map((l, i) => <MiniLink key={l.id} label={l.label} active={i === activeIdx} cfg={cfg} onClick={() => setActiveIdx(i)} />)}
                    </div>
               )}

               {/* Center-logo: left half links */}
               {cfg.align === "center-logo" && (
                    <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "flex-end" }}>
                         {cfg.links.slice(0, 2).map((l, i) => <MiniLink key={l.id} label={l.label} active={i === activeIdx} cfg={cfg} onClick={() => setActiveIdx(i)} />)}
                    </div>
               )}
               {cfg.align === "center-logo" && <MiniLogo cfg={cfg} />}
               {cfg.align === "center-logo" && (
                    <div style={{ display: "flex", gap: 4, flex: 1 }}>
                         {cfg.links.slice(2).map((l, i) => <MiniLink key={l.id} label={l.label} active={i + 2 === activeIdx} cfg={cfg} onClick={() => setActiveIdx(i + 2)} />)}
                    </div>
               )}

               {/* Spread: center links */}
               {cfg.align === "spread" && (
                    <div style={{ flex: 1, display: "flex", gap: 4, justifyContent: "center" }}>
                         {cfg.links.map((l, i) => <MiniLink key={l.id} label={l.label} active={i === activeIdx} cfg={cfg} onClick={() => setActiveIdx(i)} />)}
                    </div>
               )}

               {/* links-right: flex gap then links */}
               {cfg.align === "links-right" && <div style={{ flex: 1 }} />}
               {cfg.align === "links-right" && (
                    <div style={{ display: "flex", gap: 4 }}>
                         {cfg.links.map((l, i) => <MiniLink key={l.id} label={l.label} active={i === activeIdx} cfg={cfg} onClick={() => setActiveIdx(i)} />)}
                    </div>
               )}

               {/* Right actions */}
               <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: cfg.align === "links-left" ? "auto" : 0 }}>
                    {cfg.showSearch && (
                         <div style={{ width: 22, height: 22, borderRadius: 7, background: `${cfg.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth={2.2} strokeLinecap="round"><circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" /></svg>
                         </div>
                    )}
                    {cfg.showNotif && (
                         <div style={{ position: "relative", width: 22, height: 22, borderRadius: 7, background: `${cfg.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth={2.2} strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                              {cfg.notifCount > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "#ef4444", fontSize: 7, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: `1.5px solid ${cfg.bg}` }}>{cfg.notifCount > 9 ? "9+" : cfg.notifCount}</span>}
                         </div>
                    )}
                    {cfg.showCart && (
                         <div style={{ position: "relative", width: 22, height: 22, borderRadius: 7, background: `${cfg.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth={2.2} strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1={3} y1={6} x2={21} y2={6} /><path d="M16 10a4 4 0 01-8 0" /></svg>
                              {cfg.cartCount > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: cfg.accent, fontSize: 7, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: `1.5px solid ${cfg.bg}` }}>{cfg.cartCount > 9 ? "9+" : cfg.cartCount}</span>}
                         </div>
                    )}
                    {cfg.showUser && (
                         <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${cfg.accent},${shiftHue(cfg.accent, 40)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ color: T.white, fontSize: 9, fontWeight: 800 }}>J</span>
                         </div>
                    )}
                    {cfg.showCTA && (
                         <div style={{ padding: "4px 10px", borderRadius: 8, background: cfg.accent, color: T.white, fontSize: 9, fontWeight: 700, fontFamily: `'${cfg.font}', DM Sans, sans-serif`, whiteSpace: "nowrap" as const }}>{cfg.ctaLabel}</div>
                    )}
               </div>
          </div>
     );
}

function MiniLogo({ cfg }: { cfg: NavbarCfg }) {
     if (cfg.logoStyle === "text-only") return (
          <span style={{ color: cfg.text, fontWeight: 800, fontSize: 13, fontFamily: `'${cfg.font}', DM Sans, sans-serif`, letterSpacing: "-0.03em", flexShrink: 0 }}>{cfg.logoText}</span>
     );
     if (cfg.logoStyle === "dot-prefix") return (
          <span style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
               <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.accent, boxShadow: `0 0 6px ${cfg.accent}` }} />
               <span style={{ color: cfg.text, fontWeight: 800, fontSize: 13, fontFamily: `'${cfg.font}', DM Sans, sans-serif` }}>{cfg.logoText}</span>
          </span>
     );
     if (cfg.logoStyle === "bracket") return (
          <span style={{ color: cfg.text, fontWeight: 800, fontSize: 13, fontFamily: `'${cfg.font}', DM Sans, sans-serif`, flexShrink: 0 }}>
               <span style={{ color: cfg.accent }}>[</span>{cfg.logoText}<span style={{ color: cfg.accent }}>]</span>
          </span>
     );
     return (
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
               <div style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(135deg,${cfg.accent},${shiftHue(cfg.accent, 40)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: T.white, fontWeight: 800, fontSize: 11 }}>{cfg.logoText[0]}</span>
               </div>
               <span style={{ color: cfg.text, fontWeight: 700, fontSize: 12, fontFamily: `'${cfg.font}', DM Sans, sans-serif` }}>{cfg.logoText}</span>
          </div>
     );
}

function MiniLink({ label, active, cfg, onClick }: { label: string; active: boolean; cfg: NavbarCfg; onClick: () => void }) {
     const isPill = cfg.linkStyle === "pill" || cfg.linkStyle === "fade";
     return (
          <button onClick={onClick} style={{
               background: isPill && active ? `${cfg.accent}22` : "transparent",
               border: cfg.linkStyle === "solid" && active ? `0 0 0 0 / 0` : "none",
               borderBottom: cfg.linkStyle === "solid" && active ? `2px solid ${cfg.accent}` : "none",
               borderRadius: isPill ? 6 : 0,
               padding: isPill ? "3px 8px" : "3px 4px",
               color: active ? cfg.accent : cfg.sub,
               fontSize: 10, fontWeight: active ? 700 : 500,
               fontFamily: `'${cfg.font}', DM Sans, sans-serif`,
               cursor: "pointer",
               transition: "all 0.12s",
               whiteSpace: "nowrap" as const,
               position: "relative",
          }}>
               {label}
               {cfg.linkStyle === "dot" && active && (
                    <span style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: cfg.accent }} />
               )}
          </button>
     );
}

/* ─── Main panel ────────────────────────────────────────────────────────────── */
interface Props {
     onClose: () => void;
     onInsert: (cfg: NavbarCfg) => void;
}

export default function NavbarDesignerPanel({ onClose, onInsert }: Props) {
     const [cfg, setCfg] = useState<NavbarCfg>({ ...DEFAULT_CFG });
     const [activePreset, setActivePreset] = useState("Midnight");
     const [drawerOpen, setDrawerOpen] = useState(false);
     const [drawerTab, setDrawerTab] = useState<"style" | "links" | "components">("style");

     const set = <K extends keyof NavbarCfg>(k: K, v: NavbarCfg[K]) => setCfg(c => ({ ...c, [k]: v }));

     const applyPreset = (name: string) => {
          if (PRESETS[name]) { setCfg({ ...PRESETS[name] }); setActivePreset(name); }
     };

     const addLink = () => set("links", [...cfg.links, { id: uid(), label: "New", dropdown: false }]);
     const removeLink = (id: string) => { if (cfg.links.length > 1) set("links", cfg.links.filter(l => l.id !== id)); };
     const updateLink = (id: string, patch: Partial<NavLink>) => set("links", cfg.links.map(l => l.id === id ? { ...l, ...patch } : l));

     /* ── Drawer height ── */
     const DRAWER_H = 220;

     return (
          <>
               <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');
                    .ndp-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
                    .ndp-scroll::-webkit-scrollbar-thumb { background: ${T.navy3}; border-radius: 4px; }
                    .ndp-drawer-enter { animation: ndpSlideUp 0.22s cubic-bezier(0.34,1.2,0.64,1) both; }
                    @keyframes ndpSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                    .ndp-tab { transition: color 0.15s, border-color 0.15s; }
                    .ndp-tab:hover { color: ${T.gray} !important; }
                    .ndp-hov:hover { background: ${T.navy3} !important; }
               `}</style>

               {/* ── Settings drawer (slides up above the main strip) ── */}
               {drawerOpen && (
                    <div className="ndp-drawer-enter" style={{
                         position: "fixed", bottom: 234, left: 52, right: 0,
                         height: DRAWER_H, zIndex: 201,
                         background: T.navy4,
                         borderTop: `1px solid ${T.navy3}`,
                         boxShadow: "0 -6px 28px rgba(0,0,0,0.45)",
                         display: "flex", flexDirection: "column",
                         overflow: "hidden",
                    }}>
                         {/* Drawer tabs */}
                         <div style={{ display: "flex", gap: 0, padding: "0 16px", borderBottom: `1px solid ${T.navy3}`, flexShrink: 0 }}>
                              {(["style", "links", "components"] as const).map(tab => (
                                   <button key={tab} onClick={() => setDrawerTab(tab)} className="ndp-tab"
                                        style={{ padding: "9px 14px", background: "none", border: "none", borderBottom: `2px solid ${drawerTab === tab ? T.accent : "transparent"}`, cursor: "pointer", fontSize: 11, fontFamily: "DM Sans, sans-serif", fontWeight: drawerTab === tab ? 700 : 400, color: drawerTab === tab ? T.accent : T.gray2, transition: "all 0.15s" }}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                   </button>
                              ))}
                         </div>

                         {/* Drawer body */}
                         <div className="ndp-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 16px" }}>

                              {/* ── Style tab ── */}
                              {drawerTab === "style" && (
                                   <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        <Row label="Navbar style">
                                             <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                  {(["solid", "glass", "transparent", "bordered", "gradient"] as const).map(v => (
                                                       <Pill key={v} active={cfg.style === v} onClick={() => set("style", v)} accent={cfg.accent}>{v}</Pill>
                                                  ))}
                                             </div>
                                        </Row>
                                        <Row label="Position">
                                             <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                  {(["sticky", "fixed", "static", "floating"] as const).map(v => (
                                                       <Pill key={v} active={cfg.position === v} onClick={() => set("position", v)} accent={cfg.accent}>{v}</Pill>
                                                  ))}
                                             </div>
                                        </Row>
                                        <Row label="Alignment">
                                             <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                  {([{ v: "spread", l: "Spread" }, { v: "center-logo", l: "Center logo" }, { v: "links-left", l: "Links left" }, { v: "links-right", l: "Links right" }] as const).map(({ v, l }) => (
                                                       <Pill key={v} active={cfg.align === v} onClick={() => set("align", v as NavbarCfg["align"])} accent={cfg.accent}>{l}</Pill>
                                                  ))}
                                             </div>
                                        </Row>
                                        <Row label="Link underline">
                                             <div style={{ display: "flex", gap: 4 }}>
                                                  {(["none", "solid", "dot", "pill", "fade"] as const).map(v => (
                                                       <Pill key={v} active={cfg.linkStyle === v} onClick={() => set("linkStyle", v)} accent={cfg.accent}>{v}</Pill>
                                                  ))}
                                             </div>
                                        </Row>
                                        <Row label="Logo style">
                                             <div style={{ display: "flex", gap: 4 }}>
                                                  {([{ v: "gradient-box", l: "Box" }, { v: "text-only", l: "Text" }, { v: "dot-prefix", l: "Dot" }, { v: "bracket", l: "[ ]" }] as const).map(({ v, l }) => (
                                                       <Pill key={v} active={cfg.logoStyle === v} onClick={() => set("logoStyle", v as NavbarCfg["logoStyle"])} accent={cfg.accent}>{l}</Pill>
                                                  ))}
                                             </div>
                                        </Row>
                                        <Row label="Height">
                                             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                  <input type="range" min={40} max={88} value={cfg.height} onChange={e => set("height", +e.target.value)}
                                                       style={{ width: 120, accentColor: T.accent, cursor: "pointer" }} />
                                                  <span style={{ fontSize: 10, color: T.gray2, fontFamily: "DM Sans, sans-serif" }}>{cfg.height}px</span>
                                             </div>
                                        </Row>
                                   </div>
                              )}

                              {/* ── Links tab ── */}
                              {drawerTab === "links" && (
                                   <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {cfg.links.map(link => (
                                             <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: T.navy2, borderRadius: 8, border: `1px solid ${T.navy3}` }}>
                                                  <input value={link.label} onChange={e => updateLink(link.id, { label: e.target.value })}
                                                       style={{ ...inp(), flex: 1, minWidth: 0, border: "none", background: "transparent" }} />
                                                  <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                                                       <span style={{ fontSize: 9, color: T.gray2 }}>Dropdown</span>
                                                       <Toggle value={link.dropdown} onChange={v => updateLink(link.id, { dropdown: v })} accent={T.accent} />
                                                  </label>
                                                  <button onClick={() => removeLink(link.id)} style={{ background: "none", border: "none", color: T.gray2, cursor: "pointer", fontSize: 15, lineHeight: 1 }}>×</button>
                                             </div>
                                        ))}
                                        <button onClick={addLink} style={{ padding: "7px", borderRadius: 8, border: `1.5px dashed ${T.accent}55`, background: "transparent", color: T.accent, fontSize: 11, fontFamily: "DM Sans, sans-serif", fontWeight: 600, cursor: "pointer" }}>
                                             + Add link
                                        </button>
                                   </div>
                              )}

                              {/* ── Components tab ── */}
                              {drawerTab === "components" && (
                                   <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {([
                                             { key: "showSearch", label: "Search bar" },
                                             { key: "showCart", label: "Cart" },
                                             { key: "showNotif", label: "Notifications" },
                                             { key: "showUser", label: "User menu" },
                                             { key: "showCTA", label: "CTA button" },
                                        ] as const).map(({ key, label }) => (
                                             <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                  <span style={{ fontSize: 11, color: T.gray2, fontFamily: "DM Sans, sans-serif" }}>{label}</span>
                                                  <Toggle value={cfg[key] as boolean} onChange={v => set(key, v as any)} accent={T.accent} />
                                             </div>
                                        ))}
                                        {cfg.showCart && (
                                             <Row label="Cart badge">
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                       <input type="range" min={0} max={20} value={cfg.cartCount} onChange={e => set("cartCount", +e.target.value)} style={{ width: 90, accentColor: T.accent }} />
                                                       <span style={{ fontSize: 10, color: T.gray2 }}>{cfg.cartCount}</span>
                                                  </div>
                                             </Row>
                                        )}
                                        {cfg.showNotif && (
                                             <Row label="Notif badge">
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                       <input type="range" min={0} max={20} value={cfg.notifCount} onChange={e => set("notifCount", +e.target.value)} style={{ width: 90, accentColor: T.accent }} />
                                                       <span style={{ fontSize: 10, color: T.gray2 }}>{cfg.notifCount}</span>
                                                  </div>
                                             </Row>
                                        )}
                                        {cfg.showCTA && (
                                             <Row label="CTA label">
                                                  <input value={cfg.ctaLabel} onChange={e => set("ctaLabel", e.target.value)} style={inp(110)} />
                                             </Row>
                                        )}
                                   </div>
                              )}
                         </div>
                    </div>
               )}

               {/* ════════════════════════════════════════════════════════════════
                   MAIN BOTTOM STRIP  (always visible, same height as icon picker)
               ════════════════════════════════════════════════════════════════ */}
               <div style={{
                    position: "fixed", bottom: 0, left: 52, right: 0,
                    zIndex: 202,
                    background: T.navy4,
                    borderTop: `1px solid ${T.navy3}`,
                    boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: 234,
               }}>

                    {/* ── Header row ── */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 6px", flexShrink: 0, borderBottom: `1px solid ${T.navy3}` }}>
                         {/* Icon */}
                         <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v3H3V6z" />
                              <path d="M7 7.5h2M11 7.5h2M15 7.5h2" />
                              <path d="M3 9h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                         </svg>
                         <span style={{ color: T.white, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 13 }}>Navbar Designer</span>
                         <span style={{ color: T.gray2, fontSize: 11 }}>— live preview</span>

                         {/* Preset pills */}
                         <div className="ndp-scroll" style={{ display: "flex", gap: 4, marginLeft: 8, overflowX: "auto", flex: 1 }}>
                              {Object.keys(PRESETS).map(name => (
                                   <button key={name} onClick={() => applyPreset(name)} className="ndp-hov"
                                        style={{ padding: "2px 9px", borderRadius: 20, border: `1px solid ${activePreset === name ? T.accent : T.navy3}`, background: activePreset === name ? `${T.accent}28` : T.navy2, color: activePreset === name ? T.accent : T.gray2, fontSize: 10, fontFamily: "DM Sans, sans-serif", fontWeight: activePreset === name ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all 0.15s" }}>
                                        {name}
                                   </button>
                              ))}
                         </div>

                         {/* Settings toggle */}
                         <button onClick={() => setDrawerOpen(o => !o)}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, border: `1px solid ${drawerOpen ? T.accent : T.navy3}`, background: drawerOpen ? `${T.accent}22` : "transparent", color: drawerOpen ? T.accent : T.gray2, cursor: "pointer", fontSize: 10, fontFamily: "DM Sans, sans-serif", fontWeight: 600, transition: "all 0.15s" }}>
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" style={{ transform: drawerOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6" /></svg>
                              Settings
                         </button>

                         {/* Close */}
                         <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.gray2, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>
                    </div>

                    {/* ── Preview band ── */}
                    <div style={{ padding: "8px 16px 6px", flexShrink: 0 }}>
                         <MiniPreview cfg={cfg} />
                    </div>

                    {/* ── Quick controls row ── */}
                    <div className="ndp-scroll" style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px 10px", overflowX: "auto", flexShrink: 0 }}>

                         {/* Colors */}
                         <CtrlGroup label="BG">     <ColorDot value={cfg.bg} onChange={v => set("bg", v)} /></CtrlGroup>
                         <CtrlGroup label="Text">   <ColorDot value={cfg.text} onChange={v => set("text", v)} /></CtrlGroup>
                         <CtrlGroup label="Accent"> <ColorDot value={cfg.accent} onChange={v => set("accent", v)}  /></CtrlGroup>

                         <VSep />

                         {/* Logo */}
                         <CtrlGroup label="Logo">
                              <input value={cfg.logoText} onChange={e => set("logoText", e.target.value)}
                                   style={{ ...inp(64) }} />
                         </CtrlGroup>

                         {/* Font */}
                         <CtrlGroup label="Font">
                              <select value={cfg.font} onChange={e => set("font", e.target.value)}
                                   style={{ ...inp(110) }}>
                                   {["DM Sans", "Syne", "Outfit", "Space Mono", "Fraunces", "Plus Jakarta Sans"].map(f => (
                                        <option key={f} value={f}>{f}</option>
                                   ))}
                              </select>
                         </CtrlGroup>

                         <VSep />

                         {/* Quick component toggles */}
                         <CtrlGroup label="Search">  <Toggle value={cfg.showSearch} onChange={v => set("showSearch", v)} accent={T.accent} /></CtrlGroup>
                         <CtrlGroup label="Cart">    <Toggle value={cfg.showCart} onChange={v => set("showCart", v)} accent={T.accent} /></CtrlGroup>
                         <CtrlGroup label="Notifs">  <Toggle value={cfg.showNotif} onChange={v => set("showNotif", v)} accent={T.accent} /></CtrlGroup>
                         <CtrlGroup label="User">    <Toggle value={cfg.showUser} onChange={v => set("showUser", v)} accent={T.accent} /></CtrlGroup>
                         <CtrlGroup label="CTA">     <Toggle value={cfg.showCTA} onChange={v => set("showCTA", v)} accent={T.accent} /></CtrlGroup>

                         <VSep />

                         {/* Insert button */}
                         <button onClick={() => onInsert(cfg)}
                              style={{ padding: "6px 18px", borderRadius: 9, border: "none", background: T.accent, color: T.white, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: 12, boxShadow: `0 3px 12px ${T.accent}55`, flexShrink: 0 }}>
                              ✓ Insert Navbar
                         </button>
                    </div>
               </div>
          </>
     );
}

/* ─── Panel micro-components ──────────────────────────────────────────────── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
     return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
               <span style={{ fontSize: 10, color: T.gray2, fontFamily: "DM Sans, sans-serif", minWidth: 90, flexShrink: 0 }}>{label}</span>
               <div style={{ flex: 1, display: "flex", flexWrap: "wrap" as const, gap: 4 }}>{children}</div>
          </div>
     );
}

function CtrlGroup({ label, children }: { label: string; children: React.ReactNode }) {
     return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
               <SectionLabel>{label}</SectionLabel>
               {children}
          </div>
     );
}

function VSep() {
     return <div style={{ width: 1, height: 28, background: T.navy3, flexShrink: 0, marginInline: 2 }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
     return <span style={{ fontSize: 9, color: T.gray2, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "DM Sans, sans-serif", fontWeight: 700, whiteSpace: "nowrap" as const }}>{children}</span>;
}

/* ─── Colour helper ─────────────────────────────────────────────────────────── */
function shiftHue(hex: string, deg: number): string {
     try {
          let r = parseInt(hex.slice(1, 3), 16) / 255;
          let g = parseInt(hex.slice(3, 5), 16) / 255;
          let b = parseInt(hex.slice(5, 7), 16) / 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          let h = 0, s = 0;
          const l = (max + min) / 2;
          if (max !== min) {
               const d = max - min;
               s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
               if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
               else if (max === g) h = ((b - r) / d + 2) / 6;
               else h = ((r - g) / d + 4) / 6;
          }
          h = ((h * 360 + deg) % 360) / 360;
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
          const hue2rgb = (p: number, q: number, t: number) => {
               if (t < 0) t += 1; if (t > 1) t -= 1;
               if (t < 1 / 6) return p + (q - p) * 6 * t;
               if (t < 0.5) return q;
               if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
               return p;
          };
          r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
          g = Math.round(hue2rgb(p, q, h) * 255);
          b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
     } catch { return hex; }
}
