// // ─── Primitive domain types ──────────────────────────────────────────────────

// /** All possible module lifecycle states. */
// export type ModuleStatus =
//   | 'live'      // actively running / streaming data
//   | 'idle'      // paused, waiting for trigger
//   | 'complete'  // finished successfully
//   | 'error'     // terminated with an error
//   | 'planning'; // not yet started

// /** A single processing module in the AetherFlow pipeline. */
// export interface Module {
//   id: string;
//   name: string;
//   status: ModuleStatus;
//   /** 0–100 completion percentage */
//   progress: number;
//   /** Optional ISO timestamp of last update */
//   updatedAt?: string;
// }

// // ─── Editor / file types ─────────────────────────────────────────────────────

// /** Languages supported by the code editor. */
// export type EditorLanguage = 'python' | 'javascript' | 'typescript' | 'css';

// /** One open editor tab. */
// export interface Tab {
//   id: string;
//   filename: string;
//   language: EditorLanguage;
//   isActive: boolean;
//   /** True when the file has unsaved changes. */
//   isModified?: boolean;
//   /** Optional path relative to project root. */
//   filePath?: string;
// }

// // ─── Terminal / logging types ─────────────────────────────────────────────────

// /** Structured log entry emitted by the AI panel. */
// export interface LogEntry {
//   /** Short tag shown as a coloured badge. */
//   tag: 'INF' | 'DBC' | 'IMP' | 'D02' | 'OOD' | 'ERR';
//   message: string;
//   /** ISO timestamp; defaults to 'now' when omitted. */
//   timestamp?: string;
// }

// // ─── Navigation types ─────────────────────────────────────────────────────────

// /** Top-level sections reachable via the ActivityBar. */
// export type ActivitySection =
//   | 'dashboard'
//   | 'modules'
//   | 'tasks'
//   | 'ai'
//   | 'analytics'
//   | 'settings';

// // ─── Pipeline / run types ─────────────────────────────────────────────────────

// /** Severity levels produced by the run panel. */
// export type RunLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'OK';

// /** One line in the Run Output panel. */
// export interface RunLog {
//   /** Human-readable elapsed time, e.g. "00:01.4" */
//   time: string;
//   level: RunLogLevel;
//   msg: string;
// }
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

