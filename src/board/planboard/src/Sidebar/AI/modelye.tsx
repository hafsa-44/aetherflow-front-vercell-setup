/*import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

// FIX: Use proper OpenRouter role types. Previously `role: "ai"` was sent to the
// API but OpenRouter expects `role: "assistant"` — all AI context was being ignored.
interface Message {
  role: "user" | "assistant";
  content: string;
}

// Internal display message keeps a separate type so the UI can distinguish
// "assistant" from a display perspective without re-labelling in the API payload.
interface DisplayMessage {
  role: "user" | "ai";
  content: string;
}

function MermaidRenderer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        mermaid.initialize({ startOnLoad: false });
        ref.current.innerHTML = code;
        mermaid.run({ nodes: [ref.current] });
      } catch (err) {
        ref.current.innerHTML = "Invalid Mermaid Diagram.";
      }
    }
  }, [code]);
  return <div ref={ref} />;
}

export default function ChatModule() {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: "ai", content: "The Aether is silent. What shall we manifest today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeMember, setActiveMember] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // FIX: API key is now read from environment variable, not hardcoded in source.
  // Set VITE_OPENROUTER_API_KEY in your .env file.
  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  const MODEL = "mistralai/mistral-7b-instruct";

  const members = [
    { name: "Alex", color: "#3949AB", online: true, role: "Project Manager", lastUpdate: "2 mins ago", status: "Reviewing wireframes" },
    { name: "Sara", color: "#00897B", online: true, role: "UI Designer", lastUpdate: "5 mins ago", status: "Updating flowcharts" },
    { name: "Mike", color: "#E53935", online: false, role: "Developer", lastUpdate: "2 hours ago", status: "Away — in a meeting" },
    { name: "Zoe", color: "#FB8C00", online: true, role: "Researcher", lastUpdate: "12 mins ago", status: "Adding sticky notes" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input;

    // Add to display messages as "user"
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setInput("");
    setIsTyping(true);

    try {
      // FIX: Build API history with correct role values ("user" / "assistant").
      // Previously the "ai" role was sent verbatim, which is not a valid OpenRouter role.
      const apiHistory: Message[] = messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `You are a Flowchart Generator.
If user asks for a flowchart: Respond ONLY in valid Mermaid flowchart syntax.
Example:
flowchart TD
  A[Start] --> B{Decision?}
  B -- Yes --> C[Action]
  B -- No --> D[End]
If user asks normal question: Respond normally in short structured format.`
            },
            ...apiHistory,
            { role: "user", content: userText }
          ]
        })
      });
      const data = await response.json();
      let aiContent = "No valid AI response.";
      if (data.choices?.[0]?.message?.content) aiContent = data.choices[0].message.content;
      else if (data.choices?.[0]?.delta?.content) aiContent = data.choices[0].delta.content;
      setMessages(prev => [...prev, { role: "ai", content: aiContent }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Connection failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const activeMemberData = activeMember !== null ? members[activeMember] : null;

  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "linear-gradient(180deg, #0a0f1e 0%, #0d1426 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: "hidden",
    }}>

     //  ── Header ── 
      <div style={{
        padding: "14px 18px",
        background: "linear-gradient(135deg, #0d1835 0%, #111d3a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
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
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(67,160,71,0.12)", border: "1px solid rgba(67,160,71,0.25)",
          borderRadius: 20, padding: "3px 10px",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#43A047", boxShadow: "0 0 6px rgba(67,160,71,0.9)",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 9, color: "#66BB6A", fontWeight: 600, letterSpacing: "0.5px" }}>LIVE</span>
        </div>
      </div>

      //─ Collaborators ── 
      <div style={{
        padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#43A047", boxShadow: "0 0 5px rgba(67,160,71,0.7)",
          }} />
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
            3 Online
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {members.map((member, i) => {
            const isManager = member.role === "Project Manager";
            return (
              <div key={i} style={{ position: "relative", marginLeft: i === 0 ? 0 : "-6px", zIndex: 10 - i }}>
                <div
                  onClick={() => setActiveMember(i)}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", position: "relative",
                    background: member.online ? `linear-gradient(135deg, ${member.color}, ${member.color}cc)` : "#BDBDBD",
                    border: `2px solid ${isManager ? "#FFD700" : member.online ? "#fff" : "#eee"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer",
                    boxShadow: isManager ? "0 0 8px rgba(255,215,0,0.8)" : member.online ? `0 0 6px ${member.color}66` : "none",
                    opacity: member.online ? 1 : 0.5,
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {member.name[0]}
                  {isManager && (
                    <div style={{
                      position: "absolute", top: -9, left: "50%",
                      transform: "translateX(-50%)", fontSize: 10, pointerEvents: "none",
                    }}>👑</div>
                  )}
                </div>
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 7, height: 7, borderRadius: "50%",
                  background: member.online ? "#43A047" : "#BDBDBD",
                  border: "1.5px solid #fff",
                  boxShadow: member.online ? "0 0 4px rgba(67,160,71,0.8)" : "none",
                }} />
              </div>
            );
          })}

          <div style={{
            marginLeft: "-6px", zIndex: 0, width: 26, height: 26, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.6)",
          }}>+2</div>
        </div>
      </div>

      //── Messages ── 
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
            {msg.role === "ai" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10,
                }}>✦</div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.5px" }}>AETHER</span>
              </div>
            )}
            <div style={{
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
                : "rgba(255,255,255,0.06)",
              color: msg.role === "user" ? "#ffffff" : "rgba(255,255,255,0.88)",
              border: msg.role === "ai" ? "1px solid rgba(255,255,255,0.08)" : "none",
              fontSize: 13, lineHeight: 1.55,
              boxShadow: msg.role === "user" ? "0 4px 16px rgba(79,70,229,0.4)" : "none",
              overflowX: "auto",
            }}>
              {msg.role === "ai" && msg.content.includes("flowchart") ? (
                <>
                  {!msg.content.trim().startsWith("flowchart") && (
                    <p style={{ marginBottom: 10 }}>{msg.content.split("flowchart")[0]}</p>
                  )}
                  <MermaidRenderer code={msg.content} />
                </>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
            }}>✦</div>
            <div style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px 16px 16px 3px", padding: "10px 16px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      // ── Input ──
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "14px", padding: "6px 6px 6px 14px",
          border: "1px solid rgba(255,255,255,0.1)",
          transition: "border-color 0.2s",
        }}>
          <input
            value={input} disabled={isTyping}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask Aether anything..."
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", color: "rgba(255,255,255,0.88)",
              fontSize: 13, fontFamily: "inherit",
            }}
          />
          <button onClick={handleSendMessage} disabled={isTyping} style={{
            background: isTyping
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #4F46E5, #7C3AED)",
            color: "white", border: "none",
            borderRadius: "10px", width: 34, height: 34,
            cursor: isTyping ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, flexShrink: 0,
            boxShadow: isTyping ? "none" : "0 2px 10px rgba(79,70,229,0.5)",
            transition: "all 0.2s",
          }}>✦</button>
        </div>
        <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.5px" }}>
          Powered by Mistral · Aether AI
        </p>
      </div>

    //── Member Detail Modal ──
      {activeMemberData && (
        <div
          onClick={() => setActiveMember(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
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
              <div onClick={() => setActiveMember(null)} style={{
                position: "absolute", top: 12, right: 14,
                color: "rgba(255,255,255,0.8)", fontSize: 22,
                cursor: "pointer", fontWeight: 700, lineHeight: 1,
              }}>×</div>

              {activeMemberData.role === "Project Manager" && (
                <div style={{ fontSize: 24, marginBottom: 6 }}>👑</div>
              )}

              <div style={{
                width: 68, height: 68, borderRadius: "50%", margin: "0 auto 12px",
                background: "rgba(255,255,255,0.25)",
                border: activeMemberData.role === "Project Manager" ? "3px solid #FFD700" : "3px solid rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: "#fff",
                boxShadow: activeMemberData.role === "Project Manager"
                  ? "0 0 20px rgba(255,215,0,0.6)"
                  : "0 4px 16px rgba(0,0,0,0.2)",
              }}>
                {activeMemberData.name[0]}
              </div>

              <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: "0.5px" }}>
                {activeMemberData.name}
              </div>
              <div style={{
                display: "inline-block", marginTop: 8,
                fontSize: 10, fontWeight: 600,
                color: activeMemberData.role === "Project Manager" ? "#FFF8DC" : "rgba(255,255,255,0.9)",
                background: activeMemberData.role === "Project Manager" ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.15)",
                border: activeMemberData.role === "Project Manager" ? "1px solid rgba(255,215,0,0.5)" : "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "3px 14px", letterSpacing: "1px", textTransform: "uppercase",
              }}>
                {activeMemberData.role}
              </div>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{
                background: activeMemberData.online ? "rgba(67,160,71,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeMemberData.online ? "rgba(67,160,71,0.2)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                    Current Status
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: activeMemberData.online ? "#43A047" : "rgba(255,255,255,0.2)",
                      boxShadow: activeMemberData.online ? "0 0 5px rgba(67,160,71,0.8)" : "none",
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: activeMemberData.online ? "#66BB6A" : "rgba(255,255,255,0.3)" }}>
                      {activeMemberData.online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.5 }}>
                  "{activeMemberData.status}"
                </div>
              </div>

              {[
                { label: "Role", value: activeMemberData.role, icon: activeMemberData.role === "Project Manager" ? "👑" : "👤" },
                { label: "Last Active", value: activeMemberData.lastUpdate, icon: "🕐" },
                { label: "Availability", value: activeMemberData.online ? "Available" : "Unavailable", icon: "📡" },
              ].map((row, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: idx < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{row.icon}</span>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{row.label}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 2 }}>{row.value}</div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setActiveMember(null)}
                style={{
                  width: "100%", marginTop: 18, padding: "11px",
                  background: `linear-gradient(135deg, ${activeMemberData.color}, ${activeMemberData.color}cc)`,
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 14px ${activeMemberData.color}44`,
                  letterSpacing: "0.5px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
*/

//new one
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import mermaid from "mermaid";
import api from "../../../../../api"; // adjust depth if needed

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DisplayMessage {
  role: "user" | "ai";
  content: string;
}

// ── Real member shape from GET /api/projects/:id/members ──────────────────
interface Member {
  userId:         string;
  name:           string;
  email:          string;
  profilePicture: string | null;
  role:           "owner" | "manager" | "member";
  joinedAt:       string;
}

// ── Derived display shape used in the UI ──────────────────────────────────
interface DisplayMember {
  name:           string;
  color:          string;
  online:         boolean;        // always false — no presence yet
  role:           string;         // capitalised label
  lastUpdate:     string;
  status:         string;
  profilePicture: string | null;
}

function MermaidRenderer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        mermaid.initialize({ startOnLoad: false });
        ref.current.innerHTML = code;
        mermaid.run({ nodes: [ref.current] });
      } catch {
        ref.current.innerHTML = "Invalid Mermaid Diagram.";
      }
    }
  }, [code]);
  return <div ref={ref} />;
}

// Stable colour palette — assigned by index so colours don't change on re-render
const AVATAR_COLORS = [
  "#3949AB", "#00897B", "#E53935",
  "#FB8C00", "#8E24AA", "#0288D1",
];

function roleLabel(role: string): string {
  if (role === "owner")   return "Project Owner";
  if (role === "manager") return "Manager";
  if(role =="designer") return "Designer";
  if(role =="developer") return "Developer";
  return "Member";
}

// ── Permissions per role ──────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Project Owner": ["Full control", "Manage members", "Edit settings", "Delete project"],
  "Manager":       ["Manage tasks", "Invite members", "Edit project settings"],
  "Member":        ["View project", "Update tasks", "Add comments"],
};

// ── Clean SVG owner badge (no emoji) ─────────────────────────
function OwnerBadge({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Simple 5-pointed star, filled gold */}
      <polygon
        points="8,1 9.8,6.2 15.5,6.2 10.9,9.8 12.7,15 8,11.4 3.3,15 5.1,9.8 0.5,6.2 6.2,6.2"
        fill="#F5C518"
        stroke="#D4A800"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ChatModule() {
  const { projectId } = useParams<{ projectId: string }>();

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: "ai", content: "The Aether is silent. What shall we manifest today?" },
  ]);
  const [input,        setInput]        = useState("");
  const [isTyping,     setIsTyping]     = useState(false);
  const [activeMember, setActiveMember] = useState<number | null>(null);

  // ── Real member state ────────────────────────────────────────
  const [members,        setMembers]        = useState<DisplayMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  const MODEL   = "mistralai/mistral-7b-instruct";

  // ── Fetch real members ────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    setMembersLoading(true);
    api.get<Member[]>(`/projects/${projectId}/members`)
      .then(res => {
        const display: DisplayMember[] = res.data.map((m, i) => ({
          name:           m.name,
          color:          AVATAR_COLORS[i % AVATAR_COLORS.length],
          online:         false,               // extend with socket presence later
          role:           roleLabel(m.role),
          lastUpdate:     "—",
          status:         m.role === "owner" ? "Project owner" : "Team member",
          profilePicture: m.profilePicture ?? null,
        }));
        setMembers(display);
      })
      .catch(err => {
        console.error("ChatModule: failed to load members", err);
      })
      .finally(() => setMembersLoading(false));
  }, [projectId]);

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ──────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input;
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setInput("");
    setIsTyping(true);

    try {
      const apiHistory: Message[] = messages.map(m => ({
        role:    m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `You are a Flowchart Generator.
If user asks for a flowchart: Respond ONLY in valid Mermaid flowchart syntax.
Example:
flowchart TD
  A[Start] --> B{Decision?}
  B -- Yes --> C[Action]
  B -- No --> D[End]
If user asks normal question: Respond normally in short structured format.`,
            },
            ...apiHistory,
            { role: "user", content: userText },
          ],
        }),
      });

      const data = await response.json();
      let aiContent = "No valid AI response.";
      if (data.choices?.[0]?.message?.content) aiContent = data.choices[0].message.content;
      else if (data.choices?.[0]?.delta?.content) aiContent = data.choices[0].delta.content;
      setMessages(prev => [...prev, { role: "ai", content: aiContent }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Connection failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const activeMemberData = activeMember !== null ? members[activeMember] : null;
  const onlineCount      = members.filter(m => m.online).length;

  // ── Avatar renderer (profile picture OR initial) ─────────────
  function Avatar({
    member, size = 26, fontSize = 10,
  }: {
    member: DisplayMember;
    size?: number;
    fontSize?: number;
  }) {
    const isOwner = member.role === "Project Owner";
    if (member.profilePicture) {
      return (
        <img
          src={member.profilePicture}
          alt={member.name}
          style={{
            width: size, height: size, borderRadius: "50%", objectFit: "cover",
            border: `2px solid ${isOwner ? "#FFD700" : member.online ? "#fff" : "#eee"}`,
            boxShadow: isOwner ? "0 0 8px rgba(255,215,0,0.8)" : member.online ? `0 0 6px ${member.color}66` : "none",
            opacity: member.online ? 1 : 0.65,
          }}
        />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: member.online
          ? `linear-gradient(135deg, ${member.color}, ${member.color}cc)`
          : "#BDBDBD",
        border: `2px solid ${isOwner ? "#FFD700" : member.online ? "#fff" : "#eee"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize, fontWeight: 700, color: "#fff",
        boxShadow: isOwner ? "0 0 8px rgba(255,215,0,0.8)" : member.online ? `0 0 6px ${member.color}66` : "none",
        opacity: member.online ? 1 : 0.65,
      }}>
        {member.name[0]?.toUpperCase()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "linear-gradient(180deg, #0a0f1e 0%, #0d1426 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 18px",
        background: "linear-gradient(135deg, #0d1835 0%, #111d3a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
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
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(67,160,71,0.12)", border: "1px solid rgba(67,160,71,0.25)",
          borderRadius: 20, padding: "3px 10px",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#43A047", boxShadow: "0 0 6px rgba(67,160,71,0.9)",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 9, color: "#66BB6A", fontWeight: 600, letterSpacing: "0.5px" }}>LIVE</span>
        </div>
      </div>

      {/* ── Collaborators strip ── */}
      <div style={{
        padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.03)",
        minHeight: 42,
      }}>
        {/* Online count */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#43A047", boxShadow: "0 0 5px rgba(67,160,71,0.7)",
          }} />
          <span style={{
            fontSize: "9px", color: "rgba(255,255,255,0.4)",
            letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600,
          }}>
            {membersLoading
              ? "Loading…"
              : `${members.length} member${members.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Avatar stack */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {membersLoading
            ? /* skeleton avatars */
              [0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "2px solid rgba(255,255,255,0.1)",
                  marginLeft: i === 0 ? 0 : -6,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))
            : members.map((member, i) => {
                const isOwner = member.role === "Project Owner";
                return (
                  <div
                    key={i}
                    style={{ position: "relative", marginLeft: i === 0 ? 0 : -6, zIndex: 10 - i }}
                  >
                    <div
                      onClick={() => setActiveMember(i)}
                      style={{ cursor: "pointer", position: "relative", transition: "transform 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      {isOwner && (
                        <div style={{
                          position: "absolute", top: -10, left: "50%",
                          transform: "translateX(-50%)", pointerEvents: "none", zIndex: 1,
                        }}>
                          <OwnerBadge size={13} />
                        </div>
                      )}
                      <Avatar member={member} size={26} fontSize={10} />
                    </div>
                    {/* Online dot */}
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 7, height: 7, borderRadius: "50%",
                      background: member.online ? "#43A047" : "#BDBDBD",
                      border: "1.5px solid #0a0f1e",
                      boxShadow: member.online ? "0 0 4px rgba(67,160,71,0.8)" : "none",
                    }} />
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
            {msg.role === "ai" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
                }}>✦</div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.5px" }}>AETHER</span>
              </div>
            )}
            <div style={{
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
                : "rgba(255,255,255,0.06)",
              color: msg.role === "user" ? "#ffffff" : "rgba(255,255,255,0.88)",
              border: msg.role === "ai" ? "1px solid rgba(255,255,255,0.08)" : "none",
              fontSize: 13, lineHeight: 1.55,
              boxShadow: msg.role === "user" ? "0 4px 16px rgba(79,70,229,0.4)" : "none",
              overflowX: "auto",
            }}>
              {msg.role === "ai" && msg.content.includes("flowchart") ? (
                <>
                  {!msg.content.trim().startsWith("flowchart") && (
                    <p style={{ marginBottom: 10 }}>{msg.content.split("flowchart")[0]}</p>
                  )}
                  <MermaidRenderer code={msg.content} />
                </>
              ) : msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
            }}>✦</div>
            <div style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px 16px 16px 3px", padding: "10px 16px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "14px", padding: "6px 6px 6px 14px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <input
            value={input}
            disabled={isTyping}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask Aether anything..."
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", color: "rgba(255,255,255,0.88)",
              fontSize: 13, fontFamily: "inherit",
            }}
          />
          <button onClick={handleSendMessage} disabled={isTyping} style={{
            background: isTyping
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #4F46E5, #7C3AED)",
            color: "white", border: "none",
            borderRadius: "10px", width: 34, height: 34,
            cursor: isTyping ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, flexShrink: 0,
            boxShadow: isTyping ? "none" : "0 2px 10px rgba(79,70,229,0.5)",
            transition: "all 0.2s",
          }}>✦</button>
        </div>
        <p style={{
          margin: "8px 0 0", textAlign: "center",
          fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.5px",
        }}>
          Powered by Mistral · Aether AI
        </p>
      </div>

      {/* ── Member Detail Modal ── */}
      {activeMemberData && (
        <div
          onClick={() => setActiveMember(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.3)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#111d3a", borderRadius: 20, width: 300,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Modal header */}
            <div style={{
              background: `linear-gradient(135deg, ${activeMemberData.color}, ${activeMemberData.color}99)`,
              padding: "28px 20px 44px",
              position: "relative", textAlign: "center",
            }}>
              <div
                onClick={() => setActiveMember(null)}
                style={{
                  position: "absolute", top: 12, right: 14,
                  color: "rgba(255,255,255,0.8)", fontSize: 22,
                  cursor: "pointer", fontWeight: 700, lineHeight: 1,
                }}
              >×</div>

              {activeMemberData.role === "Project Owner" && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(245,197,24,0.15)",
                    border: "1px solid rgba(245,197,24,0.35)",
                    borderRadius: 20, padding: "3px 10px",
                  }}>
                    <OwnerBadge size={11} />
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#F5C518",
                      letterSpacing: "1.2px", textTransform: "uppercase",
                    }}>Project Owner</span>
                  </div>
                </div>
              )}

              {/* Large avatar */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                {activeMemberData.profilePicture ? (
                  <img
                    src={activeMemberData.profilePicture}
                    alt={activeMemberData.name}
                    style={{
                      width: 68, height: 68, borderRadius: "50%", objectFit: "cover",
                      border: activeMemberData.role === "Project Owner"
                        ? "3px solid #FFD700"
                        : "3px solid rgba(255,255,255,0.6)",
                      boxShadow: activeMemberData.role === "Project Owner"
                        ? "0 0 20px rgba(255,215,0,0.6)"
                        : "0 4px 16px rgba(0,0,0,0.2)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 68, height: 68, borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                    border: activeMemberData.role === "Project Owner"
                      ? "3px solid #FFD700"
                      : "3px solid rgba(255,255,255,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, fontWeight: 800, color: "#fff",
                    boxShadow: activeMemberData.role === "Project Owner"
                      ? "0 0 20px rgba(255,215,0,0.6)"
                      : "0 4px 16px rgba(0,0,0,0.2)",
                  }}>
                    {activeMemberData.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: "0.5px" }}>
                {activeMemberData.name}
              </div>
              <div style={{
                display: "inline-block", marginTop: 8,
                fontSize: 10, fontWeight: 600,
                color: activeMemberData.role === "Project Owner" ? "#FFF8DC" : "rgba(255,255,255,0.9)",
                background: activeMemberData.role === "Project Owner"
                  ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.15)",
                border: activeMemberData.role === "Project Owner"
                  ? "1px solid rgba(255,215,0,0.5)" : "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "3px 14px",
                letterSpacing: "1px", textTransform: "uppercase",
              }}>
                {activeMemberData.role}
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px" }}>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase", letterSpacing: "1px",
                  fontWeight: 600, marginBottom: 6,
                }}>Status</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.5 }}>
                  "{activeMemberData.status}"
                </div>
              </div>

              {/* Role row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {activeMemberData.role === "Project Owner"
                    ? <OwnerBadge size={13} />
                    : <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3.2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4"/>
                        <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Role</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 2 }}>
                    {activeMemberData.role}
                  </div>
                </div>
              </div>

              {/* Permissions row */}
              <div style={{ padding: "12px 0" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: 8 }}>
                  Permissions
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(ROLE_PERMISSIONS[activeMemberData.role] ?? []).map((perm, pi) => (
                    <span key={pi} style={{
                      fontSize: 10, fontWeight: 500,
                      color: "rgba(255,255,255,0.65)",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, padding: "3px 8px",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                        <circle cx="4" cy="4" r="3" fill="rgba(79,200,120,0.8)" />
                      </svg>
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
                  letterSpacing: "0.5px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}