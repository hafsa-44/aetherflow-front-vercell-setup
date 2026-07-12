import { FaSquare, FaCircle, FaGem, FaLongArrowAltRight, FaRegCopy, FaTrashAlt, FaSlash } from "react-icons/fa"

type Props = {
     onAddShape: (shape: "rect" | "circle" | "diamond" | "parallelogram") => void // Added type
     activeSubTool: "select" | "connector"
     setActiveSubTool: (tool: "select" | "connector") => void
     onCopy: () => void
     onDelete: () => void
}

export default function FlowchartToolbar({ onAddShape, activeSubTool, setActiveSubTool, onCopy, onDelete }: Props) {
     return (
          <div style={styles.toolbar}>
               <div style={styles.iconBox} onClick={() => onAddShape("rect")} title="Process (Rectangle)"><FaSquare /></div>
               <div style={styles.iconBox} onClick={() => onAddShape("circle")} title="Start/End (Circle)"><FaCircle /></div>
               <div style={styles.iconBox} onClick={() => onAddShape("diamond")} title="Decision (Diamond)"><FaGem /></div>

               {/* 🆕 Input/Output Shape Button */}
               <div style={styles.iconBox} onClick={() => onAddShape("parallelogram")} title="Input/Output (Parallelogram)">
                    <FaSquare style={{ transform: 'skewX(-20deg)' }} />
               </div>

               <div style={styles.divider} />
               <div
                    style={{ ...styles.iconBox, backgroundColor: activeSubTool === "connector" ? "#4A90E2" : "transparent" }}
                    onClick={() => setActiveSubTool(activeSubTool === "connector" ? "select" : "connector")}
               >
                    <FaLongArrowAltRight />
               </div>
               <div style={styles.divider} />
               <div style={styles.iconBox} onClick={onCopy}><FaRegCopy /></div>
               <div style={styles.iconBox} onClick={onDelete}><FaTrashAlt color="#FF4D4D" /></div>
          </div>
     )
}


const styles: { [key: string]: React.CSSProperties } = {
  toolbar: {
    position: "fixed",
    bottom: "32px",
    left: "calc(50% + 97px)",   // ✅ same offset as BottomToolbar
    transform: "translateX(-50%)",
    backgroundColor: "#001F46",
    borderRadius: "16px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 3000,
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  },
  iconBox: {
    width: "44px",
    height: "44px",
    border: "1px solid white",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  divider: {
    width: "1px",
    height: "24px",
    backgroundColor: "rgba(255,255,255,0.3)",
    margin: "0 4px",
  },
};