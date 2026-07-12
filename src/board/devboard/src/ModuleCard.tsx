import React from 'react';
import { Module } from './types';

interface ModuleCardProps {
  module: Module;
  isActive: boolean;
  onClick: (id: string) => void;
}

const statusColors: Record<string, string> = {
  live:     '#3de0a0',
  idle:     '#7a82a6',
  complete: '#4f8ef7',
  error:    '#ff5b5b',
  planning: '#f5c542',
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isActive, onClick }) => {
  const color = statusColors[module.status] ?? '#7a82a6';

  return (
    <div
      className={`module-card ${module.status} ${isActive ? 'active' : ''}`}
      onClick={() => onClick(module.id)}
      style={{ '--status-color': color } as React.CSSProperties}
    >
      <div className="module-name">{module.name}</div>
      <div className="module-meta">
        <span className="module-pct">{module.progress}%</span>
        <span
          className={`status-dot ${module.status}`}
          style={{ background: color, boxShadow: module.status === 'live' || module.status === 'error' ? `0 0 5px ${color}` : 'none' }}
        />
        <span className="status-label" style={{ color: module.status === 'idle' ? undefined : color }}>
          {module.status}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${module.progress}%`, background: color }}
        />
      </div>
    </div>
  );
};

export default ModuleCard;
