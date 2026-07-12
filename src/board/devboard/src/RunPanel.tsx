import React, { useState, useEffect } from 'react';

interface RunPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

interface RunLog {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'OK';
  msg: string;
}

const RunPanel: React.FC<RunPanelProps> = ({ isVisible, onClose }) => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const startRun = () => {
    setRunning(true);
    setLogs([]);
    setAccuracy(null);

    const steps: [number, RunLog][] = [
      [200,  { time: '00:00.1', level: 'INFO',  msg: 'Initializing pipeline...' }],
      [500,  { time: '00:00.5', level: 'INFO',  msg: 'Loading dataset: production' }],
      [900,  { time: '00:00.9', level: 'INFO',  msg: 'Applying filters...' }],
      [1200, { time: '00:01.2', level: 'WARN',  msg: 'nom_process_data assertion warning' }],
      [1600, { time: '00:01.6', level: 'INFO',  msg: 'Running validation...' }],
      [2000, { time: '00:02.0', level: 'OK',    msg: 'Pipeline complete — accuracy: 87%' }],
    ];

    steps.forEach(([delay, log]) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, log]);
        if (log.level === 'OK') {
          setRunning(false);
          setAccuracy(87);
        }
      }, delay);
    });
  };

  if (!isVisible) return null;

  return (
    <div className="run-panel">
      <div className="run-panel-header">
        <div className="run-tabs">
          <span className="run-tab active">▶ Run Output</span>
          <span className="run-tab">📊 Metrics</span>
        </div>
        <div className="run-actions">
          <button
            className={`run-start-btn ${running ? 'running' : ''}`}
            onClick={startRun}
            disabled={running}
            title="Run pipeline"
          >
            {running ? '⏳ Running...' : '▶ Run'}
          </button>
          <button className="term-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      <div className="run-body">
        {logs.length === 0 && !running && (
          <div className="run-empty">Press ▶ Run to execute the pipeline</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className={`run-log run-log-${log.level.toLowerCase()}`}>
            <span className="run-time">{log.time}</span>
            <span className={`run-badge run-${log.level.toLowerCase()}`}>{log.level}</span>
            <span className="run-msg">{log.msg}</span>
          </div>
        ))}
        {running && (
          <div className="run-spinner-row">
            <span className="run-spinner">◌</span> Processing...
          </div>
        )}
        {accuracy !== null && (
          <div className="run-result">
            <span className="run-result-label">Accuracy</span>
            <span className="run-result-val">{accuracy}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunPanel;
