import React from 'react';

interface StatusBarProps {
  mode: string;
  aiActive: boolean;
  tasksRunning: number;
  accuracy: number;
  onToggleTerminal: () => void;
  onToggleRun: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  mode,
  aiActive,
  tasksRunning,
  accuracy,
  onToggleTerminal,
  onToggleRun,
}) => {
  return (
    <div className="statusbar">
      {/* Left items */}
      <div className="status-item status-logo" title="AetherFlow">
        <span>◈</span>
      </div>

      <div className="status-item" title="Current mode">
        <span className="status-icon">🧱</span>
        {mode}
      </div>

      <div className="status-item" title="AI status">
        <span className={`status-dot-sm ${aiActive ? 'live' : 'idle'}`} />
        AI {aiActive ? 'Active' : 'Idle'}
      </div>

      <div className="status-item" title="Running tasks">
        <span className="status-icon">📋</span>
        {tasksRunning} Tasks Running
      </div>

      {/* Run button in status bar */}
      <div
        className="status-item status-run-btn"
        title="Run pipeline (▶)"
        onClick={onToggleRun}
      >
        <span>▶</span> Run
      </div>

      {/* Terminal button in status bar */}
      <div
        className="status-item status-term-btn"
        title="Toggle Terminal (>_)"
        onClick={onToggleTerminal}
      >
        <span className="status-icon">&gt;_</span> Terminal
      </div>

      {/* Spacer */}
      <div className="status-sep" />

      {/* Right */}
      <div className="status-accuracy">
        <span>Accuracy:</span>
        <span className="accuracy-val">{accuracy}%</span>
      </div>

      <div className="status-item status-sync" title="Sync">🔄</div>
    </div>
  );
};

export default StatusBar;
