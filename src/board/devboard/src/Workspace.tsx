import React from 'react';
import CodeEditor from './CodeEditor';
import Terminal from './Terminal';
import RunPanel from './RunPanel';

interface WorkspaceProps {
  showTerminal: boolean;
  showRunPanel: boolean;
  onCloseTerminal: () => void;
  onCloseRunPanel: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
  showTerminal,
  showRunPanel,
  onCloseTerminal,
  onCloseRunPanel,
}) => {
  return (
    <div className="workspace">
      {/* Code Editor — always shown */}
      <CodeEditor />

      {/* Run Panel */}
      {showRunPanel && (
        <RunPanel isVisible={showRunPanel} onClose={onCloseRunPanel} />
      )}

      {/* Terminal Panel */}
      {showTerminal && (
        <Terminal isVisible={showTerminal} onClose={onCloseTerminal} />
      )}
    </div>
  );
};

export default Workspace;
