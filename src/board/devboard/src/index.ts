export type ModuleStatus = 'live' | 'idle' | 'complete' | 'error' | 'planning';

export interface Module {
  id: string;
  name: string;
  status: ModuleStatus;
  progress: number;
}

export interface Tab {
  id: string;
  filename: string;
  language: 'python' | 'javascript' | 'typescript' | 'css';
  isActive: boolean;
  isModified?: boolean;
}

export interface LogEntry {
  tag: 'INF' | 'DBC' | 'IMP' | 'D02' | 'OOD' | 'ERR';
  message: string;
}

export type ActivitySection = 'dashboard' | 'modules' | 'tasks' | 'ai' | 'analytics' | 'settings';
