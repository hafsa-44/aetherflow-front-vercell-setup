/*import {
  FaStickyNote,
  FaProjectDiagram,
  FaFont,
  FaCommentDots,
  FaThumbtack,
  FaImage,
} from "react-icons/fa"
import { MdSummarize } from "react-icons/md"
import React, { useState } from "react"
//import ProjectInquiryForm, { type ProjectForm } from "../Canvas/AIContextFirm"
// ✅ point to your new form — adjust path to wherever you saved it
import ProjectInquiryForm, { type ProjectForm } from "../Canvas/formaware"
type ToolType = "notes" | "flowchart" | "text" | "comments" | "summarize" | "pin" | "image"

type SidebarProps = {
  onSelectTool: (tool: ToolType) => void
  activeTool?: ToolType | null
  // When true, renders in compact mode for the narrow nav panel //
  compact?: boolean
  projectId: string  
}

export default function Sidebar({ onSelectTool, activeTool, compact = false, projectId }: SidebarProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
 
  const handlePinClick = () => {
    onSelectTool("pin")
    setIsFormOpen(true)
  }

  const handleDone = (data: ProjectForm) => {
    //setPersistedData(data)
    setIsFormOpen(false)
  }

  const tools: { tool: ToolType | "pin"; icon: React.ReactNode; label: string; onClick?: () => void }[] = [
    { tool: "notes", icon: <FaStickyNote />, label: "Sticky Note" },
    { tool: "image", icon: <FaImage />, label: "Insert Image" },
    { tool: "text", icon: <FaFont />, label: "Text Card" },
    { tool: "flowchart", icon: <FaProjectDiagram />, label: "Flowchart" },
    { tool: "comments", icon: <FaCommentDots />, label: "Comments" },
    { tool: "summarize", icon: <MdSummarize />, label: "Summarize" },
    { tool: "pin", icon: <FaThumbtack />, label: "AI Context", onClick: handlePinClick },
  ]

  if (compact) {
    return (
      <>
        <div style={compactStyles.container}>
          <p style={compactStyles.sectionLabel}>TOOLS</p>
          {tools.map(({ tool, icon, label, onClick }) => (
            <CompactIconBox
              key={tool}
              title={label}
              active={activeTool === tool}
              onClick={onClick ?? (() => onSelectTool(tool as ToolType))}
            >
              {icon}
              <span style={compactStyles.label}>{label}</span>
            </CompactIconBox>
          ))}
        </div>

        {isFormOpen && (
          <div style={modalStyles.overlay}>
            <div style={modalStyles.content}>
              <ProjectInquiryForm
               projectId={projectId}    
              //  initialData={persistedData}
                onClose={() => setIsFormOpen(false)}
                onDone={handleDone}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  // Legacy floating sidebar — centered horizontally, 75% height, pill shape
  return (
    <>
      <div style={legacyStyles.sidebar}>
        {tools.map(({ tool, icon, label, onClick }) => (
          <IconBox
            key={tool}
            onClick={onClick ?? (() => onSelectTool(tool as ToolType))}
            active={activeTool === tool}
            title={label}
          >
            {icon}
          </IconBox>
        ))}
      </div>

      {isFormOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <ProjectInquiryForm
            //  initialData={persistedData}
               projectId={projectId}    
              onClose={() => setIsFormOpen(false)}
              onDone={handleDone}
            />
          </div>
        </div>
      )}
    </>
  )
}

/* ── Compact icon box (for nav panel) ─────────────────────────── */
/*function CompactIconBox({
  children, onClick, active, title,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 54,
        minHeight: 54,
        borderRadius: 12,
        margin: "3px auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        color: active ? "#ffffff" : hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
        background: active
          ? "rgba(255,255,255,0.18)"
          : hovered
            ? "rgba(255,255,255,0.08)"
            : "transparent",
        border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
        boxShadow: active ? "0 0 0 2px rgba(255,255,255,0.15)" : "none",
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontSize: 21,
        transform: hovered && !active ? "scale(1.06)" : "scale(1)",
        padding: "6px 2px",
      }}
    >
      {children}
    </div>
  )
}
*/

/* ── Legacy floating sidebar icon box ─────────────────────────── */
/*function IconBox({
  children, onClick, active, title,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
}) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        ...legacyStyles.iconBox,
        background: active ? "rgba(255,255,255,0.18)" : "transparent",
        borderColor: active ? "#ffffff" : "rgba(255,255,255,0.55)",
        boxShadow: active ? "0 0 0 2px rgba(255,255,255,0.3)" : "none",
        transform: active ? "scale(1.07)" : "scale(1)",
        transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
      }}
    >
      {children}
    </div>
  )
}

const compactStyles: { [k: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 8,
    gap: 2,
  },
  sectionLabel: {
    margin: "4px 0 8px",
    fontSize: 8,
    letterSpacing: "1.5px",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    fontWeight: 700,
    fontFamily: "system-ui",
  },
  label: {
    fontSize: 8,
    letterSpacing: "0.3px",
    fontFamily: "system-ui",
    fontWeight: 600,
    textAlign: "center",
    lineHeight: 1.2,
    maxWidth: 50,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
}

const legacyStyles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    position: "fixed",
    right: "20px",           // ← keeps it on the right edge like the screenshot
    top: "50%",
    transform: "translateY(-50%)",
    width: "70px",
    height: "75%",            // ← 75% viewport height
    backgroundColor: "#001F46",
    borderRadius: "35px",           // ← large pill / capsule radius
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
    zIndex: 1000,
    padding: "12px 0",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
  },
  iconBox: {
    width: "46px",
    height: "46px",
    border: "1px solid rgba(255,255,255,0.55)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "22px",
    cursor: "pointer",
  },
}

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  content: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    position: "relative",
    width: "90%",
    maxWidth: "500px",
  },
} */
//new file
import {
  FaStickyNote,
  FaProjectDiagram,
  FaFont,
  FaCommentDots,
  FaThumbtack,
  FaImage,
} from "react-icons/fa"
import { MdSummarize } from "react-icons/md"
import React, { useState } from "react"
import ProjectInquiryForm, { type ProjectForm } from "../Canvas/formaware"

type ToolType = "notes" | "flowchart" | "text" | "comments" | "summarize" | "pin" | "image"

type SidebarProps = {
  onSelectTool: (tool: ToolType) => void
  activeTool?: ToolType | null
  compact?: boolean
  projectId: string
}

export default function Sidebar({ onSelectTool, activeTool, compact = false, projectId }: SidebarProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handlePinClick = () => {
    onSelectTool("pin")
    setIsFormOpen(true)
  }

  const handleDone = (_data: ProjectForm) => {
    setIsFormOpen(false)
  }

  const tools: { tool: ToolType | "pin"; icon: React.ReactNode; label: string; onClick?: () => void }[] = [
    { tool: "notes",     icon: <FaStickyNote />,    label: "Sticky Note" },
    { tool: "image",     icon: <FaImage />,          label: "Insert Image" },
    { tool: "text",      icon: <FaFont />,           label: "Text Card" },
    { tool: "flowchart", icon: <FaProjectDiagram />, label: "Flowchart" },
    { tool: "comments",  icon: <FaCommentDots />,    label: "Comments" },
   // { tool: "summarize", icon: <MdSummarize />,      label: "Summarize" },
    { tool: "pin",       icon: <FaThumbtack />,      label: "AI Context", onClick: handlePinClick },
  ]

  const modal = isFormOpen && (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <ProjectInquiryForm
          projectId={projectId}
          onClose={() => setIsFormOpen(false)}
          onDone={handleDone}
        />
      </div>
    </div>
  )

  if (compact) {
    return (
      <>
        <div style={compactStyles.container}>
          {tools.map(({ tool, icon, label, onClick }) => (
            <CompactIconBox
              key={tool}
              title={label}
              active={activeTool === tool}
              onClick={onClick ?? (() => onSelectTool(tool as ToolType))}
              icon={icon}
              label={label}
            />
          ))}
        </div>
        {modal}
      </>
    )
  }

  return (
    <>
      <div style={legacyStyles.sidebar}>
        {tools.map(({ tool, icon, label, onClick }) => (
          <IconBox
            key={tool}
            onClick={onClick ?? (() => onSelectTool(tool as ToolType))}
            active={activeTool === tool}
            title={label}
          >
            {icon}
          </IconBox>
        ))}
      </div>
      {modal}
    </>
  )
}

// ── Compact icon box ───────────────────────────────────────────────────────────
function CompactIconBox({
  icon, label, onClick, active, title,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  title?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 62,
        flex: "1 1 0",
        minHeight: 42,
        maxHeight: 64,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        cursor: "pointer",
        transition: "all 0.15s ease",
        background: active
          ? "rgba(255,255,255,0.15)"
          : hovered
          ? "rgba(255,255,255,0.07)"
          : "transparent",
        border: active
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid transparent",
      }}
    >
      <div style={{
        fontSize: 15,
        color: active
          ? "#ffffff"
          : hovered
          ? "rgba(255,255,255,0.85)"
          : "rgba(255,255,255,0.45)",
        lineHeight: 1,
        transition: "color 0.15s",
      }}>
        {icon}
      </div>

      <div style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: "0.3px",
        fontFamily: "system-ui, sans-serif",
        color: active
          ? "rgba(255,255,255,0.9)"
          : "rgba(255,255,255,0.35)",
        textAlign: "center",
        lineHeight: 1.2,
        width: "100%",
        padding: "0 4px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
      }}>
        {label}
      </div>
    </div>
  )
}

// ── Legacy floating sidebar icon box ──────────────────────────────────────────
function IconBox({
  children, onClick, active, title,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
}) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        ...legacyStyles.iconBox,
        background:  active ? "rgba(255,255,255,0.18)" : "transparent",
        borderColor: active ? "#ffffff" : "rgba(255,255,255,0.55)",
        boxShadow:   active ? "0 0 0 2px rgba(255,255,255,0.3)" : "none",
        transform:   active ? "scale(1.07)" : "scale(1)",
        transition:  "all 0.15s ease",
      }}
    >
      {children}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const compactStyles: { [k: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingBlock: 6,
    boxSizing: "border-box",
  },
}

const legacyStyles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    position: "fixed",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "70px",
    height: "75%",
    backgroundColor: "#001F46",
    borderRadius: "35px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
    zIndex: 1000,
    padding: "12px 0",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
  },
  iconBox: {
    width: "46px",
    height: "46px",
    border: "1px solid rgba(255,255,255,0.55)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "22px",
    cursor: "pointer",
  },
}

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  content: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    position: "relative",
    width: "90%",
    maxWidth: "500px",
  },
}