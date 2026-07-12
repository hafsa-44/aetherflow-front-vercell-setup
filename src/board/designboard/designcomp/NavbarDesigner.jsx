import { useState, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   NAVBAR DESIGNER — live preview + full customization panel
   ══════════════════════════════════════════════════════════════════════════════ */

const FONTS = {
  "Syne":        "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap",
  "DM Sans":     "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  "Outfit":      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap",
  "Plus Jakarta Sans": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  "Fraunces":    "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700;900&display=swap",
  "Space Mono":  "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",
};

const PRESETS = {
  "Midnight Ink": {
    bg: "#0a0f1e", text: "#e8edf8", accent: "#6366f1", secondaryText: "#8892aa",
    border: "rgba(255,255,255,0.07)", hoverBg: "rgba(99,102,241,0.12)",
    shadow: "0 8px 40px rgba(0,0,0,0.5)", font: "Syne",
  },
  "Arctic White": {
    bg: "#ffffff", text: "#111827", accent: "#2563eb", secondaryText: "#6b7280",
    border: "#e5e7eb", hoverBg: "#f0f5ff",
    shadow: "0 2px 20px rgba(0,0,0,0.08)", font: "Plus Jakarta Sans",
  },
  "Forest Moss": {
    bg: "#1a2418", text: "#d4e6ce", accent: "#4ade80", secondaryText: "#7aad72",
    border: "rgba(74,222,128,0.12)", hoverBg: "rgba(74,222,128,0.08)",
    shadow: "0 8px 40px rgba(0,0,0,0.4)", font: "Outfit",
  },
  "Warm Sand": {
    bg: "#fdf8f0", text: "#2d1f0e", accent: "#d97706", secondaryText: "#92400e",
    border: "#e8d5b7", hoverBg: "#fef3c7",
    shadow: "0 2px 20px rgba(180,120,40,0.12)", font: "Fraunces",
  },
  "Cyber Neon": {
    bg: "#0d0d14", text: "#e0e0ff", accent: "#00ffcc", secondaryText: "#666899",
    border: "rgba(0,255,204,0.15)", hoverBg: "rgba(0,255,204,0.07)",
    shadow: "0 8px 40px rgba(0,0,0,0.6)", font: "Space Mono",
  },
  "Rose Quartz": {
    bg: "#fff5f7", text: "#3d1520", accent: "#e11d48", secondaryText: "#9f3a5a",
    border: "#fecdd3", hoverBg: "#ffe4e6",
    shadow: "0 2px 24px rgba(225,29,72,0.1)", font: "DM Sans",
  },
};

const DEFAULT_CONFIG = {
  // Preset / colors
  preset: "Midnight Ink",
  bg: "#0a0f1e",
  text: "#e8edf8",
  accent: "#6366f1",
  secondaryText: "#8892aa",
  border: "rgba(255,255,255,0.07)",
  hoverBg: "rgba(99,102,241,0.12)",
  shadow: "0 8px 40px rgba(0,0,0,0.5)",

  // Typography
  font: "Syne",
  fontSize: 13,
  fontWeight: "600",
  letterSpacing: "0",

  // Layout
  style: "solid",         // solid | glass | transparent | bordered | gradient
  position: "sticky",     // sticky | fixed | static | floating
  alignment: "spread",    // spread | center-logo | links-left | links-right
  height: 60,
  borderRadius: 0,        // 0 = full-width; >0 = floating pill
  maxWidth: 1280,
  paddingX: 24,

  // Logo
  logoText: "Brand",
  logoStyle: "gradient-box", // gradient-box | text-only | dot-prefix | bracket

  // Visible sections (toggles)
  showSearch: true,
  showCart: true,
  showNotif: true,
  showTheme: true,
  showUser: true,
  showCTA: true,
  ctaLabel: "Get Started",

  // Nav links
  links: [
    { id: "l1", label: "Home",     active: true,  dropdown: false },
    { id: "l2", label: "Products", active: false, dropdown: true  },
    { id: "l3", label: "Pricing",  active: false, dropdown: false },
    { id: "l4", label: "Blog",     active: false, dropdown: false },
    { id: "l5", label: "About",    active: false, dropdown: false },
  ],

  // Cart
  cartCount: 3,

  // Notif
  notifCount: 5,

  // Link underline style: none | solid | dot | pill | fade
  linkStyle: "pill",

  // Dividers
  showDividers: true,

  // Mobile breakpoint (px)
  mobileBreak: 768,
};

/* ── tiny uid ── */
const uid = () => Math.random().toString(36).slice(2, 7);

/* ══════════════════════════════════════════════════════════════════════════════
   LIVE NAVBAR PREVIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function LiveNavbar({ cfg, isMobile }) {
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [cartOpen,     setCartOpen]     = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink,   setActiveLink]   = useState(cfg.links.find(l=>l.active)?.id || cfg.links[0]?.id);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [theme,        setTheme]        = useState("dark");

  /* style helpers */
  const navBg = {
    solid:       cfg.bg,
    glass:       cfg.bg.startsWith("#") ? hexToRgba(cfg.bg, 0.72) + "; backdrop-filter:blur(20px)" : cfg.bg,
    transparent: "transparent",
    bordered:    cfg.bg,
    gradient:    `linear-gradient(135deg, ${cfg.bg}, ${shiftHue(cfg.bg, 20)})`,
  }[cfg.style] ?? cfg.bg;

  const navStyle = {
    background:   navBg,
    borderBottom: cfg.style === "bordered" ? `1.5px solid ${cfg.accent}` : `1px solid ${cfg.border}`,
    boxShadow:    cfg.shadow,
    backdropFilter: cfg.style === "glass" ? "blur(20px) saturate(1.8)" : "none",
    height:       cfg.height,
    fontFamily:   `'${cfg.font}', sans-serif`,
    fontSize:     cfg.fontSize,
    fontWeight:   cfg.fontWeight,
    letterSpacing: cfg.letterSpacing !== "0" ? cfg.letterSpacing : undefined,
    position:     cfg.position === "floating" ? "relative" : cfg.position,
    top:          (cfg.position === "sticky" || cfg.position === "fixed") ? 0 : undefined,
    zIndex:       200,
    transition:   "all 0.3s ease",
    padding:      cfg.borderRadius > 0 ? `0 ${cfg.paddingX}px` : `0`,
    borderRadius: cfg.borderRadius > 0 ? cfg.borderRadius : 0,
    margin:       cfg.position === "floating" ? "12px auto" : 0,
    width:        cfg.position === "floating" ? `calc(100% - 48px)` : "100%",
  };

  const inner = {
    maxWidth:      cfg.maxWidth,
    marginInline:  "auto",
    paddingInline: cfg.paddingX,
    height:        "100%",
    display:       "flex",
    alignItems:    "center",
    gap:           16,
  };

  /* Logo */
  const Logo = () => {
    if (cfg.logoStyle === "text-only") return (
      <span style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 800, fontSize: cfg.fontSize + 4, color: cfg.text, letterSpacing: "-0.03em", cursor: "pointer" }}>{cfg.logoText}</span>
    );
    if (cfg.logoStyle === "dot-prefix") return (
      <span style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.accent, display: "inline-block", boxShadow: `0 0 10px ${cfg.accent}` }} />
        <span style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 800, fontSize: cfg.fontSize + 4, color: cfg.text, letterSpacing: "-0.03em" }}>{cfg.logoText}</span>
      </span>
    );
    if (cfg.logoStyle === "bracket") return (
      <span style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 800, fontSize: cfg.fontSize + 4, color: cfg.text, cursor: "pointer" }}>
        <span style={{ color: cfg.accent }}>[</span>{cfg.logoText}<span style={{ color: cfg.accent }}>]</span>
      </span>
    );
    // gradient-box (default)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${cfg.accent}, ${shiftHue(cfg.accent, 40)})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${cfg.accent}55` }}>
          <span style={{ color: "#fff", fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{cfg.logoText[0]}</span>
        </div>
        <span style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: cfg.fontSize + 2, color: cfg.text }}>{cfg.logoText}</span>
      </div>
    );
  };

  /* Link style renderer */
  const LinkEl = ({ link }) => {
    const isActive = activeLink === link.id;
    const [hov, setHov] = useState(false);
    const highlight = isActive || hov;

    const underlineStyles = {
      none:  {},
      solid: { borderBottom: `2px solid ${cfg.accent}`, paddingBottom: 2 },
      dot:   {},
      pill:  { background: highlight ? cfg.hoverBg : "transparent", borderRadius: 8, padding: "6px 14px" },
      fade:  { background: highlight ? cfg.hoverBg : "transparent", borderRadius: 6, padding: "6px 12px" },
    };

    return (
      <div style={{ position: "relative" }}
        onMouseEnter={() => { setHov(true); if (link.dropdown) setDropdownOpen(link.id); }}
        onMouseLeave={() => { setHov(false); if (link.dropdown) setDropdownOpen(null); }}>
        <button
          onClick={() => setActiveLink(link.id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: `'${cfg.font}',sans-serif`,
            fontSize: cfg.fontSize, fontWeight: cfg.fontWeight,
            letterSpacing: cfg.letterSpacing !== "0" ? cfg.letterSpacing : undefined,
            color: isActive ? cfg.accent : hov ? cfg.text : cfg.secondaryText,
            transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 5,
            padding: cfg.linkStyle === "pill" || cfg.linkStyle === "fade" ? "6px 14px" : "6px 4px",
            borderRadius: cfg.linkStyle === "pill" || cfg.linkStyle === "fade" ? 8 : 0,
            background: (cfg.linkStyle === "pill" || cfg.linkStyle === "fade") && highlight ? cfg.hoverBg : "transparent",
            ...(cfg.linkStyle === "solid" && isActive ? { borderBottom: `2px solid ${cfg.accent}`, paddingBottom: 2 } : {}),
          }}>
          {link.label}
          {link.dropdown && (
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
              style={{ transform: dropdownOpen === link.id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
          {/* dot style active indicator */}
          {cfg.linkStyle === "dot" && isActive && (
            <span style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: cfg.accent }} />
          )}
        </button>

        {/* Dropdown */}
        {link.dropdown && dropdownOpen === link.id && (
          <div style={{ position: "absolute", top: "calc(100% + 12px)", left: -12, width: 220, background: cfg.bg, borderRadius: 14, boxShadow: `0 16px 48px rgba(0,0,0,0.3)`, border: `1.5px solid ${cfg.border}`, overflow: "hidden", animation: "ddFade 0.15s ease", zIndex: 300 }}>
            {["All Products", "New Arrivals", "Best Sellers", "Sale"].map((item, i) => (
              <DropItem key={i} label={item} cfg={cfg} />
            ))}
          </div>
        )}
      </div>
    );
  };

  /* Icon button */
  const IconBtn = ({ children, badge, onClick, title }) => {
    const [hov, setHov] = useState(false);
    return (
      <div style={{ position: "relative" }}>
        <button title={title} onClick={onClick}
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${hov ? cfg.accent + "66" : "transparent"}`, background: hov ? cfg.hoverBg : "transparent", color: hov ? cfg.accent : cfg.secondaryText, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}>
          {children}
        </button>
        {badge > 0 && (
          <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 99, background: cfg.accent, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", border: `2px solid ${cfg.bg}`, fontFamily: `'${cfg.font}',sans-serif` }}>
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
    );
  };

  /* Cart mini panel */
  const CartPanel = () => (
    <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: 300, background: cfg.bg, borderRadius: 16, boxShadow: `0 20px 60px rgba(0,0,0,0.35)`, border: `1.5px solid ${cfg.border}`, overflow: "hidden", zIndex: 300, animation: "ddFade 0.15s ease" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${cfg.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: 13, color: cfg.text }}>Cart · {cfg.cartCount} items</span>
        <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: cfg.secondaryText, cursor: "pointer", fontSize: 18 }}>×</button>
      </div>
      {[["Wireless Headphones", "$89.00", "1"], ["Canvas Sneakers", "$65.00", "2"]].map(([name, price, qty], i) => (
        <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 12, borderBottom: `1px solid ${cfg.border}` }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: cfg.hoverBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: cfg.text, fontFamily: `'${cfg.font}',sans-serif` }}>{name}</div>
            <div style={{ fontSize: 11, color: cfg.secondaryText, marginTop: 2, fontFamily: `'${cfg.font}',sans-serif` }}>Qty: {qty}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.accent, fontFamily: `'${cfg.font}',sans-serif`, alignSelf: "flex-start", marginTop: 2 }}>{price}</span>
        </div>
      ))}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: `'${cfg.font}',sans-serif` }}>
          <span style={{ color: cfg.secondaryText }}>Total</span>
          <span style={{ fontWeight: 800, color: cfg.text }}>$219.00</span>
        </div>
        <button style={{ width: "100%", padding: "11px", borderRadius: 10, background: cfg.accent, color: "#fff", border: "none", cursor: "pointer", fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: 13, boxShadow: `0 4px 14px ${cfg.accent}55` }}>
          Checkout →
        </button>
      </div>
    </div>
  );

  /* Notif panel */
  const NotifPanel = () => (
    <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: 300, background: cfg.bg, borderRadius: 16, boxShadow: `0 20px 60px rgba(0,0,0,0.35)`, border: `1.5px solid ${cfg.border}`, overflow: "hidden", zIndex: 300, animation: "ddFade 0.15s ease" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${cfg.border}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: 13, color: cfg.text }}>Notifications</span>
        <button style={{ background: "none", border: "none", color: cfg.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: `'${cfg.font}',sans-serif` }}>Mark all read</button>
      </div>
      {[
        ["New order placed — #4821", "2 min ago", true],
        ["Your promo code expires soon", "1 hr ago", true],
        ["Shipment delivered successfully", "Yesterday", false],
      ].map(([msg, time, unread], i) => (
        <div key={i} style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: `1px solid ${cfg.border}`, background: unread ? cfg.hoverBg : "transparent" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: unread ? cfg.accent : "transparent", flexShrink: 0, marginTop: 4 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: unread ? 700 : 400, color: cfg.text, fontFamily: `'${cfg.font}',sans-serif`, lineHeight: 1.4 }}>{msg}</div>
            <div style={{ fontSize: 10, color: cfg.secondaryText, marginTop: 2, fontFamily: `'${cfg.font}',sans-serif` }}>{time}</div>
          </div>
        </div>
      ))}
    </div>
  );

  /* User panel */
  const UserPanel = () => (
    <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: 200, background: cfg.bg, borderRadius: 14, boxShadow: `0 16px 48px rgba(0,0,0,0.3)`, border: `1.5px solid ${cfg.border}`, overflow: "hidden", zIndex: 300, animation: "ddFade 0.15s ease" }}>
      <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: 13, color: cfg.text }}>Jane Doe</div>
        <div style={{ fontSize: 11, color: cfg.secondaryText, fontFamily: `'${cfg.font}',sans-serif`, marginTop: 2 }}>jane@example.com</div>
      </div>
      {["Profile", "Orders", "Wishlist", "Settings", "—", "Sign Out"].map((item, i) => (
        item === "—"
          ? <div key={i} style={{ height: 1, background: cfg.border, margin: "4px 0" }} />
          : <DropItem key={i} label={item} cfg={cfg} danger={item === "Sign Out"} />
      ))}
    </div>
  );

  /* Search overlay */
  const SearchBar = () => (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 300, padding: "0 24px", animation: "ddFade 0.15s ease" }}>
      <div style={{ background: cfg.bg, borderRadius: 14, border: `1.5px solid ${cfg.accent}`, boxShadow: cfg.shadow, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: 50 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth={2} strokeLinecap="round">
          <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
        </svg>
        <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search products, pages, help…"
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: `'${cfg.font}',sans-serif`, fontSize: 14, color: cfg.text }} />
        <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
          style={{ background: "none", border: "none", color: cfg.secondaryText, cursor: "pointer", fontSize: 20 }}>×</button>
      </div>
      {searchQuery && (
        <div style={{ marginTop: 8, background: cfg.bg, borderRadius: 14, border: `1.5px solid ${cfg.border}`, overflow: "hidden" }}>
          {["Products matching", "Help articles", "Pages"].map((cat, ci) => (
            <div key={ci}>
              <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: cfg.secondaryText, fontFamily: `'${cfg.font}',sans-serif`, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cat}</div>
              {[1,2].map(j => (
                <div key={j} style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = cfg.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={cfg.secondaryText} strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/></svg>
                  <span style={{ fontSize: 12, fontFamily: `'${cfg.font}',sans-serif`, color: cfg.text }}>Result for "<strong style={{ color: cfg.accent }}>{searchQuery}</strong>" #{j}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── Alignment logic ── */
  const isSpread      = cfg.alignment === "spread";
  const isCenterLogo  = cfg.alignment === "center-logo";
  const isLinksLeft   = cfg.alignment === "links-left";
  const isLinksRight  = cfg.alignment === "links-right";

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        @keyframes ddFade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <nav style={navStyle}>
        <div style={inner}>

          {/* ── MOBILE: hamburger ── */}
          {isMobile ? (
            <>
              <button onClick={() => setMobileMenuOpen(o => !o)}
                style={{ background: "none", border: "none", color: cfg.secondaryText, cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  {mobileMenuOpen ? <><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></> : <><line x1={3} y1={6} x2={21} y2={6}/><line x1={3} y1={12} x2={21} y2={12}/><line x1={3} y1={18} x2={21} y2={18}/></>}
                </svg>
              </button>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}><Logo /></div>
              <div style={{ display: "flex", gap: 4 }}>
                {cfg.showSearch && <IconBtn title="Search" onClick={() => setSearchOpen(o => !o)}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/></svg></IconBtn>}
                {cfg.showCart && <IconBtn badge={cfg.cartCount} title="Cart" onClick={() => setCartOpen(o => !o)}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1={3} y1={6} x2={21} y2={6}/><path d="M16 10a4 4 0 01-8 0"/></svg></IconBtn>}
              </div>
            </>
          ) : (

            /* ── DESKTOP layouts ── */
            <>
              {/* Logo */}
              {(!isCenterLogo) && <div style={{ flexShrink: 0 }}><Logo /></div>}

              {/* Links-left: logo | links | gap | actions */}
              {isLinksLeft && (
                <>
                  {cfg.showDividers && <div style={{ width: 1, height: 22, background: cfg.border, flexShrink: 0 }} />}
                  <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {cfg.links.map(link => <LinkEl key={link.id} link={link} />)}
                  </nav>
                  <div style={{ flex: 1 }} />
                </>
              )}

              {/* Spread: logo | flex-1 | links centered | flex-1 | actions */}
              {isSpread && (
                <>
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 2 }}>
                    {cfg.links.map(link => <LinkEl key={link.id} link={link} />)}
                  </div>
                </>
              )}

              {/* Center-logo: links | logo | links */}
              {isCenterLogo && (
                <>
                  <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {cfg.links.slice(0, Math.ceil(cfg.links.length / 2)).map(link => <LinkEl key={link.id} link={link} />)}
                  </nav>
                  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}><Logo /></div>
                  <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {cfg.links.slice(Math.ceil(cfg.links.length / 2)).map(link => <LinkEl key={link.id} link={link} />)}
                  </nav>
                </>
              )}

              {/* Links-right: logo | flex | links | actions */}
              {isLinksRight && (
                <>
                  <div style={{ flex: 1 }} />
                  <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {cfg.links.map(link => <LinkEl key={link.id} link={link} />)}
                  </nav>
                  {cfg.showDividers && <div style={{ width: 1, height: 22, background: cfg.border, flexShrink: 0 }} />}
                </>
              )}

              {/* ── Right action strip ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {cfg.showSearch && (
                  <IconBtn title="Search" onClick={() => setSearchOpen(o => !o)}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/></svg>
                  </IconBtn>
                )}

                {cfg.showNotif && cfg.showDividers && <div style={{ width: 1, height: 20, background: cfg.border }} />}

                {cfg.showNotif && (
                  <div style={{ position: "relative" }}>
                    <IconBtn badge={cfg.notifCount} title="Notifications" onClick={() => { setNotifOpen(o => !o); setCartOpen(false); setUserOpen(false); }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    </IconBtn>
                    {notifOpen && <NotifPanel />}
                  </div>
                )}

                {cfg.showCart && (
                  <div style={{ position: "relative" }}>
                    <IconBtn badge={cfg.cartCount} title="Cart" onClick={() => { setCartOpen(o => !o); setNotifOpen(false); setUserOpen(false); }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1={3} y1={6} x2={21} y2={6}/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    </IconBtn>
                    {cartOpen && <CartPanel />}
                  </div>
                )}

                {cfg.showTheme && (
                  <IconBtn title="Toggle theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      {theme === "dark" ? <><circle cx={12} cy={12} r={5}/><line x1={12} y1={1} x2={12} y2={3}/><line x1={12} y1={21} x2={12} y2={23}/><line x1={4.22} y1={4.22} x2={5.64} y2={5.64}/><line x1={18.36} y1={18.36} x2={19.78} y2={19.78}/><line x1={1} y1={12} x2={3} y2={12}/><line x1={21} y1={12} x2={23} y2={12}/><line x1={4.22} y1={19.78} x2={5.64} y2={18.36}/><line x1={18.36} y1={5.64} x2={19.78} y2={4.22}/></> : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>}
                    </svg>
                  </IconBtn>
                )}

                {cfg.showDividers && (cfg.showUser || cfg.showCTA) && <div style={{ width: 1, height: 20, background: cfg.border }} />}

                {cfg.showUser && (
                  <div style={{ position: "relative" }}>
                    <button onClick={() => { setUserOpen(o => !o); setCartOpen(false); setNotifOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px", borderRadius: 10, border: `1px solid ${userOpen ? cfg.accent + "66" : "transparent"}`, background: userOpen ? cfg.hoverBg : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${cfg.accent}, ${shiftHue(cfg.accent, 50)})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: `'${cfg.font}',sans-serif` }}>J</span>
                      </div>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={cfg.secondaryText} strokeWidth={2.5} strokeLinecap="round" style={{ transform: userOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {userOpen && <UserPanel />}
                  </div>
                )}

                {cfg.showCTA && (
                  <button style={{ padding: "8px 18px", borderRadius: 10, background: cfg.accent, color: "#fff", border: "none", fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: cfg.fontSize - 1, cursor: "pointer", boxShadow: `0 4px 14px ${cfg.accent}55`, whiteSpace: "nowrap", transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    {cfg.ctaLabel}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Search dropdown */}
        {searchOpen && <SearchBar />}
      </nav>

      {/* Mobile slide menu */}
      {isMobile && mobileMenuOpen && (
        <div style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, animation: "ddFade 0.2s ease" }}>
          {cfg.links.map(link => (
            <div key={link.id} onClick={() => { setActiveLink(link.id); setMobileMenuOpen(false); }}
              style={{ padding: "13px 24px", borderBottom: `1px solid ${cfg.border}`, fontFamily: `'${cfg.font}',sans-serif`, fontWeight: activeLink === link.id ? 700 : 500, fontSize: cfg.fontSize, color: activeLink === link.id ? cfg.accent : cfg.text, cursor: "pointer" }}>
              {link.label}
            </div>
          ))}
          <div style={{ padding: "12px 24px 16px", display: "flex", gap: 10 }}>
            {cfg.showUser && <button style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${cfg.border}`, background: "transparent", color: cfg.text, fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Sign In</button>}
            {cfg.showCTA && <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: cfg.accent, color: "#fff", border: "none", fontFamily: `'${cfg.font}',sans-serif`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{cfg.ctaLabel}</button>}
          </div>
        </div>
      )}

      {/* Cart panel (mobile) */}
      {isMobile && cartOpen && (
        <div style={{ position: "relative", zIndex: 300 }}><CartPanel /></div>
      )}
    </div>
  );
}

function DropItem({ label, cfg, danger = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "10px 16px", background: hov ? cfg.hoverBg : "transparent", cursor: "pointer", fontFamily: `'${cfg.font}',sans-serif`, fontSize: 12, fontWeight: hov ? 600 : 400, color: danger ? "#ef4444" : hov ? cfg.accent : cfg.text, transition: "all 0.12s" }}>
      {label}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CUSTOMIZATION PANEL
   ══════════════════════════════════════════════════════════════════════════════ */
function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: "1px solid #1e293b" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.5} strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, minWidth: 90 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{children}</div>
    </div>
  );
}

function PillPicker({ options, value, onChange, accent = "#6366f1" }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {options.map(o => (
        <button key={o.value ?? o} onClick={() => onChange(o.value ?? o)}
          style={{ padding: "4px 10px", borderRadius: 7, border: `1.5px solid ${value === (o.value ?? o) ? accent : "#1e293b"}`, background: value === (o.value ?? o) ? accent + "22" : "transparent", color: value === (o.value ?? o) ? accent : "#64748b", fontSize: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: value === (o.value ?? o) ? 700 : 400, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
          {o.label ?? o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange, accent = "#6366f1" }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 99, background: value ? accent : "#1e293b", border: `1.5px solid ${value ? accent : "#334155"}`, cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 1, left: value ? 17 : 1, width: 14, height: 14, borderRadius: "50%", background: value ? "#fff" : "#475569", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function Slider({ min, max, step = 1, value, onChange, accent = "#6366f1" }) {
  return (
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
      style={{ width: "100%", accentColor: accent, cursor: "pointer" }} />
  );
}

function ColorSwatch({ value, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: value, border: "2px solid #334155", overflow: "hidden", position: "relative" }}>
        <input type="color" value={value.startsWith("rgba") ? "#6366f1" : value} onChange={e => onChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "200%", height: "200%", top: -4, left: -4 }} />
      </div>
      <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'Space Mono',monospace" }}>{value.startsWith("rgba") ? "auto" : value}</span>
    </label>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════════════════════════════ */
export default function NavbarDesigner() {
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [panelOpen, setPanelOpen] = useState(true);
  const [preview, setPreview] = useState("desktop"); // desktop | tablet | mobile

  const set = (key, val) => setCfg(c => ({ ...c, [key]: val }));

  /* Apply preset */
  const applyPreset = (name) => {
    const p = PRESETS[name];
    if (!p) return;
    setCfg(c => ({ ...c, preset: name, ...p }));
  };

  /* Link management */
  const addLink = () => {
    set("links", [...cfg.links, { id: uid(), label: "New Link", active: false, dropdown: false }]);
  };
  const removeLink = (id) => {
    if (cfg.links.length <= 1) return;
    set("links", cfg.links.filter(l => l.id !== id));
  };
  const updateLink = (id, patch) => {
    set("links", cfg.links.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const previewW = { desktop: "100%", tablet: 768, mobile: 375 }[preview];
  const isMobile = preview === "mobile";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        input[type=range] { height: 4px; border-radius: 4px; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#060b18", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>

        {/* ── CUSTOMIZATION PANEL ── */}
        {panelOpen && (
          <div style={{ width: 280, background: "#0d1526", borderRight: "1px solid #1e293b", overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>

            {/* Panel header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a101f", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </div>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>Navbar Designer</span>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>‹</button>
            </div>

            {/* ── PRESETS ── */}
            <Section title="Color Presets">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(PRESETS).map(([name, p]) => (
                  <button key={name} onClick={() => applyPreset(name)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, border: `1.5px solid ${cfg.preset === name ? p.accent : "#1e293b"}`, background: cfg.preset === name ? p.accent + "18" : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[p.bg, p.accent, p.secondaryText].map((c, i) => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: cfg.preset === name ? 700 : 400, color: cfg.preset === name ? p.accent : "#94a3b8" }}>{name}</span>
                    {cfg.preset === name && <span style={{ marginLeft: "auto", fontSize: 9, color: p.accent, fontWeight: 700 }}>✓ Active</span>}
                  </button>
                ))}
              </div>
            </Section>

            {/* ── COLORS ── */}
            <Section title="Colors">
              <Row label="Background"><ColorSwatch value={cfg.bg}          onChange={v => set("bg", v)} /></Row>
              <Row label="Text">      <ColorSwatch value={cfg.text}        onChange={v => set("text", v)} /></Row>
              <Row label="Accent">    <ColorSwatch value={cfg.accent}      onChange={v => set("accent", v)} /></Row>
              <Row label="Subtext">   <ColorSwatch value={cfg.secondaryText} onChange={v => set("secondaryText", v)} /></Row>
            </Section>

            {/* ── STYLE ── */}
            <Section title="Navbar Style">
              <Row label="Style">
                <PillPicker accent={cfg.accent} value={cfg.style} onChange={v => set("style", v)}
                  options={["solid","glass","transparent","bordered","gradient"]} />
              </Row>
              <Row label="Position">
                <PillPicker accent={cfg.accent} value={cfg.position} onChange={v => set("position", v)}
                  options={["sticky","fixed","static","floating"]} />
              </Row>
              <Row label="Alignment">
                <PillPicker accent={cfg.accent} value={cfg.alignment} onChange={v => set("alignment", v)}
                  options={[
                    { label: "Spread",   value: "spread" },
                    { label: "CtrLogo",  value: "center-logo" },
                    { label: "L-Links",  value: "links-left" },
                    { label: "R-Links",  value: "links-right" },
                  ]} />
              </Row>
              <Row label="Height">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 160 }}>
                  <Slider min={44} max={90} value={cfg.height} accent={cfg.accent} onChange={v => set("height", v)} />
                  <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.height}px</span>
                </div>
              </Row>
              <Row label="Pill radius">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 160 }}>
                  <Slider min={0} max={40} value={cfg.borderRadius} accent={cfg.accent} onChange={v => set("borderRadius", v)} />
                  <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.borderRadius}px</span>
                </div>
              </Row>
              <Row label="Max width">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 160 }}>
                  <Slider min={600} max={1600} step={40} value={cfg.maxWidth} accent={cfg.accent} onChange={v => set("maxWidth", v)} />
                  <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.maxWidth}px</span>
                </div>
              </Row>
              <Row label="Padding X">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 160 }}>
                  <Slider min={8} max={80} value={cfg.paddingX} accent={cfg.accent} onChange={v => set("paddingX", v)} />
                  <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.paddingX}px</span>
                </div>
              </Row>
              <Row label="Dividers"><Toggle value={cfg.showDividers} accent={cfg.accent} onChange={v => set("showDividers", v)} /></Row>
            </Section>

            {/* ── TYPOGRAPHY ── */}
            <Section title="Typography">
              <Row label="Font">
                <select value={cfg.font} onChange={e => set("font", e.target.value)}
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 11, padding: "5px 8px", fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                  {Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Row>
              <Row label="Size">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 140 }}>
                  <Slider min={10} max={18} value={cfg.fontSize} accent={cfg.accent} onChange={v => set("fontSize", v)} />
                  <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.fontSize}px</span>
                </div>
              </Row>
              <Row label="Weight">
                <PillPicker accent={cfg.accent} value={cfg.fontWeight} onChange={v => set("fontWeight", v)}
                  options={[{label:"400",value:"400"},{label:"500",value:"500"},{label:"600",value:"600"},{label:"700",value:"700"}]} />
              </Row>
              <Row label="Link style">
                <PillPicker accent={cfg.accent} value={cfg.linkStyle} onChange={v => set("linkStyle", v)}
                  options={["none","solid","dot","pill","fade"]} />
              </Row>
            </Section>

            {/* ── LOGO ── */}
            <Section title="Logo">
              <Row label="Text">
                <input value={cfg.logoText} onChange={e => set("logoText", e.target.value)}
                  style={{ width: 110, background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 11, padding: "5px 8px", fontFamily: "'DM Sans',sans-serif" }} />
              </Row>
              <Row label="Style">
                <PillPicker accent={cfg.accent} value={cfg.logoStyle} onChange={v => set("logoStyle", v)}
                  options={[
                    { label: "Box",     value: "gradient-box" },
                    { label: "Text",    value: "text-only" },
                    { label: "Dot",     value: "dot-prefix" },
                    { label: "Bracket", value: "bracket" },
                  ]} />
              </Row>
            </Section>

            {/* ── NAV LINKS ── */}
            <Section title="Nav Links">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cfg.links.map((link, i) => (
                  <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#0a101f", borderRadius: 8, border: "1px solid #1e293b" }}>
                    <input value={link.label} onChange={e => updateLink(link.id, { label: e.target.value })}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 11, fontFamily: "'DM Sans',sans-serif", minWidth: 0 }} />
                    <label title="Dropdown" style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                      <span style={{ fontSize: 9, color: "#475569" }}>▾</span>
                      <input type="checkbox" checked={link.dropdown} onChange={e => updateLink(link.id, { dropdown: e.target.checked })} style={{ accentColor: cfg.accent, cursor: "pointer" }} />
                    </label>
                    <button onClick={() => removeLink(link.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <button onClick={addLink}
                  style={{ padding: "7px", borderRadius: 8, border: `1.5px dashed ${cfg.accent}55`, background: "transparent", color: cfg.accent, fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: "pointer" }}>
                  + Add link
                </button>
              </div>
            </Section>

            {/* ── COMPONENTS ── */}
            <Section title="Components">
              <Row label="Search">    <Toggle value={cfg.showSearch} accent={cfg.accent} onChange={v => set("showSearch", v)} /></Row>
              <Row label="Cart">      <Toggle value={cfg.showCart}   accent={cfg.accent} onChange={v => set("showCart", v)} /></Row>
              {cfg.showCart && (
                <Row label="Cart qty">
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 140 }}>
                    <Slider min={0} max={20} value={cfg.cartCount} accent={cfg.accent} onChange={v => set("cartCount", v)} />
                    <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.cartCount} items</span>
                  </div>
                </Row>
              )}
              <Row label="Notifs">    <Toggle value={cfg.showNotif}  accent={cfg.accent} onChange={v => set("showNotif", v)} /></Row>
              {cfg.showNotif && (
                <Row label="Notif qty">
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: 140 }}>
                    <Slider min={0} max={20} value={cfg.notifCount} accent={cfg.accent} onChange={v => set("notifCount", v)} />
                    <span style={{ fontSize: 10, color: "#475569", textAlign: "right" }}>{cfg.notifCount}</span>
                  </div>
                </Row>
              )}
              <Row label="Theme btn"> <Toggle value={cfg.showTheme}  accent={cfg.accent} onChange={v => set("showTheme", v)} /></Row>
              <Row label="User menu"> <Toggle value={cfg.showUser}   accent={cfg.accent} onChange={v => set("showUser", v)} /></Row>
              <Row label="CTA btn">   <Toggle value={cfg.showCTA}    accent={cfg.accent} onChange={v => set("showCTA", v)} /></Row>
              {cfg.showCTA && (
                <Row label="CTA label">
                  <input value={cfg.ctaLabel} onChange={e => set("ctaLabel", e.target.value)}
                    style={{ width: 110, background: "#1e293b", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 11, padding: "5px 8px", fontFamily: "'DM Sans',sans-serif" }} />
                </Row>
              )}
            </Section>

          </div>
        )}

        {/* ── PREVIEW AREA ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ height: 48, background: "#0d1526", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 }}>
            {!panelOpen && (
              <button onClick={() => setPanelOpen(true)} style={{ width: 32, height: 32, borderRadius: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            )}
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview</span>

            {/* Device switcher */}
            <div style={{ display: "flex", gap: 4, marginLeft: 12, background: "#0a101f", borderRadius: 9, padding: 3 }}>
              {[
                { id: "desktop", icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> },
                { id: "tablet",  icon: <><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></> },
                { id: "mobile",  icon: <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></> },
              ].map(d => (
                <button key={d.id} onClick={() => setPreview(d.id)}
                  style={{ width: 32, height: 30, borderRadius: 7, border: "none", background: preview === d.id ? "#1e293b" : "transparent", color: preview === d.id ? cfg.accent : "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">{d.icon}</svg>
                </button>
              ))}
            </div>

            <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155", fontFamily: "'Space Mono',monospace" }}>
              {preview} · {typeof previewW === "number" ? `${previewW}px` : "fluid"}
            </span>
          </div>

          {/* Preview canvas */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: `repeating-linear-gradient(45deg, #060b18, #060b18 10px, #07101f 10px, #07101f 20px)`, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px" }}>
            <div style={{
              width: typeof previewW === "number" ? previewW : "100%",
              maxWidth: "100%",
              background: "#f1f5f9",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "width 0.3s ease",
            }}>
              {/* Navbar */}
              <LiveNavbar cfg={cfg} isMobile={isMobile || preview === "tablet"} />

              {/* Fake page content */}
              <div style={{ padding: "40px 32px", background: "#f8fafc", minHeight: 400 }}>
                <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ height: 14, background: "#e2e8f0", borderRadius: 8, width: "60%" }} />
                  <div style={{ height: 10, background: "#e2e8f0", borderRadius: 8, width: "90%" }} />
                  <div style={{ height: 10, background: "#e2e8f0", borderRadius: 8, width: "75%" }} />
                  <div style={{ height: 10, background: "#e2e8f0", borderRadius: 8, width: "82%" }} />
                  <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: 120, background: "#e2e8f0", borderRadius: 10 }} />
                    ))}
                  </div>
                  <div style={{ height: 10, background: "#e2e8f0", borderRadius: 8, width: "50%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Color helpers ── */
function hexToRgba(hex, alpha) {
  try {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return hex; }
}

function shiftHue(hex, deg) {
  try {
    let r = parseInt(hex.slice(1,3),16)/255;
    let g = parseInt(hex.slice(3,5),16)/255;
    let b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max===min) { h=s=0; } else {
      const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
      if(max===r) h=((g-b)/d+(g<b?6:0))/6;
      else if(max===g) h=((b-r)/d+2)/6;
      else h=((r-g)/d+4)/6;
    }
    h=(h*360+deg)%360/360;
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<0.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
    r=Math.round(hue2rgb(p,q,h+1/3)*255);
    g=Math.round(hue2rgb(p,q,h)*255);
    b=Math.round(hue2rgb(p,q,h-1/3)*255);
    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  } catch { return hex; }
}
