import React, { useState } from "react";

interface SummaryModuleProps {
  onSendSelected: () => void;
  onSendAll: () => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (val: boolean) => void;
  selectedCount: number;
}

export default function SummaryModule({
  onSendSelected,
  onSendAll,
  isSelectionMode,
  setIsSelectionMode,
  selectedCount
}: SummaryModuleProps) {
  
  const styles = {
    toolbar: {
      position: "fixed" as const,
      bottom: "30px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#001F46",
      padding: "12px 20px",
      borderRadius: "16px",
      display: "flex",
      gap: "15px",
      zIndex: 1000,
      boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.1)",
      alignItems: "center"
    },
    button: {
      padding: "8px 16px",
      backgroundColor: "#4A90E2",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold" as const,
      transition: "0.2s"
    },
    secondaryButton: {
      padding: "8px 16px",
      backgroundColor: "transparent",
      color: "white",
      border: "1px solid #4A90E2",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px"
    },
    badge: {
      backgroundColor: "#FF3B30",
      color: "white",
      fontSize: "10px",
      padding: "2px 6px",
      borderRadius: "10px",
      marginLeft: "5px"
    }
  };

  return (
    <div style={styles.toolbar}>
      {!isSelectionMode ? (
        <>
          {/* STEP 1: INITIAL VIEW */}
          <button style={styles.button} onClick={() => setIsSelectionMode(true)}>
            Select Items
          </button>
          <button style={styles.secondaryButton} onClick={onSendAll}>
            Send All
          </button>
        </>
      ) : (
        <>
          {/* STEP 2: SELECTION VIEW */}
          <div style={{ color: "#90CAF9", fontSize: "12px", marginRight: "10px" }}>
            {selectedCount} selected
          </div>
          <button style={styles.button} onClick={onSendSelected}>
            Send Selected
          </button>
          <button style={styles.secondaryButton} onClick={onSendAll}>
            Send All
          </button>
          <button 
            style={{ ...styles.secondaryButton, borderColor: "rgba(255,255,255,0.3)" }} 
            onClick={() => setIsSelectionMode(false)}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}