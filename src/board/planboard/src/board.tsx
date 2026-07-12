import { useState, useCallback, useEffect, useRef } from "react";
import { useParams }   from "react-router-dom";
import { useAuth }     from "../../../context/AuthContext";
import api             from "../../../api";
import { useBoardSync, type BoardPhase } from "./../../../hook/useBoardSync";

import Sidebar      from "./Sidebar/sidebar";
import Canvas       from "./Canvas/canvas";
//import ChatModule   from "./Sidebar/AI/chatModule";
import AIPanel from "./Sidebar/AI/chatModule";
import LeftIconBar  from "./Sidebar/LeftIconBar";
import DesignPhase  from "../../designboard/designcomp/Designchangefile";
import MembersPanel from "../../../projectcomp/MembersPanel";   // ← NEW

import type { NoteType, ToolType, FlowNodeType, FlowEdgeType, CommentThread, TextCardType } from "./Canvas/types";
import type { ImageCard }     from "./Canvas/imgModule";
import type { CanvasElement } from "../../designboard/designcomp/ButtomBar";
import LiveCursors from "../../../board/livecursorpos";
import DevBoard from "../../devboard/src/devboard";
import type { DevFileItem, DevTheme } from "../../devboard/src/devboard";
//import AIPanel from "./Sidebar/AI/AIPanel";

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASES: BoardPhase[] = ["planning", "design", "development"];

const PHASE_META: Record<BoardPhase, { label: string; color: string }> = {
  planning:    { label: "Planning",    color: "#3b82f6" },
  design:      { label: "Design",      color: "#8b5cf6" },
  development: { label: "Development", color: "#10b981" },
};

const phaseIndex = (p: BoardPhase) => PHASES.indexOf(p);

// ─────────────────────────────────────────────────────────────────────────────
export default function Board() {
  const { isAuthReady, currentUser } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();

  const [dbPhase,      setDbPhase]      = useState<BoardPhase>("planning");
  const [viewPhase,    setViewPhase]    = useState<BoardPhase>("planning");
  const [advancing,    setAdvancing]    = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [activeTool,   setActiveTool]   = useState<ToolType | null>(null);
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [navPanelOpen, setNavPanelOpen] = useState(false);

  // ── NEW: Members panel state ─────────────────────────────────────────────
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [projectMeta,      setProjectMeta]      = useState<{
    isCollaborative: boolean;
    myRole: string;
  }>({ isCollaborative: true, myRole: "member" });

  const { phaseData, syncPatch, emitCursor, socket, error, loaded, cursors, presence, saveError ,
  typingUsers, emitCommentTyping, emitCommentStopTyping, emitCommentRead} =
    useBoardSync(projectId, viewPhase);

  // ── Fetch project phase + meta on mount ──────────────────────────────────
  useEffect(() => {
    if (!projectId || !isAuthReady) return;
    api.get(`/projects/${projectId}`)
      .then(res => {
        const p = (res.data?.phase ?? "planning") as BoardPhase;
        setDbPhase(p);
        setViewPhase(p);
        // Store collaborative flag and current user's role for Members button
        setProjectMeta({
          isCollaborative: res.data?.isCollaborative ?? true,
          myRole:          res.data?.role ?? "member",
        });
      })
      .catch(() => {});
  }, [projectId, isAuthReady]);

  // ── Socket: phase:updated from another user advancing ───────────────────
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(() => {
      const s = socket.current;
      if (!s) return;
      clearInterval(interval);
      s.on("phase:updated", ({ newPhase }: { newPhase: BoardPhase }) => {
        setDbPhase(newPhase);
        setAdvanceError(null);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [projectId, socket]);

  // ── Canvas mouse move → live cursors ────────────────────────────────────
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    emitCursor(e.clientX - rect.left, e.clientY - rect.top);
  }, [emitCursor]);

  // ── Navigate between phases ──────────────────────────────────────────────
  const handleNavigate = (target: BoardPhase) => {
    if (target === viewPhase) return;

    const targetIdx = phaseIndex(target);
    const dbIdx     = phaseIndex(dbPhase);

    if (targetIdx > dbIdx) {
      setAdvanceError(`Complete the current phase first to unlock ${PHASE_META[target].label}.`);
      return;
    }

    if (target === "development" && dbPhase === "development") {
      setAdvanceError(null);
      setViewPhase("development");
      return;
    }

    setAdvanceError(null);
    setViewPhase(target);
  };

  // ── Advance phase ────────────────────────────────────────────────────────
  const handleAdvancePhase = async () => {
    if (!projectId || advancing) return;
    setAdvancing(true);
    setAdvanceError(null);
    try {
      const res = await api.post(`/boards/${projectId}/advance`);
      const newPhase = res.data.newPhase as BoardPhase;
      setDbPhase(newPhase);
      setViewPhase(newPhase);
    } catch (err: any) {
      setAdvanceError(err?.response?.data?.message ?? "Could not advance phase.");
    } finally {
      setAdvancing(false);
    }
  };

  // ── Typed setters ────────────────────────────────────────────────────────
  const setNotes = useCallback((u: React.SetStateAction<NoteType[]>) => {
    const prev = (phaseData.notes ?? []) as NoteType[];
    syncPatch({ notes: typeof u === "function" ? u(prev) : u });
  }, [phaseData, syncPatch]);

  const setTextCards = useCallback((u: React.SetStateAction<TextCardType[]>) => {
    const prev = (phaseData.textCards ?? []) as TextCardType[];
    syncPatch({ textCards: typeof u === "function" ? u(prev) : u });
  }, [phaseData, syncPatch]);

  const setFlowNodes = useCallback((u: React.SetStateAction<FlowNodeType[]>) => {
    const prev = (phaseData.flowNodes ?? []) as FlowNodeType[];
    syncPatch({ flowNodes: typeof u === "function" ? u(prev) : u });
  }, [phaseData, syncPatch]);

  const setConnections = useCallback((u: React.SetStateAction<FlowEdgeType[]>) => {
    const prev = (phaseData.connections ?? []) as FlowEdgeType[];
    syncPatch({ connections: typeof u === "function" ? u(prev) : u });
  }, [phaseData, syncPatch]);

  const setImageCards = useCallback((u: React.SetStateAction<ImageCard[]>) => {
    const prev = (phaseData.imageCards ?? []) as ImageCard[];
    syncPatch({ imageCards: typeof u === "function" ? u(prev) : u });
  }, [phaseData, syncPatch]);

  const setCommentThreads = useCallback((u: React.SetStateAction<CommentThread[]>) => {
    const prev = (phaseData.commentThreads ?? []) as CommentThread[];
    syncPatch({ commentThreads: typeof u === "function" ? u(prev) : u });
  }, [phaseData, syncPatch]);

  const setDesignElements = useCallback(
    (elements: CanvasElement[] | React.SetStateAction<CanvasElement[]>, frames?: any[]) => {
      const prevEls      = (phaseData.designElements ?? []) as CanvasElement[];
      const resolvedEls  = typeof elements === "function" ? elements(prevEls) : elements;
      if (frames !== undefined) {
        syncPatch({ designElements: resolvedEls, designFrames: frames });
      } else {
        syncPatch({ designElements: resolvedEls });
      }
    },
    [phaseData, syncPatch]
  );

  const setDevFiles = useCallback((files: DevFileItem[]) => {
    syncPatch({ devFiles: files });
  }, [syncPatch]);

  const setDevTheme = useCallback((theme: DevTheme) => {
    syncPatch({ devTheme: [theme] });
  }, [syncPatch]);

  // MERGED from boardree.tsx: plain-text context string built from the current
  // canvas state so the AI panel knows what's already on the board without a
  // separate lookup.
  const boardContext = [
    phaseData.notes?.length ? `${(phaseData.notes as any[]).length} sticky note(s) on canvas.` : "",
    phaseData.flowNodes?.length ? `${(phaseData.flowNodes as any[]).length} flowchart node(s).` : "",
    phaseData.textCards?.length ? `${(phaseData.textCards as any[]).length} text card(s).` : "",
    phaseData.imageCards?.length ? `${(phaseData.imageCards as any[]).length} image card(s).` : "",
  ].filter(Boolean).join(" ") || "Canvas is currently empty.";

  const handleSelectTool = (tool: ToolType) => {
    setActiveTool(null);
    setTimeout(() => setActiveTool(tool), 0);
  };

  if (!isAuthReady) return <div style={{ padding: 20 }}>Loading session...</div>;
  if (!projectId)   return <div style={{ padding: 20 }}>Invalid project</div>;
  if (error)        return <div style={{ padding: 20, color: "#ef4444" }}>Failed to load board: {error}</div>;
  if (!loaded)      return <div style={{ padding: 20 }}>Loading board...</div>;

  const dbIdx      = phaseIndex(dbPhase);
  const viewIdx    = phaseIndex(viewPhase);
  const canAdvance = viewPhase === dbPhase && dbIdx < PHASES.length - 1;

  // Members button: only show for team (collaborative) projects
  const showMembersBtn = projectMeta.isCollaborative;
  const canInvite      = ["owner", "manager"].includes(projectMeta.myRole);

  const AI_PANEL_W  = 340;
  const NAV_PANEL_W = 84;
  const ICON_BAR_W  = 56;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh", overflow: "hidden" }}>
   

    {/* ── Save-blocked toast ───────────────────────────────────── */}
    {saveError && (
      <div style={{
        position: "fixed",
        top: 60,
        right: 20,
        zIndex: 999,
        maxWidth: 340,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        background: "#2a0e12",
        border: "1px solid rgba(239,68,68,0.4)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        color: "#fecaca",
        fontSize: 12,
        lineHeight: 1.5,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 2, color: "#fff" }}>Save blocked</div>
          {saveError}
        </div>
      </div>
    )}


   
      {/* ── Phase bar ─────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        minHeight: 44,
        backgroundColor: "#001530",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        paddingInline: 12,
        paddingBlock: 6,
        gap: 8,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 300,
      }}>

        {/* Phase pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, minWidth: 0 }}>
          {PHASES.map((p, idx) => {
            const meta       = PHASE_META[p];
            const isActive   = viewPhase === p;
            const isUnlocked = idx <= dbIdx;
            const isLocked   = idx > dbIdx;

            return (
              <button
                key={p}
                onClick={() => handleNavigate(p)}
                disabled={isLocked}
                title={isLocked ? `Complete previous phases to unlock ${meta.label}` : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid ${isActive ? meta.color : isUnlocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                  background: isActive ? `${meta.color}22` : "transparent",
                  color: isActive ? meta.color : isUnlocked ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: isActive ? meta.color : isUnlocked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                }} />
                {meta.label}
                {isLocked && <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>🔒</span>}
                {!isLocked && !isActive && idx < viewIdx && (
                  <span style={{ fontSize: 9, opacity: 0.6 }}>↩</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Online presence avatars */}
        {presence.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>
            {presence.map((u) => (
              <div key={u.userId} title={u.name} style={{
                width: 26, height: 26, borderRadius: "50%",
                background: u.color,
                border: "2px solid #001530",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* Right side controls */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}>

          {/* ── Members button — ONLY for team (collaborative) projects ── */}
          {showMembersBtn && (
            <button
              onClick={() => setMembersPanelOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.18)",
                background: membersPanelOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.75)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={e => {
                if (!membersPanelOpen) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)";
                }
              }}
            >
              {/* People icon — inline SVG, no import needed */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Members
            </button>
          )}

          {/* Advance error */}
          {advanceError && (
            <div style={{
              fontSize: 11,
              color: "#ef4444",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 6,
              padding: "3px 8px",
              maxWidth: 260,
              lineHeight: 1.4,
            }}>
              {advanceError}
            </div>
          )}

          {/* Advance phase button */}
          {canAdvance && (
            <button
              onClick={handleAdvancePhase}
              disabled={advancing}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "none",
                background: advancing ? "rgba(255,255,255,0.08)" : PHASE_META[PHASES[dbIdx + 1]].color,
                color: "#fff",
                cursor: advancing ? "not-allowed" : "pointer",
                fontSize: 11,
                fontWeight: 700,
                opacity: advancing ? 0.6 : 1,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {advancing ? "Checking…" : `Advance to ${PHASE_META[PHASES[dbIdx + 1]].label} →`}
            </button>
          )}

          {/* Reviewing older phase badge */}
          {viewPhase !== dbPhase && (
            <div style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "3px 8px",
              whiteSpace: "nowrap",
            }}>
              reviewing {PHASE_META[viewPhase].label}
            </div>
          )}
        </div>
      </div>

      {/* ── Board area ────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>

        {/* ══ PLANNING ══════════════════════════════════════════ */}
        {viewPhase === "planning" && (
          <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#f0f2f5" }}>
            <div style={{ flexShrink: 0, width: ICON_BAR_W, height: "100%", zIndex: 200 }}>
              <LeftIconBar
                aiPanelOpen={aiPanelOpen}   onToggleAI={() => setAiPanelOpen(p => !p)}
                //aiPanelOpen={aiPanelOpen} onToggleAI={() => setAiPanelOpen(p => !p)}
               // navPanelOpen={navPanelOpen} onToggleNav={() => setNavPanelOpen(p => !p)}
                navPanelOpen={navPanelOpen} onToggleNav={() => setNavPanelOpen(p => !p)}
                phase={viewPhase}
              />
            </div>

            <div style={{
              flexShrink: 0,
              width: navPanelOpen ? NAV_PANEL_W : 0,
              overflow: "hidden",
              transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
              height: "100%", zIndex: 190,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: NAV_PANEL_W - 9, height: "75%", backgroundColor: "#001530",
                borderRadius: "30px", display: "flex", marginLeft: "2%",
                alignItems: "center", paddingTop: 12, paddingBottom: 12,
                overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <Sidebar onSelectTool={handleSelectTool} activeTool={activeTool} compact projectId={projectId} />
              </div>
            </div>

            <div
              style={{ flex: 1, minWidth: 0, height: "100%", position: "relative", overflow: "hidden" }}
              onMouseMove={handleCanvasMouseMove}
            >
              <Canvas
                notes={(phaseData.notes ?? []) as NoteType[]}
                textCards={(phaseData.textCards ?? []) as TextCardType[]}
                flowNodes={(phaseData.flowNodes ?? []) as FlowNodeType[]}
                connections={(phaseData.connections ?? []) as FlowEdgeType[]}
                imageCards={(phaseData.imageCards ?? []) as ImageCard[]}
                commentThreads={(phaseData.commentThreads ?? []) as CommentThread[]}
                setNotes={setNotes}
                setTextCards={setTextCards}
                setFlowNodes={setFlowNodes}
                setConnections={setConnections}
                setImageCards={setImageCards}
                setCommentThreads={setCommentThreads}
                activeTool={activeTool}
                
                currentUser={currentUser?.name ?? "Anonymous"}
                currentUserId={currentUser?._id ?? ""}      // NEW
                  presence={presence}                          // NEW
                  typingUsers={typingUsers}                    // NEW
                  emitCommentTyping={emitCommentTyping}        // NEW
                  emitCommentStopTyping={emitCommentStopTyping}
                  emitCommentRead={emitCommentRead} 
              />
              <LiveCursors cursors={cursors} />
            </div>

            <div style={{
              flexShrink: 0,
              width: aiPanelOpen ? AI_PANEL_W : 0,
              overflow: "hidden",
              transition: "width 0.32s cubic-bezier(0.4,0,0.2,1)",
              height: "100%", zIndex: 180,
              boxShadow: aiPanelOpen ? "-4px 0 24px rgba(0,0,0,0.15)" : "none",
            }}>
              <div style={{ width: AI_PANEL_W, height: "100%", overflowY: "auto" }}>
                {/* MERGED from boardree.tsx: pass live canvas context + phase to the AI panel */}
               
              <AIPanel projectContext={boardContext} phase={viewPhase} />
              </div>
                   
            
            </div>
          </div>
        )}

        {/* ══ DESIGN ════════════════════════════════════════════ */}
        {viewPhase === "design" && (
          <DesignPhase
            projectId={projectId}
            initialElements={(phaseData.designElements ?? []) as CanvasElement[]}
            onElementsChange={setDesignElements}
            currentUser={currentUser?.name ?? "Anonymous"}
            initialFrames={(phaseData.designFrames ?? []) as any[]}
            cursors={cursors}
            emitCursor={emitCursor}
          />
        )}

        {/* ══ DEVELOPMENT ═══════════════════════════════════════ */}
        {viewPhase === "development" && (
          <DevBoard
            projectId={projectId}
            initialFiles={(phaseData.devFiles ?? []) as DevFileItem[]}
            onFilesChange={setDevFiles}
            initialTheme={(phaseData.devTheme?.[0] as DevTheme) ?? "my-dark"}
            onThemeChange={setDevTheme}
            currentUserId={currentUser?._id}
            currentUserName={currentUser?.name}
            onlineUserIds={new Set(presence.map(p => p.userId))}
          />
        )}
      </div>

      {/* ── Members slide-in panel ────────────────────────────── */}
      {/* Rendered outside the board area so it overlays everything */}
      {showMembersBtn && (
        <MembersPanel
          projectId={projectId}
          isOpen={membersPanelOpen}
          onClose={() => setMembersPanelOpen(false)}
          canInvite={canInvite}
          currentUser={currentUser ? { _id: currentUser._id, name: currentUser.name } : null}

          // isTeam={projectMeta.isCollaborative}
        
          
        />
      )}
    </div>
  );
}

