import React, { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info';
  text: string;
}

const INITIAL_LINES: TerminalLine[] = [
  { type: 'info',   text: 'AetherFlow Terminal v1.0.0' },
  { type: 'info',   text: 'Connected to: dev environment' },
  { type: 'output', text: '> python data_loader.py' },
  { type: 'output', text: '[INF] Pipeline initialized...' },
  { type: 'output', text: '[INF] Loading dataset: production' },
  { type: 'error',  text: '[ERR] nom_process_data: assertion failed at line 20' },
  { type: 'info',   text: 'Process exited with code 1' },
];

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ isVisible, onClose }) => {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isVisible, lines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const cmd = input.trim();
      setLines((prev) => [
        ...prev,
        { type: 'input',  text: `$ ${cmd}` },
        { type: 'output', text: simulateCommand(cmd) },
      ]);
      setHistory((h) => [cmd, ...h]);
      setHistoryIdx(-1);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      const idx = historyIdx + 1;
      if (idx < history.length) { setHistoryIdx(idx); setInput(history[idx]); }
    } else if (e.key === 'ArrowDown') {
      const idx = historyIdx - 1;
      if (idx >= 0) { setHistoryIdx(idx); setInput(history[idx]); }
      else { setHistoryIdx(-1); setInput(''); }
    }
  };

  const simulateCommand = (cmd: string): string => {
    if (cmd.startsWith('python')) return '[INF] Running... done (exit 0)';
    if (cmd === 'clear') { setLines([]); return ''; }
    if (cmd === 'ls') return 'data_loader.py  decision_engine.js  user_insight_model.py  analytics.css';
    if (cmd.startsWith('cd')) return '';
    return `command not found: ${cmd}`;
  };

  if (!isVisible) return null;

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          <span className="terminal-tab active">&gt;_ Terminal</span>
          <span className="terminal-tab">📋 Output</span>
          <span className="terminal-tab">⚠ Problems</span>
        </div>
        <div className="terminal-actions">
          <button className="term-btn" title="New terminal">＋</button>
          <button className="term-btn" title="Split terminal">⧉</button>
          <button className="term-btn" title="Clear">⊘</button>
          <button className="term-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
        {lines.map((line, i) => (
          <div key={i} className={`term-line term-${line.type}`}>
            {line.text}
          </div>
        ))}
        <div className="term-input-row">
          <span className="term-prompt">$</span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;
