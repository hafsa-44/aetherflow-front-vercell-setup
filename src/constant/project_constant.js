// ─────────────────────────────────────────────────────────────
// src/constants/project.js
//
// Single source of truth for all project-related constants.
// Import from here — never define these inline in components.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Development",
  "Design",
  "Marketing",
  "Research",
  "Sales",
  "Other",
];

export const PROJECT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6BCB77",
  "#4D96FF", "#FF6BBF", "#A855F7", "#F97316",
];
export const ROLES = {
  manager: {
    label:       "Manager",
    description: "Can manage the team, invite members, and advance project phases.",
  },
  developer: {
    label:       "Developer",
    description: "Full board access including the development environment and terminal.",
  },
  designer: {
    label:       "Designer",
    description: "Planning and design access only. No development board.",
  },
  viewer: {
    label:       "Viewer",
    description: "Read-only access across all phases.",
  },
};
{/*export const ROLES = {
  manager: {
    label: "Manager",
    description: "Can manage tasks, invite members, edit settings",
  },
  member: {
    label: "Member",
    description: "Can view and update tasks only",
  },
};
*/}
export const VALID_ROLES = ["manager", "member"];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a random color from PROJECT_COLORS */
export function randomColor() {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
}

/** Maps a backend error message string to the field it refers to.
 *  Returns the field key (matches formData keys) or null for generic errors.
 */
export function mapErrorToField(message = "") {
  const m = message.toLowerCase();
  if (m.includes("name"))        return "name";
  if (m.includes("category"))    return "category";
  if (m.includes("deadline"))    return "deadline";
  if (m.includes("description")) return "description";
  return null;
}