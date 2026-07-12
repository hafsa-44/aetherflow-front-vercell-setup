// ButtomBar.tsx
// Changes applied:
//  1. Generic bottom bar: left:62, right:"20%" — 20% gap on right edge (matches navbar bar)
//  2. Icon sizes increased throughout (SVG width/height bumped from 11-13 → 15-18)
//  3. Height reduced to 130px for ALL element types (navbar bar + generic pill bar)
//  4. NEW: selectionType switcher shown when a checkbox element is selected
//     Supported types: "checkbox" | "checkbox-round" | "radio" | "toggle" | "dropdown"

import { useState, useEffect } from "react";
import { DEFAULT_NAVBAR_CFG, type NavbarConfig, type NavLink } from "./NavbarElement";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const NAVY = "#0f1f3d";
const NAVY2 = "#162847";
const NAVY3 = "#1e3a5f";
const NAVY4 = "#0b1525";
const ACCENT = "#3b82f6";
const GREEN = "#22c55e";
const RED = "#ef4444";
const WHITE = "#ffffff";
const GRAY2 = "#94a3b8";

export type SelectionType = "checkbox" | "checkbox-round" | "radio" | "toggle" | "dropdown";

// ─── CanvasElement ────────────────────────────────────────────────────────────
export interface CanvasElement {
     id: string; type: string;
     x: number; y: number; width: number; height: number;
     rotation?: number; opacity: number;
     fill: string; stroke: string; strokeWidth: number;
     shadow?: boolean; gradient?: boolean; gradientColor?: string;
     borderRadius?: number;
     text?: string; fontSize?: number; fontFamily?: string;
     fontWeight?: string; fontStyle?: string;
     cardTitle?: string; cardBody?: string;
     checked?: boolean; sliderValue?: number; carouselSlides?: any[];
     progressValue?: number; iconName?: string; imageUrl?: string;
     sketchPoints?: any[]; locked?: boolean; zIndex?: number;
     navbarConfig?: NavbarConfig;
     // NEW: selection type for checkbox elements
     selectionType?: SelectionType;
}

interface Props {
     selectedEl: CanvasElement | null;
     onUpdate: (id: string, patch: Partial<CanvasElement>) => void;
     onDelete: (id: string) => void;
     visible: boolean;
     editingCardId?: string | null;
}

const FONTS = ["DM Sans", "Syne", "Space Mono", "Outfit", "Plus Jakarta Sans", "Fraunces", "IBM Plex Sans"];

const PRESETS: { name: string; bg: string; text: string; accent: string }[] = [
     { name: "Dark", bg: "#0a0f1e", text: "#e8edf8", accent: "#6366f1" },
     { name: "Light", bg: "#ffffff", text: "#111827", accent: "#2563eb" },
     { name: "Ocean", bg: "#0c1a2e", text: "#cde4ff", accent: "#38bdf8" },
     { name: "Forest", bg: "#1a2418", text: "#d4e6ce", accent: "#4ade80" },
     { name: "Sand", bg: "#fdf8f0", text: "#2d1f0e", accent: "#d97706" },
     { name: "Neon", bg: "#0d0d14", text: "#e0e0ff", accent: "#00ffcc" },
     { name: "Rose", bg: "#1a0f14", text: "#fce7f3", accent: "#f472b6" },
];

// ─── Selection type definitions ───────────────────────────────────────────────
const SELECTION_TYPES: { type: SelectionType; label: string; icon: React.ReactNode }[] = [
     {
          type: "checkbox",
          label: "Checkbox",
          icon: (
               <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
                    <path d="M4 8l2.5 2.5L12 5" />
               </svg>
          ),
     },
     {
          type: "checkbox-round",
          label: "Rounded",
          icon: (
               <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.5" y="1.5" width="13" height="13" rx="6.5" />
                    <path d="M4 8l2.5 2.5L12 5" />
               </svg>
          ),
     },
     {
          type: "radio",
          label: "Radio",
          icon: (
               <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="8" cy="8" r="6.5" />
                    <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />
               </svg>
          ),
     },
     {
          type: "toggle",
          label: "Toggle",
          icon: (
               <svg width={18} height={14} viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                    <rect x="1" y="1" width="22" height="14" rx="7" />
                    <circle cx="17" cy="8" r="4.5" fill="currentColor" stroke="none" />
               </svg>
          ),
     },
     {
          type: "dropdown",
          label: "Dropdown",
          icon: (
               <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="14" height="10" rx="2" />
                    <path d="M5 8l3 3 3-3" />
               </svg>
          ),
     },
];

// ─── Micro primitives ─────────────────────────────────────────────────────────
const fieldInp = (extra?: React.CSSProperties): React.CSSProperties => ({
     background: "#11202f", border: `1.5px solid ${NAVY3}`, borderRadius: 7,
     color: WHITE, fontFamily: "DM Sans,sans-serif", fontSize: 11,
     padding: "4px 8px", outline: "none", transition: "border-color .15s", ...extra,
});

function FL({ c }: { c: React.ReactNode }) {
     return <span style={{ fontSize: 9, color: GRAY2, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "DM Sans,sans-serif", fontWeight: 700, whiteSpace: "nowrap" as const }}>{c}</span>;
}
function CR({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
     return (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 3, minWidth: 0, flexShrink: 0, flex: flex ? 1 : undefined }}>
               <FL c={label} />
               {children}
          </div>
     );
}
function Pill({ active, onClick, children, tiny }: { active: boolean; onClick: () => void; children: React.ReactNode; tiny?: boolean }) {
     return (
          <button onClick={onClick} style={{
               padding: tiny ? "2px 7px" : "3px 10px", borderRadius: 20,
               border: `1px solid ${active ? ACCENT : NAVY3}`, cursor: "pointer",
               fontSize: tiny ? 9 : 10, fontFamily: "DM Sans,sans-serif", fontWeight: 600,
               background: active ? `${ACCENT}22` : "transparent",
               color: active ? ACCENT : GRAY2, transition: "all .14s", whiteSpace: "nowrap" as const,
          }}>
               {children}
          </button>
     );
}
function Tog({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
     return (
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" as const }}>
               <button onClick={() => onChange(!value)} style={{
                    width: 32, height: 17, borderRadius: 99, border: "none", cursor: "pointer",
                    background: value ? ACCENT : NAVY3, position: "relative", transition: "background .18s", flexShrink: 0, padding: 0,
               }}>
                    <div style={{ position: "absolute", top: 1.5, left: value ? 16 : 1.5, width: 14, height: 14, borderRadius: "50%", background: value ? WHITE : GRAY2, transition: "left .18s" }} />
               </button>
               {label && <span style={{ fontSize: 11, color: GRAY2, fontFamily: "DM Sans,sans-serif" }}>{label}</span>}
          </label>
     );
}
// <input type="color"> only ever accepts a strict 6-digit #rrggbb string.
// Any other legal CSS color value handed to it — "none", "transparent",
// rgba(...), linear-gradient(...), 8-digit #rrggbbaa, named colors like
// "blue" — gets silently rejected by the browser and logs the
// '"none" does not conform to the required format' console warning.
// Validate with a real regex instead of special-casing two known prefixes,
// so every non-hex value (present or future) falls back safely.
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function toSafeHexColor(value?: string, fallback = "#000000"): string {
     return value && HEX_COLOR_RE.test(value) ? value : fallback;
}

function CS({ value, onChange }: { value: string; onChange: (v: string) => void }) {
     const safe = toSafeHexColor(value, "#3b82f6");
     return (
          <label style={{ position: "relative", width: 28, height: 24, cursor: "pointer", display: "block", flexShrink: 0 }}>
               {/* The visible swatch is a plain div — it can legitimately show
                    "none" / rgba / gradient, since it isn't constrained to hex
                    the way the underlying color input is. */}
               <div style={{ width: 28, height: 24, borderRadius: 5, background: value || "transparent", border: `1.5px solid ${NAVY3}` }} />
               <input type="color" value={safe} onChange={e => onChange(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
          </label>
     );
}
function Num({ value, onChange, min, max, w = 48 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; w?: number }) {
     const [f, sf] = useState(false);
     return (
          <input type="number" value={Math.round(value * 100) / 100} min={min} max={max}
               onChange={e => onChange(+e.target.value)}
               onFocus={() => sf(true)} onBlur={() => sf(false)}
               style={{ ...fieldInp({ width: w }), borderColor: f ? ACCENT : NAVY3, boxShadow: f ? `0 0 0 2px ${ACCENT}33` : "none" }} />
     );
}
function Rng({ value, onChange, min = 0, max = 100, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
     const pct = ((value - min) / (max - min)) * 100;
     return (
          <>
               <style>{`.rng{-webkit-appearance:none;appearance:none;height:3px;border-radius:4px;outline:none;cursor:pointer;width:100%}.rng::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:${WHITE};border:2px solid ${ACCENT};cursor:pointer;transition:transform .1s}.rng::-webkit-slider-thumb:hover{transform:scale(1.3)}`}</style>
               <input type="range" className="rng" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(+e.target.value)}
                    style={{ background: `linear-gradient(to right,${ACCENT} 0%,${ACCENT} ${pct}%,${NAVY3} ${pct}%,${NAVY3} 100%)`, flex: 1 }} />
          </>
     );
}
function VDiv() { return <div style={{ width: 1, height: 28, background: NAVY3, flexShrink: 0, margin: "0 3px" }} />; }
function SH({ children }: { children: React.ReactNode }) {
     return (
          <div style={{ display: "flex", alignItems: "center", gap: 7, paddingTop: 4 }}>
               <span style={{ fontSize: 8.5, color: `${ACCENT}cc`, fontFamily: "DM Sans,sans-serif", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em", whiteSpace: "nowrap" as const }}>{children}</span>
               <div style={{ flex: 1, height: 1, background: NAVY3 }} />
          </div>
     );
}

// ─── Inline height stepper (used in navbar header) ────────────────────────────
function HeightCtrl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
     return (
          <div style={{
               display: "flex", alignItems: "center", gap: 5,
               background: NAVY2, border: `1px solid ${NAVY3}`, borderRadius: 9,
               padding: "3px 8px", flexShrink: 0,
          }}>
               <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={GRAY2} strokeWidth={2} strokeLinecap="round">
                    <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
               </svg>
               <span style={{ fontSize: 9, color: GRAY2, fontFamily: "DM Sans,sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>H</span>
               <button
                    onClick={() => onChange(Math.max(24, value - 2))}
                    style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${NAVY3}`, background: "transparent", color: WHITE, cursor: "pointer", fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
                    −
               </button>
               <div style={{ width: 90, display: "flex", alignItems: "center" }}>
                    <Rng value={value} onChange={onChange} min={24} max={120} step={1} />
               </div>
               <button
                    onClick={() => onChange(Math.min(120, value + 2))}
                    style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${NAVY3}`, background: "transparent", color: WHITE, cursor: "pointer", fontSize: 15, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
                    +
               </button>
               <span style={{ fontSize: 11, color: ACCENT, fontFamily: "DM Sans,sans-serif", fontWeight: 700, minWidth: 32, textAlign: "center" }}>
                    {value}px
               </span>
               <div style={{ width: 1, height: 14, background: NAVY3, flexShrink: 0 }} />
               {[30, 44, 56, 72].map(h => (
                    <button key={h} onClick={() => onChange(h)} style={{
                         padding: "2px 6px", borderRadius: 5, border: `1px solid ${value === h ? ACCENT : NAVY3}`,
                         background: value === h ? `${ACCENT}28` : "transparent",
                         color: value === h ? ACCENT : GRAY2,
                         cursor: "pointer", fontSize: 9, fontFamily: "DM Sans,sans-serif",
                         fontWeight: value === h ? 700 : 400, flexShrink: 0,
                    }}>{h}</button>
               ))}
          </div>
     );
}

// ─── NEW: Selection Type Switcher ─────────────────────────────────────────────
function SelectionTypeSwitcher({ value, onChange }: { value: SelectionType; onChange: (v: SelectionType) => void }) {
     return (
          <CR label="Kind">
               <div style={{ display: "flex", gap: 3 }}>
                    {SELECTION_TYPES.map(st => {
                         const isActive = value === st.type;
                         return (
                              <button
                                   key={st.type}
                                   title={st.label}
                                   onClick={() => onChange(st.type)}
                                   style={{
                                        width: 30, height: 26, borderRadius: 6, border: `1px solid ${isActive ? ACCENT : NAVY3}`,
                                        background: isActive ? `${ACCENT}22` : "transparent",
                                        color: isActive ? ACCENT : GRAY2, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all .14s", flexShrink: 0,
                                   }}
                              >
                                   {st.icon}
                              </button>
                         );
                    })}
               </div>
          </CR>
     );
}

// ─── Navbar inspector ─────────────────────────────────────────────────────────
function NavInspector({ el, onDone, onDelete, onOpacityChange }: {
     el: CanvasElement;
     onDone: (cfg: NavbarConfig) => void;
     onDelete: () => void;
     onOpacityChange: (v: number) => void;
}) {
     const [d, sd] = useState<NavbarConfig>({ ...DEFAULT_NAVBAR_CFG, ...(el.navbarConfig || {}) });
     useEffect(() => { sd({ ...DEFAULT_NAVBAR_CFG, ...(el.navbarConfig || {}) }); }, [el.id]);

     const s = <K extends keyof NavbarConfig>(k: K, v: NavbarConfig[K]) => sd(c => ({ ...c, [k]: v }));
     const uid = () => Math.random().toString(36).slice(2, 7);

     const addLink = () => s("links", [...d.links, { id: uid(), label: "New Link", active: false, hasDropdown: false }]);
     const delLink = (id: string) => { if (d.links.length > 1) s("links", d.links.filter(l => l.id !== id)); };
     const patchL = (id: string, p: Partial<NavLink>) => s("links", d.links.map(l => l.id === id ? { ...l, ...p } : l));
     const setAct = (id: string) => s("links", d.links.map(l => ({ ...l, active: l.id === id })));

     return (
          <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
               <div className="nb-sc" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 16px 20px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                    <SH>Quick Presets</SH>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                         {PRESETS.map(p => (
                              <button key={p.name} onClick={() => sd(c => ({ ...c, bg: p.bg, textColor: p.text, accent: p.accent }))}
                                   style={{ padding: "3px 10px", borderRadius: 7, border: `1px solid ${NAVY3}`, background: p.bg, color: p.text, fontSize: 10, fontFamily: "DM Sans,sans-serif", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                                   <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.accent, display: "block" }} />
                                   {p.name}
                              </button>
                         ))}
                    </div>
                    <SH>Colors</SH>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                         <CR label="Background"><CS value={d.bg} onChange={v => s("bg", v)} /></CR>
                         <CR label="Text"><CS value={d.textColor} onChange={v => s("textColor", v)} /></CR>
                         <CR label="Accent"><CS value={d.accent} onChange={v => s("accent", v)} /></CR>
                         <CR label="Border"><CS value={(d.borderColor || "#000").replace(/rgba?.*/, "#1e3a5f")} onChange={v => s("borderColor", v)} /></CR>
                    </div>
                    <SH>Layout</SH>
                    <CR label="Navbar Style">
                         <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {(["solid", "glass", "bordered", "gradient", "transparent"] as const).map(v => <Pill key={v} active={d.style === v} onClick={() => s("style", v)} tiny>{v}</Pill>)}
                         </div>
                    </CR>
                    <CR label="Position (CSS)">
                         <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {(["sticky", "fixed", "static", "floating"] as const).map(v => <Pill key={v} active={d.position === v} onClick={() => s("position", v)} tiny>{v}</Pill>)}
                         </div>
                    </CR>
                    <CR label="Link Alignment">
                         <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {([["spread", "Spread"], ["center-logo", "Center logo"], ["links-left", "Links left"], ["links-right", "Links right"]] as const).map(([v, l]) => (
                                   <Pill key={v} active={d.align === v} onClick={() => s("align", v as NavbarConfig["align"])} tiny>{l}</Pill>
                              ))}
                         </div>
                    </CR>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                         <CR label={`Radius  ${d.borderRadius}px`} flex>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                   <Rng value={d.borderRadius} onChange={v => s("borderRadius", v)} min={0} max={32} />
                                   <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: "DM Sans", minWidth: 22 }}>{d.borderRadius}</span>
                              </div>
                         </CR>
                         <CR label={`Padding  ${d.paddingX}px`} flex>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                   <Rng value={d.paddingX} onChange={v => s("paddingX", v)} min={8} max={80} />
                                   <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: "DM Sans", minWidth: 22 }}>{d.paddingX}</span>
                              </div>
                         </CR>
                    </div>
                    <SH>Effects</SH>
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
                         <Tog value={d.shadow} onChange={v => s("shadow", v)} label="Drop shadow" />
                         <Tog value={d.showDivider} onChange={v => s("showDivider", v)} label="Bottom border" />
                         {d.style === "glass" && (
                              <CR label={`Blur  ${d.blur}px`} flex>
                                   <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Rng value={d.blur} onChange={v => s("blur", v)} min={4} max={40} />
                                        <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: "DM Sans", minWidth: 22 }}>{d.blur}</span>
                                   </div>
                              </CR>
                         )}
                    </div>
                    <SH>Logo</SH>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                         <CR label="Text">
                              <input value={d.logoText} onChange={e => s("logoText", e.target.value)} style={fieldInp({ width: 92 })} />
                         </CR>
                         <CR label="Logo style">
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                   {([["box", "■ Box"], ["pill", "● Pill"], ["dot", "· Dot"], ["bracket", "[ ]"], ["text", "T Text"]] as const).map(([v, l]) => (
                                        <Pill key={v} active={d.logoStyle === v} onClick={() => s("logoStyle", v as NavbarConfig["logoStyle"])} tiny>{l}</Pill>
                                   ))}
                              </div>
                         </CR>
                    </div>
                    <SH>Typography</SH>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                         <CR label="Font">
                              <select value={d.font} onChange={e => s("font", e.target.value)} style={fieldInp({ width: 138 })}>
                                   {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                         </CR>
                         <CR label="Size">
                              <Num value={d.fontSize} onChange={v => s("fontSize", v)} min={10} max={18} w={46} />
                         </CR>
                         <CR label="Weight">
                              <div style={{ display: "flex", gap: 3 }}>
                                   {(["400", "500", "600", "700"] as const).map(w => <Pill key={w} active={d.fontWeight === w} onClick={() => s("fontWeight", w)} tiny>{w}</Pill>)}
                              </div>
                         </CR>
                         <CR label="Letter spacing" flex>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                   <Rng value={d.letterSpacing} onChange={v => s("letterSpacing", v)} min={-0.05} max={0.2} step={0.01} />
                                   <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: "DM Sans", minWidth: 28 }}>{d.letterSpacing.toFixed(2)}</span>
                              </div>
                         </CR>
                    </div>
                    <SH>Link Style</SH>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                         {(["pill", "underline", "dot", "fade", "none"] as const).map(v => <Pill key={v} active={d.linkStyle === v} onClick={() => s("linkStyle", v)} tiny>{v}</Pill>)}
                    </div>
                    <SH>Nav Links</SH>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                         {d.links.map(link => (
                              <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 9px", background: NAVY2, borderRadius: 8, border: `1px solid ${link.active ? ACCENT + "44" : NAVY3}` }}>
                                   <input value={link.label} onChange={e => patchL(link.id, { label: e.target.value })}
                                        style={{ ...fieldInp({ flex: "1" as any, minWidth: 50, border: "none", background: "transparent" }) }} />
                                   <button onClick={() => setAct(link.id)}
                                        style={{ padding: "2px 8px", borderRadius: 5, border: `1px solid ${link.active ? ACCENT : NAVY3}`, background: link.active ? `${ACCENT}22` : "transparent", color: link.active ? ACCENT : GRAY2, fontSize: 9, cursor: "pointer", fontFamily: "DM Sans", fontWeight: 700, whiteSpace: "nowrap" as const }}>
                                        {link.active ? "✓ Active" : "Set active"}
                                   </button>
                                   <span style={{ fontSize: 9, color: GRAY2, whiteSpace: "nowrap" as const }}>Dropdown</span>
                                   <Tog value={!!link.hasDropdown} onChange={v => patchL(link.id, { hasDropdown: v })} />
                                   <button onClick={() => delLink(link.id)} disabled={d.links.length <= 1}
                                        style={{ background: "none", border: "none", color: d.links.length <= 1 ? NAVY3 : RED, cursor: d.links.length <= 1 ? "default" : "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>
                              </div>
                         ))}
                         <button onClick={addLink}
                              style={{ padding: "5px", borderRadius: 8, border: `1.5px dashed ${ACCENT}44`, background: "transparent", color: ACCENT, fontSize: 11, fontFamily: "DM Sans,sans-serif", fontWeight: 600, cursor: "pointer" }}>
                              + Add link
                         </button>
                    </div>
                    <SH>Components</SH>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 24px" }}>
                         {([
                              ["showSearch", "🔍 Search bar"],
                              ["showCart", "🛒 Cart"],
                              ["showNotif", "🔔 Notifications"],
                              ["showUser", "👤 User avatar"],
                              ["showLoginOut", "→ Login / Logout"],
                              ["showCTA", "★ CTA button"],
                              ["showThemeToggle", "◑ Theme toggle"],
                         ] as const).map(([k, l]) => (
                              <Tog key={k} value={d[k] as boolean} onChange={v => s(k, v as any)} label={l} />
                         ))}
                    </div>
                    {d.showCart && (
                         <CR label={`Cart badge  ${d.cartCount}`} flex>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                   <Rng value={d.cartCount} onChange={v => s("cartCount", v)} min={0} max={20} />
                                   <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: "DM Sans", minWidth: 18 }}>{d.cartCount}</span>
                              </div>
                         </CR>
                    )}
                    {d.showNotif && (
                         <CR label={`Notif badge  ${d.notifCount}`} flex>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                   <Rng value={d.notifCount} onChange={v => s("notifCount", v)} min={0} max={20} />
                                   <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: "DM Sans", minWidth: 18 }}>{d.notifCount}</span>
                              </div>
                         </CR>
                    )}
                    {d.showCTA && (
                         <>
                              <SH>CTA Button</SH>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                                   <CR label="Label">
                                        <input value={d.ctaLabel} onChange={e => s("ctaLabel", e.target.value)} style={fieldInp({ width: 110 })} />
                                   </CR>
                                   <CR label="Button style">
                                        <div style={{ display: "flex", gap: 4 }}>
                                             {(["filled", "outline", "ghost"] as const).map(v => <Pill key={v} active={d.ctaStyle === v} onClick={() => s("ctaStyle", v)} tiny>{v}</Pill>)}
                                        </div>
                                   </CR>
                              </div>
                         </>
                    )}
                    <div style={{ height: 8, flexShrink: 0 }} />
               </div>
               <div style={{ width: 92, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, padding: "12px 10px", borderLeft: `1px solid ${NAVY3}`, background: NAVY4 }}>
                    <button onClick={() => onDone(d)}
                         style={{ padding: "9px 0", borderRadius: 9, border: "none", background: ACCENT, color: WHITE, fontFamily: "DM Sans,sans-serif", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: `0 3px 16px ${ACCENT}55`, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background .15s" }}
                         onMouseEnter={e => (e.currentTarget.style.background = "#1d4ed8")}
                         onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}>
                         <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                         Done
                    </button>
                    <div style={{ height: 1, background: NAVY3 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                         <FL c={`Opacity ${Math.round((el.opacity ?? 1) * 100)}%`} />
                         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Rng value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} onChange={v => onOpacityChange(v / 100)} />
                         </div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                         <FL c="Size" />
                         <span style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans,sans-serif" }}>{Math.round(el.width)} px</span>
                         <span style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans,sans-serif" }}>{(el.navbarConfig?.height ?? el.height)} px h</span>
                    </div>
                    <div style={{ height: 1, background: NAVY3 }} />
                    <button onClick={onDelete}
                         style={{ padding: "7px 0", borderRadius: 8, border: `1px solid ${RED}44`, background: "transparent", color: RED, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "background .15s" }}
                         onMouseEnter={e => (e.currentTarget.style.background = `${RED}18`)}
                         onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                         <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                         Delete
                    </button>
               </div>
          </div>
     );
}

// ─── Main BottomBar ───────────────────────────────────────────────────────────
export default function BottomBar({ selectedEl: el, onUpdate, onDelete, visible, editingCardId }: Props) {
     const [hov, setHov] = useState<string | null>(null);
     const isNavbar = el?.type === "navbar";

     const navbarShell: React.CSSProperties = {
          position: "fixed",
          bottom: visible ? "1.4vh" : "-60vh",
          left: 62,
          right: "20%",
          zIndex: 300,
          background: "rgba(10,17,30,0.97)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1.5px solid ${NAVY3}`,
          borderRadius: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
          transition: "bottom .32s cubic-bezier(.34,1.56,.64,1), opacity .22s ease",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "all" : "none",
          overflow: "hidden",
          height: 130,
          display: "flex",
          flexDirection: "column",
     };

     const genericShell: React.CSSProperties = {
          position: "fixed",
          bottom: visible ? "1.4vh" : "-30vh",
          left: 62,
          right: "20%",
          zIndex: 300,
          background: "rgba(10,17,30,0.97)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1.5px solid ${NAVY3}`,
          borderRadius: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
          transition: "bottom .32s cubic-bezier(.34,1.56,.64,1), opacity .22s ease",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "all" : "none",
          overflow: "hidden",
          height: 130,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          padding: "0 16px",
          overflowX: "auto",
          overflowY: "hidden",
     };

     if (!el) return (
          <div style={{ ...genericShell, justifyContent: "center" }}>
               <span style={{ color: GRAY2, fontSize: 12, fontFamily: "DM Sans,sans-serif" }}>Select an element to edit</span>
          </div>
     );

     const u = (patch: Partial<CanvasElement>) => onUpdate(el.id, patch);

     if (isNavbar) {
          const currentCfg: NavbarConfig = { ...DEFAULT_NAVBAR_CFG, ...(el.navbarConfig || {}) };
          return (
               <div style={navbarShell}>
                    <style>{`
                         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&family=Outfit:wght@400;600;700&family=Space+Mono&family=Plus+Jakarta+Sans:wght@400;600;700&family=Fraunces:wght@400;700&display=swap');
                         .nb-sc::-webkit-scrollbar{width:4px}.nb-sc::-webkit-scrollbar-thumb{background:${NAVY3};border-radius:4px}
                    `}</style>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderBottom: `1px solid ${NAVY3}`, flexShrink: 0, background: "rgba(9,16,28,.98)", flexWrap: "wrap" }}>
                         <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 8a2 2 0 012-2h16a2 2 0 012 2v2H2V8z" />
                              <path d="M2 10h20v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8z" />
                              <path d="M6 9h.01M9 9h.01M12 9h.01M16 9h4" />
                         </svg>
                         <span style={{ color: WHITE, fontFamily: "DM Sans,sans-serif", fontWeight: 700, fontSize: 12 }}>Navbar Inspector</span>
                         <HeightCtrl
                              value={currentCfg.height}
                              onChange={h => {
                                   const next = { ...currentCfg, height: h };
                                   onUpdate(el.id, { navbarConfig: next, height: h });
                              }}
                         />
                         <div style={{ flex: 1 }} />
                         <div style={{ padding: "2px 8px", borderRadius: 20, background: NAVY3, color: GRAY2, fontSize: 9, fontFamily: "DM Sans,sans-serif", fontWeight: 600 }}>
                              {Math.round(el.width)} × {currentCfg.height}px
                         </div>
                         <span style={{ color: GRAY2, fontSize: 10, fontFamily: "DM Sans,sans-serif" }}>tweak → Done to apply</span>
                    </div>
                    <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                         <NavInspector
                              el={el}
                              onDone={cfg => onUpdate(el.id, { navbarConfig: cfg, height: cfg.height })}
                              onDelete={() => onDelete(el.id)}
                              onOpacityChange={v => onUpdate(el.id, { opacity: v })}
                         />
                    </div>
               </div>
          );
     }

     // ── All other elements — horizontal pill strip ────────────────────────────
     const isText = el.type === "text";
     const isShape = ["rect", "circle", "ellipse", "square", "diamond"].includes(el.type);
     const isLine = el.type === "line";
     const isCard = el.type === "card";
     const isImg = ["image", "imagebox"].includes(el.type);
     const isProg = el.type === "progress";
     const isCheckbox = el.type === "checkbox";  // NEW
     const hasTxt = isText || isCard;
     const hasFill = !isLine && !isImg;
     const hasBR = isShape || isCard || isImg;

     const Btn = (id: string, danger = false): React.CSSProperties => ({
          height: 32, paddingInline: 12, borderRadius: 7, border: "none", cursor: "pointer",
          fontSize: 11, fontFamily: "DM Sans,sans-serif", fontWeight: 600,
          background: hov === id ? (danger ? "#dc2626" : ACCENT) : (danger ? "#7f1d1d" : NAVY3),
          color: WHITE, transition: "background .14s", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 5,
     });

     return (
          <div style={genericShell}>
               <style>{`.rng{-webkit-appearance:none;appearance:none;height:3px;border-radius:4px;outline:none;cursor:pointer}.rng::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:${WHITE};border:2px solid ${ACCENT};cursor:pointer}`}</style>

               {/* Type badge */}
               <div style={{ padding: "3px 10px", borderRadius: 20, background: NAVY3, color: GRAY2, fontSize: 9, fontFamily: "DM Sans,sans-serif", fontWeight: 600, flexShrink: 0, textTransform: "capitalize" as const }}>{el.type}</div>
               <VDiv />

               {/* NEW: Selection type switcher — only for checkbox elements */}
               {isCheckbox && (
                    <>
                         <SelectionTypeSwitcher
                              value={(el.selectionType as SelectionType) || "checkbox"}
                              onChange={v => u({ selectionType: v } as any)}
                         />
                         <VDiv />
                    </>
               )}

               {hasFill && <CR label="Fill"><CS value={el.fill || "#3b82f6"} onChange={v => u({ fill: v })} /></CR>}
               <CR label="Stroke">
                    <div style={{ display: "flex", gap: 4 }}>
                         <CS value={el.stroke || "#000"} onChange={v => u({ stroke: v })} />
                         <Num value={el.strokeWidth ?? 1} onChange={v => u({ strokeWidth: v })} min={0} max={20} w={42} />
                    </div>
               </CR>
               {hasBR && <CR label="Radius"><Num value={(el as any).borderRadius ?? 0} onChange={v => u({ borderRadius: v } as any)} min={0} max={120} w={46} /></CR>}
               <VDiv />

               <CR label={`Opacity ${Math.round((el.opacity ?? 1) * 100)}%`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, width: 84 }}>
                         <Rng value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} onChange={v => u({ opacity: v / 100 })} />
                    </div>
               </CR>

               {isProg && (
                    <><VDiv />
                         <CR label={`Progress ${(el as any).progressValue ?? 60}%`}>
                              <div style={{ width: 84 }}>
                                   <Rng value={(el as any).progressValue ?? 60} min={0} max={100} onChange={v => u({ progressValue: v } as any)} />
                              </div>
                         </CR></>
               )}

               {(isShape || isCard) && (
                    <><VDiv />
                         <CR label="Effects">
                              <div style={{ display: "flex", gap: 4 }}>
                                   <Pill active={!!(el as any).shadow} onClick={() => u({ shadow: !(el as any).shadow } as any)}>Shadow</Pill>
                                   <Pill active={!!(el as any).gradient} onClick={() => u({ gradient: !(el as any).gradient } as any)}>Grad</Pill>
                              </div>
                         </CR>
                         {(el as any).gradient && (
                              <CR label="End color"><CS value={(el as any).gradientColor || "#a855f7"} onChange={v => u({ gradientColor: v } as any)} /></CR>
                         )}</>
               )}

               {hasTxt && (
                    <><VDiv />
                         <CR label="Font">
                              <select value={el.fontFamily || "DM Sans"} onChange={e => u({ fontFamily: e.target.value })} style={fieldInp({ width: 108, paddingRight: 4 })}>
                                   {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                         </CR>
                         <CR label="Size"><Num value={el.fontSize ?? 16} onChange={v => u({ fontSize: v })} min={8} max={120} w={46} /></CR>
                         <CR label="Style">
                              <div style={{ display: "flex", gap: 3 }}>
                                   <Pill active={el.fontWeight === "700"} onClick={() => u({ fontWeight: el.fontWeight === "700" ? "400" : "700" })}>B</Pill>
                                   <Pill active={el.fontStyle === "italic"} onClick={() => u({ fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}>I</Pill>
                              </div>
                         </CR></>
               )}

               <VDiv />
               <CR label="X"><Num value={Math.round(el.x)} onChange={v => u({ x: v })} w={46} /></CR>
               <CR label="Y"><Num value={Math.round(el.y)} onChange={v => u({ y: v })} w={46} /></CR>
               <CR label="W"><Num value={Math.round(el.width)} onChange={v => u({ width: Math.max(8, v) })} min={8} w={46} /></CR>
               <CR label="H"><Num value={Math.round(el.height)} onChange={v => u({ height: Math.max(8, v) })} min={8} w={46} /></CR>
               {(el as any).rotation !== undefined && (
                    <CR label="°"><Num value={Math.round(((el.rotation ?? 0) % 360 + 360) % 360)} onChange={v => u({ rotation: v } as any)} min={0} max={359} w={46} /></CR>
               )}
               <VDiv />

               <button style={Btn("del", true)} onMouseEnter={() => setHov("del")} onMouseLeave={() => setHov(null)} onClick={() => onDelete(el.id)}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                         <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                    Delete
               </button>
          </div>
     );
}