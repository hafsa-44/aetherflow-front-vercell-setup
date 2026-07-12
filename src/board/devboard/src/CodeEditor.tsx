//update logic

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor, IKeyboardEvent } from 'monaco-editor';
import { defineMonacoThemes } from './monacoThemes';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FileItem {
  id: string;
  name: string;
  content: string;
  dirty: boolean;
  /** Id of the user who created this file — stamped once, at creation time. */
  ownerId?: string;
  /** Display name of the creator, cached so the sidebar doesn't need a members lookup to render. */
  ownerName?: string;
  /**
   * Ids of members (beyond the owner/manager/owner) who've been explicitly granted
   * edit access to this specific file. Owner and manager can always edit everything
   * regardless of this list — this is only relevant for plain 'member' role users.
   */
  editableBy?: string[];
}

interface CodeEditorProps {
  /** Files loaded from the board's persisted phase data (may arrive after mount). */
  initialFiles?: FileItem[];
  /** Called (debounced) whenever the file list changes, so the parent can persist it. */
  onFilesChange?: (files: FileItem[]) => void;
  /** Theme loaded from the board's persisted phase data (may arrive after mount). */
  initialTheme?: Theme;
  /** Called whenever the user toggles the theme, so the parent can persist it. */
  onThemeChange?: (theme: Theme) => void;
  /** Id of the person currently using the editor — stamped onto files they create. */
  currentUserId?: string;
  /** Display name of the person currently using the editor — stamped onto files they create. */
  currentUserName?: string;
  /** This project's role for the current user — drives what they're allowed to edit. */
  currentUserRole?: 'owner' | 'manager' | 'member';
  /** Full member list (for the "Manage Access" picker owner/manager use to grant edit rights). */
  members?: { id: string; name: string }[];
}

export type Theme = 'my-dark' | 'my-light';
type RunLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'OK' | 'OUT' | 'STDERR';
interface RunLog { level: RunLogLevel; msg: string; time: string; }

// ─── Judge0 language map ──────────────────────────────────────────────────────
const EXT_J0: Record<string, number> = {
  py: 71, js: 63, ts: 74, java: 62, cpp: 54, c: 50, cs: 51,
  go: 60, rs: 73, rb: 72, php: 68, swift: 83, kt: 78, r: 80,
  scala: 81, sql: 82, sh: 46, lua: 64, hs: 61, ex: 57,
  erl: 58, clj: 86, fs: 87, pl: 85, pas: 67, d: 56, vb: 84,
  groovy: 88, lisp: 55, f90: 59, m: 79, bas: 47, asm: 45,
  cob: 77, txt: 43,
};
const WEB_EXTS = ['html', 'css', 'svg'];

const EXT_MONACO: Record<string, string> = {
  py: 'python', js: 'javascript', ts: 'typescript', java: 'java',
  cpp: 'cpp', c: 'c', cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby',
  php: 'php', swift: 'swift', kt: 'kotlin', r: 'r', scala: 'scala',
  sql: 'sql', sh: 'shell', lua: 'lua', html: 'html', css: 'css',
  json: 'json', md: 'markdown', xml: 'xml', yaml: 'yaml',
  jsx: 'javascript', tsx: 'typescript', fs: 'fsharp', clj: 'clojure',
  pl: 'perl', pas: 'pascal', vb: 'vb',
};

const LANG_ICONS: Record<string, string> = {
  python: '🐍', javascript: '⚡', typescript: '🔷', css: '🎨', html: '🌐',
  json: '🔣', java: '☕', cpp: '⚙️', c: '⚙️', rust: '🦀', go: '🔵',
  ruby: '💎', php: '🐘', swift: '🍎', kotlin: '🟣', r: '📊',
  sql: '🗄️', shell: '🖥️', lua: '🌙', scala: '⛵', markdown: '📝',
};

const STARTER: Record<string, string> = {
  py: `# Python\nname = "World"\nprint(f"Hello, {name}!")\nfor i in range(1, 6):\n    print(f"  Line {i}")\n`,
  js: `// JavaScript\nconst greet = name => \`Hello, \${name}!\`;\nconsole.log(greet("World"));\n[1,2,3].forEach(n => console.log("  Item:", n));\n`,
  ts: `// TypeScript\nconst greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet("World"));\n`,
  html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8"/>\n  <title>Preview</title>\n  <style>\n    body { font-family: sans-serif; background: #0e0f14; color: #c8cad6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }\n    h1 { color: #7c3aed; }\n  </style>\n</head>\n<body>\n  <div>\n    <h1>Hello from AetherFlow!</h1>\n    <p>Edit this HTML and click ▶ Run to preview.</p>\n  </div>\n</body>\n</html>\n`,
  css: `/* CSS Preview */\nbody {\n  font-family: sans-serif;\n  background: #0e0f14;\n  color: #c8cad6;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}\n\nh1 { color: #7c3aed; }\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    for(int i = 1; i <= 5; i++)\n        cout << "  Line " << i << endl;\n    return 0;\n}\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        for (int i = 1; i <= 5; i++)\n            System.out.println("  Line " + i);\n    }\n}\n`,
  go: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n    for i := 1; i <= 5; i++ {\n        fmt.Printf("  Line %d\\n", i)\n    }\n}\n`,
  rs: `fn main() {\n    println!("Hello, World!");\n    for i in 1..=5 {\n        println!("  Line {}", i);\n    }\n}\n`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const getExt = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const getMonacoLang = (name: string) => EXT_MONACO[getExt(name)] ?? 'plaintext';
const getIcon = (name: string) => LANG_ICONS[getMonacoLang(name)] ?? '📄';
const getJ0Id = (name: string) => EXT_J0[getExt(name)] ?? 43;
const isWebFile = (name: string) => WEB_EXTS.includes(getExt(name));
const b64e = (s: string) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s: string) => { try { return decodeURIComponent(escape(atob(s))); } catch { return s ?? ''; } };
const nowStr = () => new Date().toTimeString().slice(0, 8);
const JUDGE0 = 'https://ce.judge0.com';

// ─── Component ────────────────────────────────────────────────────────────────
const SYNC_DEBOUNCE_MS = 1000; // wait for a pause in typing before pushing to the board

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialFiles = [], onFilesChange, initialTheme = 'my-dark', onThemeChange,
  currentUserId, currentUserName, currentUserRole = 'member', members = [],
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Files — seeded from the board's saved data, then owned locally for responsiveness
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [activeId, setActiveId] = useState<string | null>(initialFiles[0]?.id ?? null);

  // initialFiles arrives asynchronously (board loads after mount), and keeps
  // changing afterwards as collaborators create/delete/rename files. We used
  // to hydrate exactly once and then ignore all later prop updates — which
  // meant a delete/rename made by another tab (or another user) never reached
  // an editor that had already hydrated, and the next time THIS editor pushed
  // its own (stale) file list upward, it silently resurrected whatever the
  // other side had removed. Instead: hydrate on first load, then reconcile
  // on every subsequent prop change too, skipping only when the incoming
  // array is literally the echo of the batch we ourselves just pushed out —
  // that's what protects an in-flight, not-yet-synced keystroke from being
  // clobbered by our own round-trip.
  const hydratedRef   = useRef(initialFiles.length > 0);
  const lastPushedRef = useRef<string>('');

  // openTabIds tracks which files currently have an open tab — this is purely
  // local UI state (never synced to the backend). `files` is the real,
  // persisted list. Closing a tab must NEVER delete from `files`.
  const [openTabIds, setOpenTabIds] = useState<string[]>(
    initialFiles[0] ? [initialFiles[0].id] : []
  );

  useEffect(() => {
    if (!hydratedRef.current) {
      if (initialFiles.length > 0) {
        setFiles(initialFiles);
        setActiveId(initialFiles[0].id);
        hydratedRef.current = true;
        lastPushedRef.current = JSON.stringify(initialFiles);
      }
      return;
    }

    const incoming = JSON.stringify(initialFiles);
    if (incoming === lastPushedRef.current) return; // our own echo — ignore

    // Adopt the remote file list (so deletes/creates/renames show up), but
    // keep any local file that's mid-edit (dirty) so we don't drop keystrokes.
    setFiles(prev => initialFiles.map(remote => {
      const local = prev.find(f => f.id === remote.id);
      return local?.dirty ? local : remote;
    }));

    // Drop tabs/active-file pointers for files that no longer exist remotely.
    setOpenTabIds(prev => prev.filter(id => initialFiles.some(f => f.id === id)));
    setActiveId(prev => (prev && initialFiles.some(f => f.id === prev)) ? prev : (initialFiles[0]?.id ?? null));
  }, [initialFiles]);

  // Push local file changes upward, debounced so we don't spam the socket/DB per keystroke
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!onFilesChange) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      lastPushedRef.current = JSON.stringify(files);
      onFilesChange(files);
    }, SYNC_DEBOUNCE_MS);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [files, onFilesChange]);

  // New-file input
  const [showNewInput, setShowNewInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  // Rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Theme — seeded from the board's saved data, then owned locally
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // initialTheme arrives asynchronously (board loads after mount) — hydrate exactly once
  const themeHydratedRef = useRef(initialTheme !== 'my-dark'); // if it's already non-default, treat as hydrated
  useEffect(() => {
    if (themeHydratedRef.current) return;
    if (initialTheme && initialTheme !== 'my-dark') {
      setTheme(initialTheme);
    }
    themeHydratedRef.current = true;
  }, [initialTheme]);

  // Push theme changes upward immediately (it's a rare, single click — no debounce needed)
  const firstThemeRenderRef = useRef(true);
  useEffect(() => {
    if (firstThemeRenderRef.current) { firstThemeRenderRef.current = false; return; }
    onThemeChange?.(theme);
  }, [theme, onThemeChange]);

  // Run / output
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [running, setRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);

  // Preview (HTML/CSS)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Register themes once monaco is ready
  useEffect(() => {
    if (monaco) defineMonacoThemes();
  }, [monaco]);

  // Apply theme whenever it changes
  useEffect(() => {
    if (monaco) monaco.editor.setTheme(theme);
  }, [monaco, theme]);

  // Scroll output to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Close ctx menu on outside click
  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // Focus new-file input when shown
  useEffect(() => {
    if (showNewInput) newInputRef.current?.focus();
  }, [showNewInput]);

  // Focus rename input
  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  // ── File operations ────────────────────────────────────────────────────────
  const activeFile = files.find(f => f.id === activeId) ?? null;
  const openTabs = openTabIds
    .map(id => files.find(f => f.id === id))
    .filter((f): f is FileItem => f !== undefined);

  // ── Group files by the user who created them (folder-per-owner in the sidebar) ──
  // Falls back to an "Unassigned" bucket for files persisted before ownerId existed.
  const fileGroups = React.useMemo(() => {
    const groups = new Map<string, { ownerId: string; ownerName: string; files: FileItem[] }>();
    for (const f of files) {
      const key = f.ownerId ?? 'unassigned';
      const label = f.ownerId ? (f.ownerName ?? 'Unknown') : 'Unassigned';
      if (!groups.has(key)) groups.set(key, { ownerId: key, ownerName: label, files: [] });
      groups.get(key)!.files.push(f);
    }
    return [...groups.values()].sort((a, b) => {
      if (a.ownerId === currentUserId) return -1;   // "You" always first
      if (b.ownerId === currentUserId) return 1;
      if (a.ownerId === 'unassigned') return 1;      // Unassigned always last
      if (b.ownerId === 'unassigned') return -1;
      return a.ownerName.localeCompare(b.ownerName);
    });
  }, [files, currentUserId]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (ownerId: string) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    next.has(ownerId) ? next.delete(ownerId) : next.add(ownerId);
    return next;
  });

  // ── Permissions ──────────────────────────────────────────────────────────
  // Rule: owner and manager can always edit any file, and are the only ones
  // who can grant edit access to others ("wire" the file). A plain 'member'
  // can only edit a file they created themselves, or one they've been
  // explicitly granted access to via editableBy. Everyone can still open/view
  // any file, and everyone can create their own new files regardless of role.
  const canManageAccess = currentUserRole === 'owner' || currentUserRole === 'manager';
  const canEditFile = useCallback((f: FileItem) => {
  if (currentUserRole === 'owner' || currentUserRole === 'manager') return true;
  if (f.ownerId && String(f.ownerId) === String(currentUserId)) return true;
  return (f.editableBy ?? []).includes(String(currentUserId ?? ''));
}, [currentUserRole, currentUserId]);
  
  const [accessPanel, setAccessPanel] = useState<{ id: string; x: number; y: number } | null>(null);
  const toggleFileAccess = useCallback((fileId: string, memberId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const current = f.editableBy ?? [];
      const next = current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId];
      return { ...f, editableBy: next };
    }));
  }, []);

  const createFile = useCallback(() => {
    const name = newFileName.trim();
    if (!name || !name.includes('.')) { alert('Enter a valid filename with extension (e.g. main.py)'); return; }
    if (files.some(f => f.name === name)) { alert('A file with that name already exists.'); return; }
    const ext = getExt(name);
    const content = STARTER[ext] ?? `// ${name}\n`;
    const f: FileItem = {
  id: uid(), name, content, dirty: false,
  ownerId: String(currentUserId), ownerName: currentUserName ?? 'Unknown',
};
    
    setFiles(prev => [...prev, f]);
    setOpenTabIds(prev => prev.includes(f.id) ? prev : [...prev, f.id]);
    setActiveId(f.id);
    setNewFileName('');
    setShowNewInput(false);
  }, [newFileName, files, currentUserId, currentUserName]);

  const openFile = useCallback((id: string) => {
    setOpenTabIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveId(id);
    setShowPreview(false);
  }, []);

  // Closes the TAB only — the file itself stays in `files` and stays persisted.
  const closeFile = useCallback((id: string) => {
    setOpenTabIds(prev => {
      const idx = prev.indexOf(id);
      const next = prev.filter(tabId => tabId !== id);
      if (activeId === id) {
        const nextId = next[idx] ?? next[idx - 1] ?? null;
        setActiveId(nextId);
      }
      return next;
    });
  }, [activeId]);

  const updateContent = useCallback((value: string | undefined) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== activeId) return f;
      if (!canEditFile(f)) return f; // defense-in-depth — editor is also set readOnly for this case
      return { ...f, content: value ?? '', dirty: true };
    }));
  }, [activeId, canEditFile]);

  const saveFile = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, dirty: false } : f));
    appendLog({ level: 'INFO', msg: `Saved ${files.find(f => f.id === id)?.name ?? ''}` });
    setShowOutput(true);
  }, [files]);

  const renameFile = useCallback((id: string, newName: string) => {
    newName = newName.trim();
    if (!newName.includes('.')) { alert('Include extension'); return; }
    if (files.some(f => f.id !== id && f.name === newName)) { alert('Name already taken'); return; }
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    setRenamingId(null);
  }, [files]);

  const duplicateFile = useCallback((id: string) => {
    const src = files.find(f => f.id === id);
    if (!src) return;
    const ext = getExt(src.name);
    const base = src.name.slice(0, src.name.lastIndexOf('.'));
    let nn = `${base}_copy.${ext}`, i = 1;
    while (files.some(f => f.name === nn)) nn = `${base}_copy${++i}.${ext}`;
    const nf: FileItem = {
      id: uid(), name: nn, content: src.content, dirty: false,
      ownerId: currentUserId, ownerName: currentUserName ?? 'Unknown',
    };
    setFiles(prev => [...prev, nf]);
    setOpenTabIds(prev => [...prev, nf.id]);
    setActiveId(nf.id);
  }, [files, currentUserId, currentUserName]);

  // Permanently removes the file from the persisted list (and closes its tab).
  const deleteFile = useCallback((id: string) => {
    const f = files.find(f => f.id === id);
    if (!confirm(`Delete "${f?.name}"? This cannot be undone.`)) return;
    setFiles(prev => prev.filter(file => file.id !== id));
    closeFile(id);
  }, [files, closeFile]);

  // ── Logging ───────────────────────────────────────────────────────────────
  const appendLog = (log: Omit<RunLog, 'time'>) => {
    setLogs(prev => [...prev, { ...log, time: nowStr() }]);
  };

  // ── Run ───────────────────────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (!activeFile) return;
    if (running) return;

    const code = editorRef.current?.getValue() ?? activeFile.content;

    // HTML / CSS / SVG → preview panel
    if (isWebFile(activeFile.name)) {
      let src = code;
      if (getExt(activeFile.name) === 'css') {
        src = `<!DOCTYPE html><html><head><style>${code}</style></head><body><div style="font-family:sans-serif;padding:20px;color:#333"><h1>CSS Preview</h1><p>This is a paragraph.</p><a href="#">A link</a></div></body></html>`;
      }
      setPreviewSrc(src);
      setShowPreview(true);
      return;
    }

    const langId = getJ0Id(activeFile.name);
    if (langId === 43) {
      appendLog({ level: 'WARN', msg: 'No executable runtime for this file type. Use .py, .js, .cpp, .java, .go, .rs etc.' });
      setShowOutput(true);
      return;
    }

    const ctrl = new AbortController();
    setAbortCtrl(ctrl);
    setRunning(true);
    setLogs([]);
    setShowOutput(true);

    appendLog({ level: 'INFO', msg: `▶ Running ${activeFile.name} via Judge0 CE…` });

    try {
      const res = await fetch(`${JUDGE0}/submissions?base64_encoded=true&wait=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ source_code: b64e(code), language_id: langId, base64_encoded: true }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Submit failed: HTTP ${res.status}`);
      const { token } = await res.json();
      appendLog({ level: 'INFO', msg: `Token: ${token} · polling…` });

      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 1200));
        if (ctrl.signal.aborted) throw new Error('__CANCELLED__');
        const poll = await fetch(
          `${JUDGE0}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,message,time,memory,exit_code`,
          { headers: { Accept: 'application/json' }, signal: ctrl.signal }
        );
        if (!poll.ok) throw new Error(`Poll failed: HTTP ${poll.status}`);
        const result = await poll.json();
        const sid = result.status?.id;
        if (sid === undefined || sid > 2) {
          // done
          const stdout = b64d(result.stdout ?? '');
          const stderr = b64d(result.stderr ?? '');
          const compile = b64d(result.compile_output ?? '');
          const msg = b64d(result.message ?? '');
          if (compile.trim()) {
            appendLog({ level: 'STDERR', msg: '── Compile Output ──' });
            compile.split('\n').filter(Boolean).forEach(l => appendLog({ level: 'STDERR', msg: l }));
          }
          if (stdout.trim()) {
            appendLog({ level: 'OUT', msg: '── stdout ──' });
            stdout.split('\n').forEach(l => appendLog({ level: 'OUT', msg: l }));
          }
          if (stderr.trim()) {
            appendLog({ level: 'STDERR', msg: '── stderr ──' });
            stderr.split('\n').filter(Boolean).forEach(l => appendLog({ level: 'STDERR', msg: l }));
          }
          if (msg.trim()) appendLog({ level: 'WARN', msg });
          const ok = sid === 3;
          appendLog({
            level: ok ? 'OK' : 'ERROR',
            msg: `${ok ? '✓' : '✗'} ${result.status?.description} · time: ${result.time ?? '—'}s · mem: ${result.memory ? Math.round(result.memory / 1024) + 'KB' : '—'}`,
          });
          break;
        }
        appendLog({ level: 'INFO', msg: `[${i + 1}] ${result.status?.description}…` });
      }
    } catch (e: any) {
      if (e.message === '__CANCELLED__' || e.name === 'AbortError') {
        appendLog({ level: 'WARN', msg: 'Execution cancelled.' });
      } else {
        appendLog({ level: 'ERROR', msg: 'Error: ' + e.message });
      }
    } finally {
      setRunning(false);
      setAbortCtrl(null);
    }
  }, [activeFile, running]);

  // ── Keyboard shortcut Ctrl+Enter = run, Ctrl+S = save ──────────────────
  const handleEditorKeyDown = useCallback((e: IKeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      e.preventDefault();
      if (activeId) saveFile(activeId);
    }
  }, [runCode, activeId, saveFile]);

  // ── Log badge colours ──────────────────────────────────────────────────
  const logBadge: Record<RunLogLevel, { bg: string; color: string }> = {
    INFO: { bg: '#162b4a', color: '#60a5fa' },
    OK: { bg: '#052e16', color: '#4ade80' },
    WARN: { bg: '#431407', color: '#fb923c' },
    ERROR: { bg: '#450a0a', color: '#f87171' },
    OUT: { bg: '#1e1b4b', color: '#a78bfa' },
    STDERR: { bg: '#3b0764', color: '#e879f9' },
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isDark = theme === 'my-dark';
  const bg = isDark ? '#0d1117' : '#ffffff';
  const sideBg = isDark ? '#161b22' : '#f3f4f8';
  const borderC = isDark ? '#21262d' : '#e0e0e8';
  const textC = isDark ? '#e6edf3' : '#1e2040';
  const textMuted = isDark ? '#484f58' : '#888aaa';
  const activeBg = isDark ? '#1c2128' : '#e8eaf6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: bg, overflow: 'hidden', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── File sidebar + editor row ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── File Sidebar ── */}
        <div style={{ width: 200, minWidth: 200, background: sideBg, borderRight: `1px solid ${borderC}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

          {/* Sidebar header */}
          <div style={{ padding: '8px 10px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${borderC}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>Files</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                title="New file"
                onClick={() => { setShowNewInput(true); setCtxMenu(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 16, padding: '0 2px', lineHeight: 1 }}
              >＋</button>
              {/* Theme toggle */}
              <button
                title="Toggle theme"
                onClick={() => setTheme(t => t === 'my-dark' ? 'my-light' : 'my-dark')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
              >{isDark ? '🌙' : '☀️'}</button>
            </div>
          </div>

          {/* New file input */}
          {showNewInput && (
            <div style={{ padding: '5px 8px', display: 'flex', gap: 4, borderBottom: `1px solid ${borderC}`, flexShrink: 0 }}>
              <input
                ref={newInputRef}
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') createFile();
                  if (e.key === 'Escape') { setShowNewInput(false); setNewFileName(''); }
                }}
                placeholder="main.py"
                spellCheck={false}
                style={{ flex: 1, background: isDark ? '#0e0f14' : '#fff', border: '1px solid #4f8ef7', borderRadius: 4, padding: '3px 7px', color: textC, fontSize: 11, fontFamily: 'monospace', outline: 'none' }}
              />
              <button onClick={createFile} style={{ background: '#4f8ef7', border: 'none', borderRadius: 6, color: '#fff', padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✓</button>
            </div>
          )}

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {files.length === 0 && (
              <div style={{ padding: '20px 12px', color: textMuted, fontSize: 11, textAlign: 'center' }}>No files yet.<br />Click ＋ to create one.</div>
            )}
            {fileGroups.map(group => {
              const isYou = group.ownerId === currentUserId;
              const isCollapsed = collapsedGroups.has(group.ownerId);
              return (
                <div key={group.ownerId} style={{ marginBottom: 2 }}>
                  {/* Owner group header — folder-per-person */}
                  <div
                    onClick={() => toggleGroup(group.ownerId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    <span style={{ fontSize: 9, color: textMuted, transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.1s', flexShrink: 0 }}>▾</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: isYou ? '#3de0a0' : textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {isYou ? 'You' : group.ownerName}
                    </span>
                    <span style={{ fontSize: 9, color: textMuted, flexShrink: 0 }}>({group.files.length})</span>
                  </div>

                  {!isCollapsed && group.files.map(f => (
                    <div key={f.id}>
                      {renamingId === f.id ? (
                        <div style={{ padding: '3px 8px 3px 22px', display: 'flex', gap: 4 }}>
                          <input
                            ref={renameRef}
                            value={renameVal}
                            onChange={e => setRenameVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') renameFile(f.id, renameVal);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onBlur={() => renameFile(f.id, renameVal)}
                            spellCheck={false}
                            style={{ flex: 1, background: isDark ? '#0e0f14' : '#fff', border: '1px solid #4f8ef7', borderRadius: 4, padding: '2px 6px', color: textC, fontSize: 11, fontFamily: 'monospace', outline: 'none' }}
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => openFile(f.id)}
                          onContextMenu={e => { e.preventDefault(); setCtxMenu({ id: f.id, x: e.clientX, y: e.clientY }); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px 4px 22px', cursor: 'pointer', fontSize: 12,
                            fontFamily: 'monospace', color: f.id === activeId ? textC : textMuted,
                            background: f.id === activeId ? activeBg : 'transparent',
                            borderLeft: f.id === activeId ? '2px solid #4f8ef7' : '2px solid transparent',
                            transition: 'background 0.1s',
                          }}
                        >
                          <span style={{ fontSize: 13, flexShrink: 0 }}>{getIcon(f.name)}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{f.name}</span>
                          {!canEditFile(f) && (
                            <span title="You have view-only access — ask the owner or a manager to grant edit access" style={{ fontSize: 11, flexShrink: 0, opacity: 0.7 }}>🔒</span>
                          )}
                          {f.dirty && <span style={{ color: '#7c3aed', fontSize: 14, flexShrink: 0 }}>●</span>}
                          {canManageAccess && (
                            <button
                              title="Manage who can edit this file"
                              onClick={e => { e.stopPropagation(); setAccessPanel({ id: f.id, x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().bottom }); }}
                              style={{ opacity: 0, background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 12, padding: '0 2px', borderRadius: 3, transition: 'opacity 0.1s' }}
                              className="fi-menu-btn"
                            >🔑</button>
                          )}
                          <button
                            title="Options"
                            onClick={e => { e.stopPropagation(); setCtxMenu({ id: f.id, x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().bottom }); }}
                            style={{ opacity: 0, background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 13, padding: '0 2px', borderRadius: 3, transition: 'opacity 0.1s' }}
                            className="fi-menu-btn"
                          >⋯</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Editor + tabs ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', background: isDark ? '#161b22' : '#f3f4f8', borderBottom: `1px solid ${borderC}`, overflowX: 'auto', flexShrink: 0, height: 34 }}>
            {openTabs.map(f => (
              <div
                key={f.id}
                onClick={() => openFile(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 34,
                  cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', flexShrink: 0,
                  color: f.id === activeId ? textC : textMuted,
                  background: f.id === activeId ? bg : 'transparent',
                  borderBottom: f.id === activeId ? '2px solid #4f8ef7' : '2px solid transparent',
                  borderRight: `1px solid ${borderC}`, transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 12 }}>{getIcon(f.name)}</span>
                <span>{f.name}</span>
                {f.dirty && <span style={{ color: '#7c3aed', fontSize: 13 }}>●</span>}
                <button
                  onClick={e => { e.stopPropagation(); closeFile(f.id); }}
                  title="Close tab"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 12, padding: '0 2px', borderRadius: 3, lineHeight: 1, marginLeft: 2 }}
                >✕</button>
              </div>
            ))}

            {/* Toolbar actions at right of tabs */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', flexShrink: 0 }}>
              {activeFile && isWebFile(activeFile.name) && (
                <button
                  onClick={() => { const code = editorRef.current?.getValue() ?? activeFile.content; let src = code; if (getExt(activeFile.name) === 'css') src = `<!DOCTYPE html><html><head><style>${code}</style></head><body style="font-family:sans-serif;padding:20px"><h1>CSS Preview</h1><p>A paragraph.</p></body></html>`; setPreviewSrc(src); setShowPreview(true); }}
                  title="Open Preview"
                  style={{ background: '#1a1c27', border: '1px solid #4f8ef7', borderRadius: 4, color: '#7c3aed', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
                >⧉ Preview</button>
              )}
              <button
                disabled={running || !activeFile}
                onClick={runCode}
                title="Run (Ctrl+Enter)"
                style={{ background: running ? '#1c2128' : 'linear-gradient(135deg, #1f6feb, #4f8ef7)', border: running ? '1px solid #30363d' : 'none', borderRadius: 8, color: running ? '#4f8ef7' : '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', cursor: running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {running ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(61,224,160,.3)', borderTopColor: '#3de0a0', borderRadius: '50%', animation: 'spin .6s linear infinite' }} /> Running</> : '▶ Run'}
              </button>
              {running && (
                <button
                  onClick={() => { abortCtrl?.abort(); }}
                  style={{ background: '#f43f5e', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}
                >■ Stop</button>
              )}
            </div>
          </div>

          {/* Read-only banner for members without edit access */}
          {activeFile && !canEditFile(activeFile) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              background: isDark ? 'rgba(245,197,66,0.08)' : 'rgba(245,197,66,0.15)',
              borderBottom: `1px solid ${borderC}`, fontSize: 11, color: '#f5c542', flexShrink: 0,
            }}>
              🔒 View only — ask {activeFile.ownerName ?? 'the owner'} or a manager to grant you edit access.
            </div>
          )}

          {/* Monaco editor */}
          {activeFile ? (
            <Editor
              height="100%"
              theme={theme}
              language={getMonacoLang(activeFile.name)}
              value={activeFile.content}
              onChange={updateContent}
              onMount={(ed) => {
                editorRef.current = ed;
                ed.onKeyDown(handleEditorKeyDown);
              }}
              options={{
                fontSize: 13,
                fontFamily: "'Cascadia Code', 'Fira Code', ui-monospace, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 10 },
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                readOnly: !canEditFile(activeFile),
              }}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: textMuted, gap: 12, background: bg }}>
              <div style={{ fontSize: 48, opacity: 0.2 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No file open</div>
              <div style={{ fontSize: 12 }}>Click ＋ in the sidebar to create a file</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ background: isDark ? '#1a1c27' : '#e8eaf6', border: `1px solid ${borderC}`, borderRadius: 4, padding: '3px 10px', fontSize: 11, fontFamily: 'monospace', color: textMuted }}>＋ New File</span>
                <span style={{ background: isDark ? '#1a1c27' : '#e8eaf6', border: `1px solid ${borderC}`, borderRadius: 4, padding: '3px 10px', fontSize: 11, fontFamily: 'monospace', color: textMuted }}>Ctrl+S to save</span>
                <span style={{ background: isDark ? '#1a1c27' : '#e8eaf6', border: `1px solid ${borderC}`, borderRadius: 4, padding: '3px 10px', fontSize: 11, fontFamily: 'monospace', color: textMuted }}>Ctrl+Enter to run</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Output panel ── */}
      {showOutput && (
        <div style={{ background: isDark ? '#0d1117' : '#f8f9fe', borderTop: `1px solid ${borderC}`, height: 200, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 30, borderBottom: `1px solid ${borderC}`, gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: '0.08em' }}>OUTPUT</span>
            <button onClick={() => setLogs([])} style={{ background: 'none', border: `1px solid ${borderC}`, borderRadius: 4, color: textMuted, fontSize: 10, padding: '1px 7px', cursor: 'pointer' }}>Clear</button>
            <button onClick={() => setShowOutput(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 13 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', fontFamily: "'Cascadia Code', 'Fira Code', monospace", fontSize: 12, lineHeight: 1.8 }}>
            {logs.length === 0 && !running && (
              <div style={{ color: textMuted, fontSize: 12 }}>Press ▶ Run or Ctrl+Enter to execute the active file.</div>
            )}
            {logs.map((log, i) => {
              const badge = logBadge[log.level] ?? logBadge.INFO;
              return (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: textMuted, fontSize: 10, flexShrink: 0, paddingTop: 3, minWidth: 58 }}>{log.time}</span>
                  <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, fontWeight: 700, flexShrink: 0, marginTop: 3, background: badge.bg, color: badge.color, letterSpacing: '0.04em' }}>{log.level}</span>
                  <span style={{ color: textC, flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{log.msg}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* ── Preview modal (HTML/CSS) ── */}
      {showPreview && previewSrc !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPreview(false)}>
          <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', background: '#13141c', borderBottom: '1px solid #1e2030', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c8cad6', letterSpacing: '0.06em' }}>⧉ PREVIEW — {activeFile?.name}</span>
              <button
                onClick={() => { const code = editorRef.current?.getValue() ?? activeFile?.content ?? ''; let src = code; if (activeFile && getExt(activeFile.name) === 'css') src = `<!DOCTYPE html><html><head><style>${code}</style></head><body style="font-family:sans-serif;padding:20px"><h1>CSS Preview</h1><p>A paragraph.</p></body></html>`; setPreviewSrc(src); }}
                style={{ background: '#22c55e', border: 'none', borderRadius: 4, color: '#000', fontSize: 11, fontWeight: 700, padding: '2px 10px', cursor: 'pointer', marginLeft: 4 }}
              >↻ Refresh</button>
              <button onClick={() => setShowPreview(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#555870', fontSize: 16 }}>✕</button>
            </div>
            <iframe
              srcDoc={previewSrc}
              sandbox="allow-scripts allow-same-origin"
              style={{ flex: 1, border: 'none' }}
              title="Preview"
            />
          </div>
        </div>
      )}

      {/* ── Context menu ── */}
      {ctxMenu && (() => {
        const ctxFile = files.find(f => f.id === ctxMenu.id);
        const editable = ctxFile ? canEditFile(ctxFile) : false;
        const items = [
          ...(editable ? [{ label: '✏️ Rename', action: () => { setRenameVal(ctxFile?.name ?? ''); setRenamingId(ctxMenu.id); setCtxMenu(null); } }] : []),
          { label: '📋 Duplicate', action: () => { duplicateFile(ctxMenu.id); setCtxMenu(null); } }, // always allowed — creates your own copy
          ...(editable ? [{ label: '💾 Save', action: () => { saveFile(ctxMenu.id); setCtxMenu(null); } }] : []),
          ...(editable ? [{ label: '🗑 Delete', action: () => { setCtxMenu(null); deleteFile(ctxMenu.id); }, red: true }] : []),
        ];
        return (
          <div
            style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, background: isDark ? '#1a1c27' : '#fff', border: `1px solid ${borderC}`, borderRadius: 8, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 9998, minWidth: 140 }}
            onClick={e => e.stopPropagation()}
          >
            {items.map(item => (
              <div
                key={item.label}
                onClick={item.action}
                style={{ padding: '6px 13px', fontSize: 11, cursor: 'pointer', borderRadius: 5, color: item.red ? '#f87171' : textC, fontFamily: "'Segoe UI', system-ui", fontWeight: 500, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = item.red ? '#450a0a40' : isDark ? '#252738' : '#f0f0ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >{item.label}</div>
            ))}
          </div>
        );
      })()}

      {/* ── Manage Access popover — owner/manager only, grants specific members edit rights to a file ── */}
      {accessPanel && (() => {
        const f = files.find(x => x.id === accessPanel.id);
        if (!f) return null;
        const grantable = members.filter(m => m.id !== f.ownerId); // owner already always has access
        return (
          <div
            style={{ position: 'fixed', left: accessPanel.x, top: accessPanel.y, background: isDark ? '#1a1c27' : '#fff', border: `1px solid ${borderC}`, borderRadius: 8, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 9998, minWidth: 190 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Edit access — {f.name}
            </div>
            {grantable.length === 0 && (
              <div style={{ fontSize: 11, color: textMuted, padding: '4px 2px' }}>No other members on this project yet.</div>
            )}
            {grantable.map(m => {
              const checked = (f.editableBy ?? []).includes(m.id);
              return (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 2px', fontSize: 12, color: textC, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleFileAccess(f.id, m.id)} />
                  {m.name}
                </label>
              );
            })}
            <div style={{ fontSize: 10, color: textMuted, marginTop: 6, lineHeight: 1.4 }}>
              Owner &amp; managers can always edit every file — this only grants access to plain members.
            </div>
          </div>
        );
      })()}

      {/* Click-away closer for the access panel */}
      {accessPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setAccessPanel(null)} />
      )}

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .fi-menu-btn { opacity: 0 !important; }
        div:hover > .fi-menu-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default CodeEditor;