
// src/board/devboard/src/devboard.tsx
//
// Integration point between the planning/design board (Board.tsx) and the
// devboard's internal components.
//
// Usage in Board.tsx:
//   import DevBoard from "../../devboard/src/devboard";
//   import type { DevFileItem, DevTheme } from "../../devboard/src/devboard";
//   ...
//   <DevBoard
//     projectId={projectId}
//     initialFiles={(phaseData.devFiles ?? []) as DevFileItem[]}
//     onFilesChange={setDevFiles}
//     initialTheme={(phaseData.devTheme?.[0] as DevTheme) ?? 'my-dark'}
//     onThemeChange={setDevTheme}
//     currentUserId={currentUser?._id}
//     currentUserName={currentUser?.name}
//     onlineUserIds={new Set(presence.map(p => p.userId))}
//   />

import Development from './dev';
import type { FileItem, Theme } from './CodeEditor';

export type DevFileItem = FileItem;
export type DevTheme = Theme;

interface DevBoardProps {
  projectId?: string;
  initialFiles?: DevFileItem[];
  onFilesChange?: (files: DevFileItem[]) => void;
  initialTheme?: DevTheme;
  onThemeChange?: (theme: DevTheme) => void;
  currentUserId?: string;
  currentUserName?: string;
  onlineUserIds?: Set<string>;
}

export default function DevBoard({
  projectId, initialFiles, onFilesChange, initialTheme, onThemeChange,
  currentUserId, currentUserName, onlineUserIds,
}: DevBoardProps) {
  return (
    <Development
      projectId={projectId}
      initialFiles={initialFiles}
      onFilesChange={onFilesChange}
      initialTheme={initialTheme}
      onThemeChange={onThemeChange}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      onlineUserIds={onlineUserIds}
    />
  );
}
