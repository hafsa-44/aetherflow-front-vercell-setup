// components/MembersPanel.tsx
//
// Reads the FLAT member shape returned by GET /api/projects/:id/members:
//   { userId, name, email, profilePicture, role, joinedAt }
//
// Does NOT expect nested m.userId.name — that would require a different
// backend response. Keep the backend flat. This component adapts to it.

