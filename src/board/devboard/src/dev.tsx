

//new file content for 
//new file content for 
import { useState } from 'react';
import type { ActivitySection } from './index';
import ActivityBar from './ActivityBar';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import CodeEditor, { type FileItem, type Theme } from './CodeEditor';
import Terminal from './Terminal';
import AIPanel from './AIPanelree';
import StatusBar from './StatusBar';
import { useProjectMembers } from './useProjectMembers';

interface DevelopmentProps {
  projectId?: string;
  initialFiles?: FileItem[];
  onFilesChange?: (files: FileItem[]) => void;
  initialTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  currentUserId?: string;
  currentUserName?: string;
  onlineUserIds?: Set<string>;
}

export default function Development({
  projectId, initialFiles, onFilesChange, initialTheme, onThemeChange,
  currentUserId, currentUserName, onlineUserIds,
}: DevelopmentProps) {
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeSection, setActiveSection] = useState<ActivitySection>('modules');

  const { members, loading: membersLoading, error: membersError, currentUserRole } =
    useProjectMembers(projectId, currentUserId);

  const tasksRunning = 1;
  const aiActive = activeSection === 'ai';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        #root {
          width: 100% !important; max-width: 100% !important;
          margin: 0 !important; padding: 0 !important;
          border: none !important; text-align: left !important;
          min-height: 100svh; height: 100svh;
          display: flex !important; flex-direction: column !important;
          background: #0d1117; color: #b4bac8;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px; overflow: hidden;
        }
        h1, h2, h3, p { margin: 0; }

        .app-shell { display: flex; flex-direction: column; width: 100%; height: 100svh; overflow: hidden; background: #0d1117; }

        .topbar {
          display: flex; align-items: center; gap: 10px;
          height: 44px; min-height: 44px; padding: 0 14px;
          background: #161b22; border-bottom: 1px solid #21262d;
          flex-shrink: 0; z-index: 20;
        }
        .topbar-left { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
        .logo-mark {
          width: 28px; height: 28px;
          background: #161b22; border-bottom: 1px solid #21262d;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: #fff; letter-spacing: -0.5px;
          box-shadow: 0 0 14px rgba(110,64,201,0.45);
        }
        .app-title { font-size: 14px; font-weight: 700; color: #e6edf3; letter-spacing: -0.3px; }
        .search-bar {
          flex: 1; display: flex; align-items: center; gap: 8px;
          background: #0d1117; border: 1px solid #30363d;
          border-radius: 8px; padding: 0 12px; height: 30px;
          max-width: 420px; margin: 0 auto;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .search-bar:focus-within { border-color: #4f8ef7; box-shadow: 0 0 0 3px rgba(79,142,247,0.12); }
        .search-icon { color: #484f58; font-size: 13px; }
        .search-input { background: none; border: none; outline: none; color: #b4bac8; font-size: 12px; width: 100%; }
        .search-input::placeholder { color: #484f58; }
        .search-kbd {
          font-size: 10px; color: #484f58;
          background: #21262d; border-radius: 4px; padding: 1px 5px;
          font-family: 'JetBrains Mono', monospace;
        }
        .topbar-right { display: flex; align-items: center; gap: 5px; margin-left: auto; }
        .topbar-icon {
          background: none; border: 1px solid #30363d; border-radius: 7px;
          cursor: pointer; color: #8b949e; font-size: 13px; padding: 4px 8px;
          display: flex; align-items: center;
          transition: background 0.12s, color 0.12s;
        }
        .topbar-icon:hover { background: #21262d; color: #e6edf3; }
        .avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #6e40c9, #4f8ef7);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff; cursor: pointer;
          box-shadow: 0 0 0 2px #30363d;
        }
        .topbar-chevron { color: #484f58; font-size: 11px; }

        .app-body { display: flex; flex-direction: row; flex: 1; overflow: hidden; min-height: 0; }

        .activity-bar {
          display: flex; flex-direction: column; align-items: center;
          width: 48px; min-width: 48px;
          background: #161b22; border-right: 1px solid #21262d;
          padding: 8px 0; gap: 2px; flex-shrink: 0; overflow: hidden;
        }
        .act-icon {
          width: 36px; height: 36px; background: none; border: none;
          border-radius: 8px; cursor: pointer; color: #484f58;
          font-size: 17px; display: flex; align-items: center; justify-content: center;
          position: relative; transition: background 0.12s, color 0.12s; flex-shrink: 0;
        }
        .act-icon:hover { background: #21262d; color: #8b949e; }
        .act-icon.active { color: #4f8ef7; background: rgba(79,142,247,0.1); }
        .act-icon.active::before {
          content: ''; position: absolute; left: -1px; top: 50%;
          transform: translateY(-50%); width: 3px; height: 20px;
          background: linear-gradient(180deg, #6e40c9, #4f8ef7);
          border-radius: 0 3px 3px 0;
        }
        .act-indicator { display: none; }
        .act-spacer { flex: 1; }
        .act-run { color: #3fb950 !important; }
        .act-run:hover { background: rgba(63,185,80,0.1) !important; }
        .act-terminal { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; }
        .terminal-icon { font-family: 'JetBrains Mono', monospace; font-size: 11px; }

        .main-column { display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden; background: #0d1117; }

        .terminal-panel {
          border-top: 1px solid #21262d; background: #0d1117;
          display: flex; flex-direction: column; height: 190px; flex-shrink: 0;
        }
        .terminal-header {
          display: flex; align-items: center; padding: 0 12px;
          height: 36px; min-height: 36px; border-bottom: 1px solid #21262d;
          gap: 6px; flex-shrink: 0; background: #161b22;
        }
        .terminal-tabs { display: flex; gap: 2px; flex: 1; }
        .terminal-tab {
          padding: 0 12px; height: 36px; display: flex; align-items: center;
          font-size: 11px; color: #484f58; cursor: pointer;
          border-bottom: 2px solid transparent;
          font-family: 'JetBrains Mono', monospace;
        }
        .terminal-tab.active { color: #e6edf3; border-bottom-color: #4f8ef7; }
        .terminal-tab:hover { color: #8b949e; }
        .terminal-actions { display: flex; gap: 2px; }
        .term-btn { background: none; border: none; cursor: pointer; color: #484f58; font-size: 12px; padding: 3px 6px; border-radius: 5px; }
        .term-btn:hover { background: #21262d; color: #8b949e; }
        .terminal-body {
          flex: 1; overflow-y: auto; padding: 8px 14px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px; cursor: text; line-height: 1.7;
        }
        .terminal-body::-webkit-scrollbar { width: 4px; }
        .terminal-body::-webkit-scrollbar-thumb { background: #21262d; border-radius: 2px; }
        .term-line { }
        .term-info { color: #484f58; }
        .term-output { color: #b4bac8; }
        .term-error { color: #f85149; }
        .term-input { color: #3fb950; }
        .term-input-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .term-prompt { color: #3fb950; flex-shrink: 0; }
        .term-input:not(.term-line) {
          background: none; border: none; outline: none; color: #e6edf3;
          font-family: inherit; font-size: inherit; flex: 1; caret-color: #4f8ef7; width: 100%;
        }

        .ai-panel {
          display: flex; flex-direction: column;
          width: 240px; min-width: 240px;
          background: #161b22; border-left: 1px solid #21262d;
          flex-shrink: 0; overflow: hidden;
        }
        .ai-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px 8px; font-size: 10px; font-weight: 700;
          letter-spacing: 1.2px; color: #484f58; text-transform: uppercase; flex-shrink: 0;
        }
        .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: #3fb950; box-shadow: 0 0 6px #3fb950; }
        .ai-input-wrap { display: flex; gap: 5px; padding: 0 8px 8px; flex-shrink: 0; }
        .ai-input {
          flex: 1; background: #0d1117; border: 1px solid #30363d;
          border-radius: 6px; padding: 5px 9px; color: #b4bac8;
          font-size: 12px; outline: none;
        }
        .ai-input::placeholder { color: #484f58; }
        .ai-input:focus { border-color: #4f8ef7; }
        .ai-send { background: linear-gradient(135deg, #6e40c9, #4f8ef7); border: none; border-radius: 6px; color: #fff; font-size: 12px; cursor: pointer; padding: 0 10px; font-weight: 600; }
        .ai-send:hover { opacity: 0.9; }
        .ai-suggestions { padding: 0 8px 8px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .ai-suggestion-btn {
          background: #1c2128; border: 1px solid #30363d; border-radius: 6px;
          color: #8b949e; font-size: 11px; cursor: pointer; padding: 6px 9px;
          text-align: left; transition: background 0.12s, color 0.12s;
        }
        .ai-suggestion-btn:hover { background: #21262d; color: #b4bac8; }
        .ai-logs-tabs { display: flex; border-bottom: 1px solid #21262d; flex-shrink: 0; }
        .ai-tab { flex: 1; padding: 6px 0; font-size: 11px; color: #484f58; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; }
        .ai-tab.active { color: #e6edf3; border-bottom-color: #4f8ef7; }
        .ai-logs { flex: 1; overflow-y: auto; padding: 7px 8px; display: flex; flex-direction: column; gap: 3px; }
        .ai-logs::-webkit-scrollbar { width: 3px; }
        .ai-logs::-webkit-scrollbar-thumb { background: #21262d; border-radius: 2px; }
        .log-line { display: flex; align-items: flex-start; gap: 6px; }
        .log-tag { font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; margin-top: 1px; font-family: 'JetBrains Mono', monospace; }
        .log-text { font-size: 11px; color: #8b949e; line-height: 1.5; }
        .ai-action-row { display: flex; gap: 6px; padding: 8px; flex-shrink: 0; }
        .ai-action-btn { flex: 1; padding: 6px 0; font-size: 11px; border-radius: 6px; border: 1px solid; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
        .ai-action-btn.run { background: rgba(63,185,80,0.08); border-color: rgba(63,185,80,0.3); color: #3fb950; }
        .ai-action-btn.run:hover:not(:disabled) { background: rgba(63,185,80,0.15); }
        .ai-action-btn.run:disabled { opacity: 0.4; cursor: not-allowed; }
        .ai-action-btn.test { background: rgba(79,142,247,0.08); border-color: rgba(79,142,247,0.3); color: #4f8ef7; }
        .ai-action-btn.test:hover { background: rgba(79,142,247,0.15); }
        .ai-test-input-wrap { padding: 0 8px 8px; flex-shrink: 0; }
        .ai-test-label { font-size: 10px; color: #484f58; margin-bottom: 3px; }
        .ai-test-input {
          width: 100%; background: #0d1117; border: 1px solid #30363d;
          border-radius: 6px; padding: 5px 9px; color: #b4bac8;
          font-size: 11px; outline: none; font-family: 'JetBrains Mono', monospace;
        }
        .ai-test-input::placeholder { color: #484f58; }

        .statusbar {
          display: flex; flex-direction: row; align-items: center;
          height: 24px; min-height: 24px; padding: 0 6px;
          background: linear-gradient(90deg, #6e40c9 0%, #4f8ef7 100%);
          flex-shrink: 0; gap: 0; font-size: 11px;
          color: rgba(255,255,255,0.9); overflow: hidden;
          font-weight: 500;
        }
        .status-item { display: flex; align-items: center; gap: 5px; padding: 0 9px; height: 100%; cursor: default; white-space: nowrap; flex-shrink: 0; }
        .status-item:hover { background: rgba(0,0,0,0.18); }
        .status-run-btn, .status-term-btn { cursor: pointer; }
        .status-dot-sm { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .status-dot-sm.live { background: #3fb950; box-shadow: 0 0 5px #3fb950; }
        .status-dot-sm.idle { background: rgba(255,255,255,0.4); }
        .status-sep { flex: 1; }
        .status-accuracy { display: flex; align-items: center; gap: 5px; padding: 0 9px; flex-shrink: 0; }
        .accuracy-val { font-weight: 700; color: #fff; }
        .status-sync { cursor: pointer; }
        .status-icon { font-size: 12px; }
        .status-logo { font-size: 15px; }
      `}</style>

      <div className="app-shell">
        <TopBar onSearch={() => { }} userName={currentUserName} />

        <div className="app-body">
          <ActivityBar
            active={activeSection}
            onChange={setActiveSection}
            onRun={() => { }}
            onTerminal={() => setShowTerminal(v => !v)}
          />

          {(activeSection === 'modules' || activeSection === 'tasks') && (
            <Sidebar
              projectId={projectId}
              currentUserId={currentUserId}
              onlineUserIds={onlineUserIds}
              members={members}
              membersLoading={membersLoading}
              membersError={membersError}
            />
          )}

          <div className="main-column">
            <CodeEditor
              initialFiles={initialFiles}
              onFilesChange={onFilesChange}
              initialTheme={initialTheme}
              onThemeChange={onThemeChange}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserRole={currentUserRole}
              members={members}
            />
            <Terminal
              isVisible={showTerminal}
              onClose={() => setShowTerminal(false)}
            />
          </div>

          {activeSection === 'ai' && <AIPanel projectId={projectId} />} 
        </div>

        <StatusBar
          mode="Dev Mode"
          aiActive={aiActive}
          tasksRunning={tasksRunning}
          accuracy={97}
          onToggleTerminal={() => setShowTerminal(v => !v)}
          onToggleRun={() => { }}
        />
      </div>
    </>
  );
}
