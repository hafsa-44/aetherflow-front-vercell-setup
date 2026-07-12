import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";

//import api, { getAccessToken } from "../../../../../api";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "/api";
import api, { getAccessToken } from "../../../../../api";
// ── Public types (imported by canvas.tsx) ────────────────────────────────────

export interface DraggableAIElement {
  type: "ai_element";
  elementType: "mindmap" | "diagram" | "text" | "list" | "heading";
  content: unknown;
  rawText: string;
  structure: {
    title?: string;
    nodes?: Array<{ id: string; label: string; children?: string[] }>;
    connections?: Array<{ from: string; to: string }>;
    hierarchy?: Array<{ level: number; text: string; type: "heading" | "bullet" | "text" }>;
  };
}

export interface AIDropEvent extends CustomEvent {
  detail: {
    element: DraggableAIElement;
    dropX: number;
    dropY: number;
  };
}

// ── Internal types ────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isEditing?: boolean;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  profilePicture: string | null;
  role: "owner" | "manager" | "member";
  joinedAt: string;
}

interface DisplayMember {
  name: string;
  userId: string;
  color: string;
  online: boolean;
  role: string;
  lastUpdate: string;
 // status: string;
  profilePicture: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner: "#F5C518",
  manager: "#3949AB",
  member: "#00897B",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Project Owner",
  manager: "Project Manager",
  member: "Member",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Project Owner": ["Full Access", "Delete Project", "Manage Members", "Export"],
  "Project Manager": ["Edit Canvas", "Manage Members", "View All", "Export"],
  Member: ["Edit Canvas", "Add Comments", "View All"],
};

// AI_DISPLAY_NAME is purely cosmetic — shown in the panel header.
// No provider keys here — they live on the server.
const AI_DISPLAY_NAME = (import.meta.env.VITE_AI_SITE_NAME as string) || "AetherFlow";

// ── AI response parser ────────────────────────────────────────────────────────

function parseAIResponse(text: string): DraggableAIElement {
  // Check for Mermaid diagrams
  const mermaidMatch = text.match(/```(?:mermaid)?\s*((?:flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram)[\s\S]*?)```/i);
  if (mermaidMatch) {
    const mermaidCode = mermaidMatch[1].trim();
    const isMindmap = /mindmap/i.test(mermaidCode);
    const nodes: Array<{ id: string; label: string; children?: string[] }> = [];
    const connections: Array<{ from: string; to: string }> = [];

    // Parse simple flowchart nodes
    const nodeRegex = /([A-Za-z0-9_]+)\[([^\]]+)\]|([A-Za-z0-9_]+)\(([^)]+)\)|([A-Za-z0-9_]+)\{([^}]+)\}/g;
    let nodeMatch: RegExpExecArray | null;
    while ((nodeMatch = nodeRegex.exec(mermaidCode)) !== null) {
      const id = nodeMatch[1] || nodeMatch[3] || nodeMatch[5];
      const label = nodeMatch[2] || nodeMatch[4] || nodeMatch[6];
      if (id && label && !nodes.find((n) => n.id === id)) {
        nodes.push({ id, label });
      }
    }

    // Parse connections
    // FIX: the id can be immediately followed by a [label]/(label)/{label} before
    // the arrow (e.g. "A[App Launch] --> B[...]") — the old regex required the
    // arrow to follow the id with only whitespace in between, so it silently
    // matched zero connections on real AI output and every drop lost its lines.
    const connRegex = /([A-Za-z0-9_]+)(?:\s*\[[^\]]*\]|\s*\([^)]*\)|\s*\{[^}]*\})?\s*--?>+\s*([A-Za-z0-9_]+)/g;
    let connMatch: RegExpExecArray | null;
    while ((connMatch = connRegex.exec(mermaidCode)) !== null) {
      connections.push({ from: connMatch[1], to: connMatch[2] });
    }

    return {
      type: "ai_element",
      elementType: isMindmap ? "mindmap" : "diagram",
      content: mermaidCode,
      rawText: text,
      structure: {
        title: isMindmap ? "Mind Map" : "Flowchart",
        nodes,
        connections,
      },
    };
  }

  // Check for hierarchical markdown
  const lines = text.split("\n").filter((l) => l.trim());
  const hasHeadings = lines.some((l) => /^#{1,6}\s/.test(l));
  const hasBullets = lines.some((l) => /^[-*+]\s/.test(l));

  if (hasHeadings || hasBullets) {
    const hierarchy: Array<{ level: number; text: string; type: "heading" | "bullet" | "text" }> = [];
    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        hierarchy.push({ level: headingMatch[1].length, text: headingMatch[2].trim(), type: "heading" });
        continue;
      }
      const bulletMatch = line.match(/^[-*+]\s+(.+)/);
      if (bulletMatch) {
        hierarchy.push({ level: 0, text: bulletMatch[1].trim(), type: "bullet" });
        continue;
      }
      if (line.trim()) {
        hierarchy.push({ level: 0, text: line.trim(), type: "text" });
      }
    }

    const firstHeading = hierarchy.find((h) => h.type === "heading");
    return {
      type: "ai_element",
      elementType: hasHeadings ? "heading" : "list",
      content: hierarchy,
      rawText: text,
      structure: {
        title: firstHeading?.text ?? "Content",
        hierarchy,
      },
    };
  }

  // Plain text
  return {
    type: "ai_element",
    elementType: "text",
    content: text,
    rawText: text,
    structure: { title: text.slice(0, 40) + (text.length > 40 ? "…" : "") },
  };
}

// ── Inline CSS animations ─────────────────────────────────────────────────────

const STYLE_TAG_ID = "aether-chat-styles";

function injectStyles() {
  if (document.getElementById(STYLE_TAG_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = `
    @keyframes aether-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }
    @keyframes aether-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes aether-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .aether-msg { animation: aether-fade-in 0.2s ease both; }
    .aether-action-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      color: rgba(255,255,255,0.6);
      font-size: 11px;
      padding: 3px 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
      font-family: inherit;
      white-space: nowrap;
    }
    .aether-action-btn:hover {
      background: rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.9);
      border-color: rgba(255,255,255,0.22);
    }
    .aether-drag-badge {
      background: linear-gradient(135deg, rgba(79,70,229,0.25), rgba(124,58,237,0.25));
      border: 1px solid rgba(124,58,237,0.4);
      border-radius: 6px;
      color: #a78bfa;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      cursor: grab;
      display: flex;
      align-items: center;
      gap: 4px;
      user-select: none;
      letter-spacing: 0.3px;
      transition: all 0.15s;
    }
    .aether-drag-badge:hover {
      background: linear-gradient(135deg, rgba(79,70,229,0.4), rgba(124,58,237,0.4));
      border-color: rgba(124,58,237,0.7);
      color: #c4b5fd;
    }
    .aether-drag-badge:active { cursor: grabbing; }
    .aether-scroll::-webkit-scrollbar { width: 4px; }
    .aether-scroll::-webkit-scrollbar-track { background: transparent; }
    .aether-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    .aether-input:focus { border-color: rgba(124,58,237,0.5) !important; }
    .aether-msg-wrap { position: relative; }
    .aether-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; opacity: 0; transition: opacity 0.15s; }
    .aether-msg-wrap:hover .aether-actions,
    .aether-msg-wrap:focus-within .aether-actions { opacity: 1; }
  `;
  document.head.appendChild(style);
}

// ── Drag preview ──────────────────────────────────────────────────────────────

function createDragPreview(text: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    background: linear-gradient(135deg, #1a1f3a, #111d3a);
    border: 1px solid rgba(124,58,237,0.5);
    border-radius: 10px;
    padding: 10px 14px;
    color: rgba(255,255,255,0.85);
    font-family: Inter, system-ui, sans-serif;
    font-size: 12px;
    max-width: 240px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    pointer-events: none;
    z-index: 99999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  el.textContent = `✦ ${text.slice(0, 50)}${text.length > 50 ? "…" : ""}`;
  document.body.appendChild(el);
  return el;
}

// ── Main component ────────────────────────────────────────────────────────────

interface ChatModuleProps {
  projectContext?: string;
  phase?: string;
}

// Shape returned by GET /aiContext/:projectId — the AI Context form filled
// in from the Planning sidebar ("AI Context" pin tool). Used here so the
// planning chat knows the project's name/description without the user
// having to repeat it every conversation.
interface AiContextData {
  projectName?: string;
  description?: string;
  projectType?: string;
  nature?: string;
  techStack?: string | string[];
  targetUser?: string;
  purpose?: string;
  knownConstraints?: string;
  keyFeatures?: string | string[];
  outOfScope?: string;
  boardSummary?: string;
}

function joinField(v?: string | string[]): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
}

// Combines the AI Context form data with the live canvas summary
// (boardContext, passed in as `projectContext`) into one string sent
// to the backend as `projectContext`.
function buildCombinedContext(ctx: AiContextData | null, canvasSummary: string): string {
  const lines: string[] = [];
  if (ctx?.projectName) lines.push(`Project: ${ctx.projectName}`);
  if (ctx?.description) lines.push(`Description: ${ctx.description}`);
  if (ctx?.projectType || ctx?.nature) lines.push(`Type: ${[ctx?.projectType, ctx?.nature].filter(Boolean).join(" / ")}`);
  if (joinField(ctx?.techStack)) lines.push(`Tech stack: ${joinField(ctx?.techStack)}`);
  if (ctx?.targetUser) lines.push(`Target user: ${ctx.targetUser}`);
  if (ctx?.purpose) lines.push(`Purpose: ${ctx.purpose}`);
  if (joinField(ctx?.keyFeatures)) lines.push(`Key features: ${joinField(ctx?.keyFeatures)}`);
  if (ctx?.outOfScope) lines.push(`Out of scope: ${ctx.outOfScope}`);
  if (ctx?.knownConstraints) lines.push(`Known constraints: ${ctx.knownConstraints}`);
  if (canvasSummary) lines.push(`Canvas state: ${canvasSummary}`);
  return lines.join(" | ");
}

// The first-message summary shown in the chat itself, so the user can see
// exactly what project context the AI currently has (name/description/etc).
function buildWelcomeMessage(ctx: AiContextData | null): string {
  const base = "The Aether is silent. What shall we manifest today?\n\nTry asking me to create a **flowchart**, **mind map**, or **project plan** — then drag it straight onto the canvas.";
  if (!ctx || (!ctx.projectName && !ctx.description)) return base;
  const parts: string[] = [`Here's what I know about **${ctx.projectName || "this project"}**:`];
  if (ctx.description) parts.push(`- ${ctx.description}`);
  if (joinField(ctx.techStack)) parts.push(`- **Tech stack:** ${joinField(ctx.techStack)}`);
  if (ctx.targetUser) parts.push(`- **Target user:** ${ctx.targetUser}`);
  if (ctx.purpose) parts.push(`- **Purpose:** ${ctx.purpose}`);
  parts.push("\n" + base);
  return parts.join("\n");
}

export default function ChatModule({ projectContext = "", phase = "planning" }: ChatModuleProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [aiContextData, setAiContextData] = useState<AiContextData | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "The Aether is silent. What shall we manifest today?\n\nTry asking me to create a **flowchart**, **mind map**, or **project plan** — then drag it straight onto the canvas.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [activeMember, setActiveMember] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Inject styles once
  useEffect(() => { injectStyles(); }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isGenerating]);

  // Fetch the project's AI Context form (name, description, tech stack…).
  // This is the same data the "AI Context" pin tool in the Planning sidebar
  // saves via POST /aiContext, and the same endpoint the Design phase reads.
  useEffect(() => {
    if (!projectId) return;
    const load = () => {
      api.get(`/aiContext/${projectId}`)
        .then((res) => setAiContextData(res.data as AiContextData))
        .catch(() => { /* context is optional — chat still works without it */ });
    };
    load();
    // Refetch immediately if the AI Context form is saved elsewhere in the app,
    // without requiring a page reload.
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.projectId === projectId) load();
    };
    window.addEventListener('aiContext:updated', onUpdated);
    return () => window.removeEventListener('aiContext:updated', onUpdated);
  }, [projectId]);

  // Once context loads, refresh the welcome message so the user can see
  // what the AI currently knows — but only if no real conversation has
  // started yet (don't clobber history loaded from the DB).
  useEffect(() => {
    if (!aiContextData) return;
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].id !== "welcome") return prev;
      return [{ ...prev[0], content: buildWelcomeMessage(aiContextData) }];
    });
  }, [aiContextData]);

  // Fetch members
  useEffect(() => {
    if (!projectId) return;
    api.get<Member[]>(`/projects/${projectId}/members`)
      .then((res) => {
        const raw: Member[] = Array.isArray(res.data) ? res.data : [];
        const display: DisplayMember[] = raw.map((m) => ({
          name: m.name,
          userId: m.userId,
          color: ROLE_COLORS[m.role] ?? "#555",
          online: true,
          role: ROLE_LABELS[m.role] ?? m.role,
          lastUpdate: new Date(m.joinedAt).toLocaleDateString(),
          status: "Active on canvas",
          profilePicture: m.profilePicture,
        }));
        setMembers(display);
      })
      .catch(() => { });
  }, [projectId]);

  // ── Chat history persistence ─────────────────────────────────────────────────
  // On mount: fetch saved messages from the DB so the conversation survives
  // page reloads and phase switches. The welcome message is shown only when
  // there are no saved messages yet.
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (!projectId || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    const token = getAccessToken();
    if (!token) return;

    fetch(`${BASE_URL}/ai/history/${projectId}?limit=60`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: { success: boolean; messages?: ChatMessage[] }) => {
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
        // If no messages returned, keep the welcome message already in state
      })
      .catch(() => { /* non-fatal — user just starts with the welcome */ });
  }, [projectId]);

  // Fire-and-forget — persists a single message after it lands in state.
  // Failures are intentionally silent: the UI already shows the message;
  // a save error doesn't need to interrupt the user.
  const persistMessage = useCallback((role: "user" | "assistant", content: string) => {
    if (!projectId) return;
    const token = getAccessToken();
    if (!token) return;
    fetch(`${BASE_URL}/ai/history/${projectId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ role, content }),
    }).catch(() => { });
  }, [projectId]);

  // ── API call ────────────────────────────────────────────────────────────────
  // Calls POST /api/ai/chat/:projectId — the server holds the Groq key,
  // verifies project membership, applies the board-aware system prompt,
  // and streams back a conversational reply via SSE.

  const callAI = useCallback(async (
    history: ChatMessage[],
    onChunk?: (text: string) => void,
  ): Promise<string> => {
    const controller = new AbortController();
    abortRef.current = controller;

    const token = getAccessToken();
    if (!token) throw new Error("Not signed in — please refresh and log in again.");
    if (!projectId) throw new Error("No project selected.");

    // Strip the welcome message — it's UI-only, not a real assistant turn
    const apiMessages = history
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch(`${BASE_URL}/ai/chat/${projectId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        messages: apiMessages,
        phase,
        projectContext: buildCombinedContext(aiContextData, projectContext),
        stream: !!onChunk,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any)?.error ?? `API error ${response.status}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return (data as any).content ?? "No response.";
    }

    // SSE streaming passthrough — Groq's stream shape: `data: {...}`
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) { full += delta; onChunk(full); }
        } catch {/* skip malformed SSE chunk */ }
      }
    }
    return full;
  }, [projectId, phase, projectContext, aiContextData]);

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (overrideHistory?: ChatMessage[]) => {
    const text = input.trim();
    if ((!text && !overrideHistory) || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const history = overrideHistory ?? [...messages, userMsg];
    if (!overrideHistory) {
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      // Persist the user message immediately — fire-and-forget
      persistMessage("user", text);
    }

    setIsGenerating(true);

    const assistantId = `ai-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    let finalContent = "";
    try {
      finalContent = await callAI(history, (partial) => {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: partial } : m)
        );
      });
      // Persist the completed assistant reply — fire-and-forget
      if (finalContent) persistMessage("assistant", finalContent);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        const msg = err instanceof Error ? err.message : "Connection failed.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: msg.includes("VITE_") ? `⚠️ ${msg}` : "⚠️ Connection failed. Check your API key and try again." }
              : m
          )
        );
      } else {
        // Aborted — remove the empty shell if nothing was streamed
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && !m.content))
        );
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [input, messages, isGenerating, callAI, persistMessage]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    stopGeneration();
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: buildWelcomeMessage(aiContextData),
      timestamp: Date.now(),
    }]);
  }, [stopGeneration, aiContextData]);

  // ── Message actions ─────────────────────────────────────────────────────────

  const copyMessage = useCallback((msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const startEdit = useCallback((msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditDraft(msg.content);
  }, []);

  const saveEdit = useCallback(async (msg: ChatMessage) => {
    if (!editDraft.trim()) return;
    const updatedMsg: ChatMessage = { ...msg, content: editDraft.trim() };

    if (msg.role === "user") {
      // Regenerate everything after this message
      const idx = messages.findIndex((m) => m.id === msg.id);
      const newHistory = [...messages.slice(0, idx), updatedMsg];
      setMessages(newHistory);
      setEditingMsgId(null);
      setEditDraft("");
      setInput("");
      await sendMessage(newHistory);
    } else {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? updatedMsg : m));
      setEditingMsgId(null);
      setEditDraft("");
    }
  }, [editDraft, messages, sendMessage]);

  const regenerateFrom = useCallback(async (msg: ChatMessage) => {
    // Find the last user message before this assistant message
    const idx = messages.findIndex((m) => m.id === msg.id);
    const history = messages.slice(0, idx).filter((m) => m.role === "user" || m.role === "assistant");
    if (!history.length) return;
    // Remove this AI message and regenerate
    const trimmed = messages.slice(0, idx);
    setMessages(trimmed);
    setInput("");
    await sendMessage(trimmed);
  }, [messages, sendMessage]);

  // ── Drag-and-drop ───────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, msg: ChatMessage) => {
    const element = parseAIResponse(msg.content);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify(element));

    const preview = createDragPreview(element.structure.title ?? msg.content);
    e.dataTransfer.setDragImage(preview, 12, 12);
    setTimeout(() => preview.remove(), 0);
  }, []);

  // Touch / keyboard fallback — fires a custom event the canvas already listens for.
  // Spawns the element at canvas centre (dropX/Y = 0 triggers the smart-spawn fallback).
  const handleTapToCanvas = useCallback((msg: ChatMessage) => {
    try {
      const element = parseAIResponse(msg.content);
      if (!element || element.type !== "ai_element") throw new Error("unrecognised");
      window.dispatchEvent(new CustomEvent("ai-element-drop", {
        detail: { element, dropX: 0, dropY: 0 },
      }));
    } catch {
      // non-fatal — user can still use drag-and-drop
    }
  }, []);

  // ── Key handler ─────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const onlineCount = useMemo(() => members.filter((m) => m.online).length, [members]);
  const activeMemberData = activeMember !== null ? members[activeMember] : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "linear-gradient(180deg, #0a0f1e 0%, #0d1426 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: "hidden",
      color: "#fff",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 18px",
        background: "linear-gradient(135deg, #0d1835 0%, #111d3a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
            flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontSize: 16 }}>✦</span>
          </div>
          <div>
            <h2 style={{
              margin: 0, color: "#ffffff", fontSize: "0.82rem",
              letterSpacing: "2.5px", textTransform: "uppercase",
              fontWeight: 800, lineHeight: 1.2,
            }}>Aether Core</h2>
            <p style={{
              margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.4)",
              letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500,
            }}>AI Canvas Assistant</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Clear button */}
          <button
            onClick={clearChat}
            aria-label="Clear chat"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.5)",
              fontSize: 10,
              padding: "4px 8px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.5px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            Clear
          </button>
          {/* Live badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(67,160,71,0.12)",
            border: "1px solid rgba(67,160,71,0.25)",
            borderRadius: 20, padding: "3px 10px",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#43A047", boxShadow: "0 0 6px rgba(67,160,71,0.9)",
              animation: "aether-pulse 2s infinite",
            }} />
            <span style={{ fontSize: 9, color: "#66BB6A", fontWeight: 600, letterSpacing: "0.5px" }}>Team M</span>
          </div>
        </div>
      </div>

      {/* ── Collaborators ── */}
      {members.length > 0 && (
        <div style={{
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#43A047", boxShadow: "0 0 5px rgba(67,160,71,0.7)" }} />
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
              {onlineCount > 0 ? `${onlineCount} Online` : `${members.length} Members`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {members.slice(0, 5).map((member, i) => (
              <div key={i} style={{ position: "relative", marginLeft: i === 0 ? 0 : "-6px", zIndex: 10 - i }}>
                <div
                  onClick={() => setActiveMember(i)}
                  title={`${member.name} — ${member.role}`}
                  aria-label={`${member.name}, ${member.role}`}
                  style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${member.color}, ${member.color}cc)`,
                    border: `2px solid ${member.role === "Project Owner" ? "#FFD700" : "rgba(255,255,255,0.3)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#fff",
                    cursor: "pointer",
                    boxShadow: member.role === "Project Owner" ? "0 0 8px rgba(255,215,0,0.8)" : "none",
                    transition: "transform 0.15s",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {member.profilePicture
                    ? <img src={member.profilePicture} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : member.name[0]?.toUpperCase()
                  }
                </div>
              </div>
            ))}
            {members.length > 5 && (
              <div style={{
                marginLeft: "-6px", zIndex: 0, width: 26, height: 26, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.6)",
              }}>+{members.length - 5}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="aether-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            isEditing={editingMsgId === msg.id}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            copiedId={copiedId}
            onCopy={() => copyMessage(msg)}
            onEdit={() => startEdit(msg)}
            onSaveEdit={() => saveEdit(msg)}
            onCancelEdit={() => { setEditingMsgId(null); setEditDraft(""); }}
            onDelete={() => deleteMessage(msg.id)}
            onRegenerate={() => regenerateFrom(msg)}
            onDragStart={(e) => handleDragStart(e, msg)}
            onTapToCanvas={() => handleTapToCanvas(msg)}
          />
        ))}

        {isGenerating && (
          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
              flexShrink: 0,
            }}>✦</div>
            <div style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px 16px 16px 3px", padding: "10px 16px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(167,139,250,0.7)",
                  animation: `aether-bounce 1.2s ease-in-out ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div style={{
        padding: "12px 16px 14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
        background: "linear-gradient(0deg, #0a0f1e 0%, transparent 100%)",
      }}>
        {isGenerating && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <button
              onClick={stopGeneration}
              aria-label="Stop generation"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                color: "#f87171",
                fontSize: 11,
                fontWeight: 600,
                padding: "5px 14px",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.3px",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <span>■</span> Stop Generation
            </button>
          </div>
        )}
        <div
          className="aether-input"
          style={{
            display: "flex", alignItems: "flex-end",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "14px", padding: "8px 8px 8px 14px",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "border-color 0.2s",
            gap: 8,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            disabled={isGenerating}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aether anything… (Enter to send, Shift+Enter for newline)"
            aria-label="Chat input"
            rows={1}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", color: "rgba(255,255,255,0.88)",
              fontSize: 13, fontFamily: "inherit", resize: "none",
              lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
              paddingTop: 2,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isGenerating || !input.trim()}
            aria-label="Send message"
            style={{
              background: isGenerating || !input.trim()
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(135deg, #4F46E5, #7C3AED)",
              color: "white", border: "none",
              borderRadius: "10px", width: 34, height: 34, minHeight: 34,
              cursor: isGenerating || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, flexShrink: 0,
              boxShadow: isGenerating || !input.trim() ? "none" : "0 2px 10px rgba(79,70,229,0.5)",
              transition: "all 0.2s",
              opacity: isGenerating || !input.trim() ? 0.5 : 1,
            }}
          >✦</button>
        </div>
        <p style={{ margin: "7px 0 0", textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.5px" }}>
          Drag AI responses onto the canvas · Powered by {AI_DISPLAY_NAME}
        </p>
      </div>

      {/* ── Member modal ── */}
      {activeMemberData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeMemberData.name} profile`}
          onClick={() => setActiveMember(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111d3a", borderRadius: 20, width: 300,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${activeMemberData.color}, ${activeMemberData.color}99)`,
              padding: "28px 20px 44px",
              position: "relative", textAlign: "center",
            }}>
              <button
                onClick={() => setActiveMember(null)}
                aria-label="Close"
                style={{
                  position: "absolute", top: 12, right: 14,
                  color: "rgba(255,255,255,0.8)", fontSize: 22,
                  cursor: "pointer", fontWeight: 700, lineHeight: 1,
                  background: "none", border: "none", padding: 0,
                }}
              >×</button>
              {activeMemberData.role === "Project Owner" && (
                <div style={{ fontSize: 24, marginBottom: 6 }}>👑</div>
              )}
              <div style={{
                width: 68, height: 68, borderRadius: "50%", margin: "0 auto 12px",
                background: "rgba(255,255,255,0.25)",
                border: activeMemberData.role === "Project Owner" ? "3px solid #FFD700" : "3px solid rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: "#fff",
                overflow: "hidden",
                boxShadow: activeMemberData.role === "Project Owner"
                  ? "0 0 20px rgba(255,215,0,0.6)" : "0 4px 16px rgba(0,0,0,0.2)",
              }}>
                {activeMemberData.profilePicture
                  ? <img src={activeMemberData.profilePicture} alt={activeMemberData.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : activeMemberData.name[0]?.toUpperCase()
                }
              </div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{activeMemberData.name}</div>
              <div style={{
                display: "inline-block", marginTop: 8,
                fontSize: 10, fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "3px 14px",
                letterSpacing: "1px", textTransform: "uppercase",
              }}>
                {activeMemberData.role}
              </div>
            </div>
            <div style={{ padding: "20px" }}>
              
              <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Role</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 2 }}>{activeMemberData.role}</div>
              </div>
              <div style={{ paddingTop: 12 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: 8 }}>Permissions</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(ROLE_PERMISSIONS[activeMemberData.role] ?? []).map((perm, pi) => (
                    <span key={pi} style={{
                      fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.65)",
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="rgba(79,200,120,0.8)" /></svg>
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setActiveMember(null)}
                style={{
                  width: "100%", marginTop: 18, padding: "11px",
                  background: `linear-gradient(135deg, ${activeMemberData.color}, ${activeMemberData.color}cc)`,
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 14px ${activeMemberData.color}44`,
                  letterSpacing: "0.5px", fontFamily: "inherit",
                }}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MessageRow sub-component ─────────────────────────────────────────────────

interface MessageRowProps {
  msg: ChatMessage;
  isEditing: boolean;
  editDraft: string;
  setEditDraft: (v: string) => void;
  copiedId: string | null;
  onCopy: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onTapToCanvas: () => void;
}

const MessageRow = React.memo(function MessageRow({
  msg, isEditing, editDraft, setEditDraft, copiedId,
  onCopy, onEdit, onSaveEdit, onCancelEdit, onDelete, onRegenerate, onDragStart, onTapToCanvas,
}: MessageRowProps) {
  const isUser = msg.role === "user";

  return (
    <div
      className="aether-msg aether-msg-wrap"
      style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "90%", display: "flex", flexDirection: "column", gap: 4 }}
    >
      {/* AI label */}
      {!isUser && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, flexShrink: 0,
          }}>✦</div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.5px" }}>AETHER</span>
        </div>
      )}

      {/* Bubble or edit area */}
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            autoFocus
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(124,58,237,0.5)",
              borderRadius: 10, padding: "10px 12px",
              color: "rgba(255,255,255,0.9)", fontSize: 13,
              fontFamily: "inherit", resize: "vertical",
              minHeight: 80, outline: "none", lineHeight: 1.55,
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={onSaveEdit}
              style={{
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                border: "none", borderRadius: 7, color: "#fff",
                fontSize: 11, fontWeight: 600, padding: "5px 12px",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >{msg.role === "user" ? "Save & Regenerate" : "Save"}</button>
            <button
              onClick={onCancelEdit}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 7, color: "rgba(255,255,255,0.6)",
                fontSize: 11, padding: "5px 12px",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >Cancel</button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: isUser ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
            background: isUser
              ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
              : "rgba(255,255,255,0.06)",
            color: isUser ? "#ffffff" : "rgba(255,255,255,0.88)",
            border: !isUser ? "1px solid rgba(255,255,255,0.08)" : "none",
            fontSize: 13, lineHeight: 1.6,
            boxShadow: isUser ? "0 4px 16px rgba(79,70,229,0.4)" : "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <FormattedContent content={msg.content} />
        </div>
      )}

      {/* Action bar — fades in on hover via CSS, always in DOM so it works on touch too */}
      {!isEditing && (
        <div
          className="aether-actions"
          style={{
            alignItems: "center",
            justifyContent: isUser ? "flex-end" : "flex-start",
          }}
        >
          {/* Copy */}
          <button className="aether-action-btn" onClick={onCopy} aria-label="Copy message">
            {copiedId === msg.id ? "✓ Copied" : "⊕ Copy"}
          </button>
          {/* Edit */}
          <button className="aether-action-btn" onClick={onEdit} aria-label="Edit message">
            ✏ Edit
          </button>
          {/* Regenerate (AI only) */}
          {!isUser && (
            <button className="aether-action-btn" onClick={onRegenerate} aria-label="Regenerate response">
              ↺ Regenerate
            </button>
          )}
          {/* Delete */}
          <button
            className="aether-action-btn"
            onClick={onDelete}
            aria-label="Delete message"
            style={{ color: "rgba(248,113,113,0.7)" }}
          >
            ✕ Delete
          </button>
          {/* Canvas actions — AI messages only */}
          {!isUser && msg.content.length > 10 && (
            <>
              {/* Drag-to-canvas — mouse/pointer devices */}
              <div
                className="aether-drag-badge"
                draggable
                onDragStart={onDragStart}
                role="button"
                aria-label="Drag to canvas"
                tabIndex={0}
              >
                ⠿ Drag to canvas
              </div>
              {/* Tap-to-place — touch / keyboard */}
              <button
                className="aether-action-btn"
                onClick={onTapToCanvas}
                aria-label="Add to canvas"
                style={{
                  background: "rgba(79,70,229,0.18)",
                  borderColor: "rgba(124,58,237,0.35)",
                  color: "#a78bfa",
                }}
              >
                ✦ Add to canvas
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// ── Formatted content ────────────────────────────────────────────────────────

// ── Formatted content ────────────────────────────────────────────────────────

// ── Diagram preview (chat panel) ─────────────────────────────────────────────
// Parses the flowchart/mindmap fence into nodes + edges and lays them out as
// rows (BFS depth from the root), so branches actually appear side-by-side
// under a shared parent — the same shape the canvas version will take.

const DIAGRAM_PALETTE = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

interface ParsedDiagram {
  labels: Record<string, string>;
  order: string[]; // first-appearance order
  edges: Array<{ from: string; to: string }>;
}

function parseDiagramLines(diagramLines: string[]): ParsedDiagram {
  const source = diagramLines.join("\n");
  const labels: Record<string, string> = {};
  const order: string[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  const nodeRegex = /([A-Za-z0-9_]+)\[([^\]]+)\]|([A-Za-z0-9_]+)\(([^)]+)\)|([A-Za-z0-9_]+)\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = nodeRegex.exec(source)) !== null) {
    const id = m[1] || m[3] || m[5];
    const label = m[2] || m[4] || m[6];
    if (id && label && !(id in labels)) {
      labels[id] = label;
      order.push(id);
    }
  }

  const edgeRegex = /([A-Za-z0-9_]+)(?:\s*\[[^\]]*\]|\s*\([^)]*\)|\s*\{[^}]*\})?\s*--?>+\s*([A-Za-z0-9_]+)/g;
  while ((m = edgeRegex.exec(source)) !== null) {
    edges.push({ from: m[1], to: m[2] });
  }

  return { labels, order, edges };
}

// Groups node ids into rows by BFS depth from root(s), so a fan-out (one
// node → several children) renders as a row of boxes under its parent.
function layoutRows(parsed: ParsedDiagram): string[][] {
  const { order, edges, labels } = parsed;
  if (order.length === 0) return [];

  const children: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  for (const id of order) inDegree[id] = 0;
  for (const { from, to } of edges) {
    if (!(from in labels)) continue;
    (children[from] ||= []).push(to);
    if (to in inDegree) inDegree[to] = (inDegree[to] ?? 0) + 1;
  }

  const roots = order.filter((id) => (inDegree[id] ?? 0) === 0);
  const startIds = roots.length > 0 ? roots : [order[0]];

  const depth: Record<string, number> = {};
  const queue: string[] = [];
  for (const id of startIds) { depth[id] = 0; queue.push(id); }

  while (queue.length) {
    const cur = queue.shift()!;
    for (const child of children[cur] ?? []) {
      if (!(child in depth)) {
        depth[child] = depth[cur] + 1;
        queue.push(child);
      }
    }
  }

  // Any node never reached by BFS (disconnected) gets appended after its
  // position in first-appearance order, at the depth of the previous node.
  let maxDepthSoFar = 0;
  const rows: string[][] = [];
  for (const id of order) {
    const d = depth[id] ?? maxDepthSoFar;
    maxDepthSoFar = Math.max(maxDepthSoFar, d);
    (rows[d] ||= []).push(id);
  }
  return rows.filter((r) => r && r.length > 0);
}

function DiagramPreview({ lines, isDiagram }: { lines: string[]; isDiagram: boolean }) {
  const parsed = useMemo(() => parseDiagramLines(lines), [lines]);
  const rows = useMemo(() => layoutRows(parsed), [parsed]);
  const rawText = useMemo(() => lines.join("\n"), [lines]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: 10,
        padding: "12px 14px 10px",
        margin: "8px 0",
      }}
    >
      <div
        style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "1px",
          textTransform: "uppercase", color: "rgba(167,139,250,0.6)",
          marginBottom: 10,
        }}
      >
        {isDiagram ? "⬡ Flowchart" : "◎ Mind Map"} · drag or tap "Add to canvas" to place
      </div>

      {rows.length === 0 ? (
        // Fallback — couldn't parse nodes, show the raw source so nothing is lost.
        <pre style={{
          margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: "#c4b5fd", whiteSpace: "pre-wrap", overflowX: "auto",
        }}>{rawText}</pre>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {rows.map((row, rowIdx) => (
            <React.Fragment key={rowIdx}>
              <div style={{
                display: "flex", flexWrap: "wrap", justifyContent: "center",
                gap: 8, width: "100%",
              }}>
                {row.map((id, colIdx) => (
                  <div
                    key={id}
                    style={{
                      background: `${DIAGRAM_PALETTE[colIdx % DIAGRAM_PALETTE.length]}26`,
                      border: `1px solid ${DIAGRAM_PALETTE[colIdx % DIAGRAM_PALETTE.length]}77`,
                      color: "rgba(255,255,255,0.92)",
                      borderRadius: 7,
                      padding: "6px 10px",
                      fontSize: 11,
                      lineHeight: 1.35,
                      textAlign: "center",
                      maxWidth: 150,
                      wordBreak: "break-word",
                    }}
                  >
                    {parsed.labels[id]}
                  </div>
                ))}
              </div>
              {rowIdx < rows.length - 1 && (
                <div style={{ color: "rgba(167,139,250,0.5)", fontSize: 12, lineHeight: 1 }}>↓</div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Flowchart / mindmap fence ─────────────────────────────────────────
    // Rendered as an actual mini node-and-arrow diagram, not raw syntax text.
    if (line.trim().startsWith("```flowchart") || line.trim().startsWith("```mindmap")) {
      const isDiagram = line.trim().startsWith("```flowchart");
      const diagramLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        diagramLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <DiagramPreview key={`diagram-${i}`} lines={diagramLines} isDiagram={isDiagram} />
      );
      continue;
    }

    // ── Generic code block ────────────────────────────────────────────────
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} style={{
          background: "rgba(0,0,0,0.35)", borderRadius: 8,
          padding: "10px 12px", margin: "8px 0",
          overflowX: "auto", fontSize: 11.5, lineHeight: 1.6,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.8)",
        }}>
          {lang && (
            <div style={{
              fontSize: 9, color: "rgba(255,255,255,0.3)",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px",
            }}>{lang}</div>
          )}
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    // ── Heading ───────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes: Record<number, number> = { 1: 17, 2: 15, 3: 14, 4: 13, 5: 12, 6: 11 };
      elements.push(
        <div key={`h-${i}`} style={{
          fontSize: sizes[level] ?? 13,
          fontWeight: 700,
          color: level === 1 ? "#c4b5fd" : level === 2 ? "#a78bfa" : "rgba(255,255,255,0.9)",
          marginTop: level <= 2 ? 10 : 6,
          marginBottom: 2,
          letterSpacing: level === 1 ? "0.3px" : undefined,
        }}>
          {inlineFormat(headingMatch[2])}
        </div>
      );
      i++;
      continue;
    }

    // ── Bullet ────────────────────────────────────────────────────────────
    const bulletMatch = line.match(/^[-*+]\s+(.*)/);
    if (bulletMatch) {
      elements.push(
        <div key={`b-${i}`} style={{ display: "flex", gap: 7, marginTop: 3 }}>
          <span style={{ color: "#7c3aed", marginTop: 1, flexShrink: 0, fontSize: 10 }}>◆</span>
          <span>{inlineFormat(bulletMatch[1])}</span>
        </div>
      );
      i++;
      continue;
    }

    // ── Numbered list ─────────────────────────────────────────────────────
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`n-${i}`} style={{ display: "flex", gap: 7, marginTop: 3 }}>
          <span style={{ color: "#a78bfa", flexShrink: 0, fontSize: 11, fontWeight: 700, minWidth: 16 }}>
            {numMatch[1]}.
          </span>
          <span>{inlineFormat(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // ── Empty line ────────────────────────────────────────────────────────
    if (!line.trim()) {
      elements.push(<div key={`e-${i}`} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // ── Plain text ────────────────────────────────────────────────────────
    elements.push(<div key={`t-${i}`}>{inlineFormat(line)}</div>);
    i++;
  }

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "rgba(255,255,255,0.98)" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "1px 5px", fontSize: "0.9em", fontFamily: "monospace", color: "#c4b5fd" }}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
//










