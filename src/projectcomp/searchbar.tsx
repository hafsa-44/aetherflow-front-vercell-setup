
// src/components/SearchBar.tsx

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface SearchResult {
  _id:         string;
  name:        string;
  description: string;
  color:       string;
  category:    string;
  phase:       string;
  role:        string;
}

interface Props {
  // When true: renders as a full-width input inside the mobile menu.
  // When false/undefined: renders desktop pill + mobile icon in the navbar bar.
  mobileMenu?: boolean;
}

const PHASE_LABEL: Record<string, string> = {
  planning:    "Planning",
  design:      "Design",
  development: "Development",
};

export default function SearchBar({ mobileMenu = false }: Props) {
  const navigate   = useNavigate();
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced search ─────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setOpen(false); return; }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/projects/search?q=${encodeURIComponent(q)}`);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: string) => {
    navigate(`/project/${id}/board`);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const clearSearch = () => { setQuery(""); setResults([]); setOpen(false); };

  // ── Results dropdown — shared by both modes ──────────────────────────────
  const dropdown = (
    <>
      {open && results.length > 0 && (
        <div
          className="absolute left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          style={{ width: 320 }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium">
              {results.length} project{results.length !== 1 ? "s" : ""} found
            </span>
          </div>
          {results.map(r => (
            <button
              key={r._id}
              onClick={() => handleSelect(r._id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: r.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {r.category} · {PHASE_LABEL[r.phase] ?? r.phase}
                </p>
              </div>
              <span className="text-xs text-gray-400 capitalize flex-shrink-0">{r.role}</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.trim() && results.length === 0 && (
        <div
          className="absolute left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 px-4 py-6 text-center"
          style={{ width: 280 }}
        >
          <p className="text-sm text-gray-400">No projects found for "{query}"</p>
        </div>
      )}
    </>
  );

  // ── Mobile menu mode — full-width input ──────────────────────────────────
  // Rendered inside the mobile nav drawer, always visible as a text field.
  if (mobileMenu) {
    return (
      <div className="relative w-full" ref={wrapperRef}>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 w-full">
          <Search size={16} style={{ color: "#E9E4DE", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder-gray-400"
            style={{ color: "#E9E4DE" }}
          />
          {query && (
            <button onClick={clearSearch} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={13} style={{ color: "#E9E4DE" }} />
            </button>
          )}
          {loading && (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
          )}
        </div>
        {dropdown}
      </div>
    );
  }

  // ── Navbar bar mode — desktop pill + mobile icon ─────────────────────────
  return (
    <div className="relative" ref={wrapperRef}>

      {/* Desktop: pill input */}
      <div className="hidden lg:flex bg-white/10 rounded-lg px-3 py-2 items-center gap-2 min-w-[180px]">
        <Search size={16} style={{ color: "#E9E4DE", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search projects..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          className="bg-transparent border-none outline-none text-sm w-32 xl:w-44 placeholder-gray-400"
          style={{ color: "#E9E4DE" }}
        />
        {query && (
          <button onClick={clearSearch} className="flex-shrink-0 opacity-60 hover:opacity-100">
            <X size={13} style={{ color: "#E9E4DE" }} />
          </button>
        )}
        {loading && (
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
        )}
      </div>

      {/* Mobile: icon button only — full search is in the mobile menu drawer */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Search"
        onClick={() => {/* mobile menu opens via the hamburger — search is inside it */}}
      >
        <Search size={18} style={{ color: "#E9E4DE" }} />
      </button>

      {dropdown}
    </div>
  );
}