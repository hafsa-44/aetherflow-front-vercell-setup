import { useState, useEffect } from 'react';
import api from '../../../api'; // same api instance used elsewhere in the app (adjust path if needed)

export type ProjectRole = 'owner' | 'manager' | 'member';

export interface ProjectMemberInfo {
  id: string;
  name: string;
  handle: string;
  role: ProjectRole;
  isYou: boolean;
}

/**
 * Fetches /projects/:id/members ONCE per projectId and derives the current
 * user's role from the same response — this is the single source of truth
 * that both Sidebar (who's online) and CodeEditor (who can edit what) read
 * from, so there's no drift between "what the sidebar shows" and "what
 * permissions are enforced".
 */
export function useProjectMembers(projectId?: string, currentUserId?: string) {
  const [members, setMembers] = useState<ProjectMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    let cancelled = false;

    api.get(`/projects/${projectId}/members`)
      .then(({ data }) => {
        if (cancelled) return;
        const mapped: ProjectMemberInfo[] = data.map((m: any) => ({
          id: m.userId,
          name: m.name,
          handle: m.email ? `@${m.email.split('@')[0]}` : '',
          role: (m.role === 'owner' ? 'owner' : m.role === 'manager' ? 'manager' : 'member') as ProjectRole,
          isYou: m.userId === currentUserId,
        }));
        setMembers(mapped);
      })
      .catch(err => { if (!cancelled) setError(err?.message ?? 'Failed to load team'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId, currentUserId]);

  const currentUserRole: ProjectRole =
    members.find(m => m.id === currentUserId)?.role ?? 'member';

  return { members, loading, error, currentUserRole };
}
