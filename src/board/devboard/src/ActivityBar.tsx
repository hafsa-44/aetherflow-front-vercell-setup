import React from 'react';
import { ActivitySection } from './types';

interface ActivityBarProps {
  active: ActivitySection;
  onChange: (section: ActivitySection) => void;
  onRun?: () => void;
  onTerminal?: () => void;
}

const navItems: { id: ActivitySection; icon: string; label: string }[] = [
  { id: 'dashboard',  icon: '⌂',        label: 'Dashboard' },
  { id: 'modules',    icon: '▣',        label: 'Modules' },
  { id: 'tasks',      icon: '☰',        label: 'Tasks' },
   { id: 'ai',         icon: '◈',        label: 'AI Assistant' },
  { id: 'analytics',  icon: '⬡',        label: 'Analytics' },
];

const ActivityBar: React.FC<ActivityBarProps> = ({ active, onChange, onRun, onTerminal }) => {
  return (
    <div className="activity-bar">
      {/* Nav Icons */}
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`act-icon ${active === item.id ? 'active' : ''}`}
          title={item.label}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {active === item.id && <span className="act-indicator" />}
        </button>
      ))}

      <div className="act-spacer" />

      {/* Run Button */}
      <button
        className="act-icon act-run"
        title="Run (▶)"
        onClick={onRun}
      >
        ▶
      </button>

      {/* Terminal Button */}
      <button
        className="act-icon act-terminal"
        title="Terminal (>_)"
        onClick={onTerminal}
      >
        <span className="terminal-icon">&gt;_</span>
      </button>

      {/* Settings */}
      <button className="act-icon act-settings" title="Settings" id='ai'>
        ✦
      </button>
    </div>
  );
};

export default ActivityBar;
