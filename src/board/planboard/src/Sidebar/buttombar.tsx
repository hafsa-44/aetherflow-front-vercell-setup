import { FaCopy, FaTrash, FaPalette, FaBold, FaItalic, FaListUl, FaLink, FaPlus, FaMinus } from "react-icons/fa";
import { useState } from "react";

type Props = {
  activeType: "note" | "text";
  element: any;
  onUpdate: (updated: any) => void;
  // FIX: onDelete is `() => void` — it reads selection from canvas closure, takes no id arg.
  // Previously typed as `(id: string) => void` which mismatched the actual handleDelete implementation.
  onDelete: () => void;
  onCopy: (element: any) => void;
};

export default function BottomToolbar({ activeType, element, onUpdate, onDelete, onCopy }: Props) {
  const [showColors, setShowColors] = useState(false);
  const COLORS = ["#FFEB3B", "#A5D6A7", "#90CAF9", "#FFAB91", "#F48FB1"];

  const toggleStyle = (prop: "fontWeight" | "fontStyle", activeVal: string, normalVal: string) => {
    onUpdate({ ...element, [prop]: element[prop] === activeVal ? normalVal : activeVal });
  };

  const changeSize = (delta: number) => {
    onUpdate({ ...element, fontSize: (element.fontSize || 18) + delta });
  };

  return (
    <div style={styles.toolbar}>
      <div style={styles.iconBox} onClick={() => onCopy(element)}><FaCopy /></div>
      {/* FIX: onDelete() called with no arguments */}
      <div style={styles.iconBox} onClick={() => onDelete()}><FaTrash /></div>

      {activeType === "text" && (
        <>
          <div style={styles.divider} />
          <div style={{ ...styles.iconBox, color: element.fontWeight === 'bold' ? '#4A90E2' : 'white' }}
            onClick={() => toggleStyle("fontWeight", "bold", "normal")}><FaBold /></div>
          <div style={{ ...styles.iconBox, color: element.fontStyle === 'italic' ? '#4A90E2' : 'white' }}
            onClick={() => toggleStyle("fontStyle", "italic", "normal")}><FaItalic /></div>

          <div style={styles.iconBox} onClick={() => changeSize(-2)}><FaMinus /></div>
          <span style={{ color: 'white', minWidth: '30px', textAlign: 'center' }}>{element.fontSize || 18}</span>
          <div style={styles.iconBox} onClick={() => changeSize(2)}><FaPlus /></div>

          <div style={styles.divider} />
          <div style={styles.iconBox} onClick={() => onUpdate({ ...element, text: element.text + "\n• " })}><FaListUl /></div>
          <div style={styles.iconBox} onClick={() => {
            const url = prompt("Enter URL:");
            if (url) onUpdate({ ...element, text: element.text, url: url });
          }}><FaLink /></div>
        </>
      )}

      {activeType === "note" && (
        <div style={styles.iconBox} onClick={() => setShowColors(!showColors)}><FaPalette /></div>
      )}

      {showColors && activeType === "note" && (
        <div style={styles.colorPanel}>
          {COLORS.map(c => (
            <div key={c} style={{ ...styles.colorDot, backgroundColor: c }} onClick={() => onUpdate({ ...element, fill: c })} />
          ))}
        </div>
      )}
    </div>
  );
}

 
    const styles: { [key: string]: React.CSSProperties } = {
  toolbar: {
    position: "fixed",
    bottom: "32px",
    left: "calc(50% + 97px)",
    transform: "translateX(-50%)",
    backgroundColor: "#001F46",
    borderRadius: "16px",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 3000,
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  },
  iconBox: {
    width: 40,
    height: 40,
    border: "1px solid white",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    cursor: "pointer",
  },
  divider: {
    width: "1px",
    height: "24px",
    backgroundColor: "rgba(255,255,255,0.3)",
    margin: "0 5px",
  },
  colorPanel: {
    position: "fixed",
    bottom: "100px",
    left: "calc(50% + 97px)",
    transform: "translateX(-50%)",
    background: "#fff",
    padding: "8px",
    borderRadius: 10,
    display: "flex",
    gap: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    zIndex: 3001,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    cursor: "pointer",
  },
}  as const;