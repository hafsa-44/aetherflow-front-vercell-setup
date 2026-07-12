

import React, { useState, useEffect } from 'react';
import api from '../../../api'; // same api instance used elsewhere in the app (adjust path if needed)

// ─── Types ────────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
  role: 'owner' | 'manager' | 'member';
  isYou: boolean;
  online: boolean;
}

/** Minimal shape Sidebar needs — matches ProjectMemberInfo from useProjectMembers. */
interface RawMember {
  id: string;
  name: string;
  handle: string;
  role: 'owner' | 'manager' | 'member';
  isYou: boolean;
}

interface SidebarProps {
  projectId?: string;
  currentUserId?: string;
  onlineUserIds?: Set<string>; // pass in from useBoardSync's `presence` if you want live status
  /** Optional — pass this in from useProjectMembers() at the board level to skip a duplicate fetch. */
  members?: RawMember[];
  membersLoading?: boolean;
  membersError?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PALETTE = ['#4f8ef7', '#3de0a0', '#f5c542', '#f97316', '#a78bfa', '#f472b6'];
const colorFor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};
const initialsFor = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

// ─── Avatar circle with status dot ────────────────────────────────────────────
const Avatar: React.FC<{ m: Member }> = ({ m }) => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: m.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff',
      boxShadow: (m.role === 'owner' || m.role === 'manager') ? `0 0 0 2px ${m.color}, 0 0 10px ${m.color}60` : `0 0 0 2px #1e2030`,
    }}>
      {m.initials}
    </div>
    <div style={{
      position: 'absolute', bottom: 1, right: 1,
      width: 9, height: 9, borderRadius: '50%',
      background: m.online ? '#3de0a0' : '#3d4060',
      border: '2px solid #13141c',
      boxShadow: m.online ? '0 0 5px #3de0a0' : 'none',
    }} />
  </div>
);

// ─── Pill badge ───────────────────────────────────────────────────────────────
const Badge: React.FC<{ label: string; bg: string; color: string }> = ({ label, bg, color }) => (
  <span style={{
    fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
    background: bg, color, borderRadius: 3,
    padding: '1px 5px', flexShrink: 0,
  }}>{label}</span>
);

// ─── Member row ───────────────────────────────────────────────────────────────
const MemberRow: React.FC<{ member: Member }> = ({ member }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', borderRadius: 8,
  }}>
    <Avatar m={member} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.isYou ? 'You' : member.name}
        </span>
        {member.role === 'owner' && <Badge label="OWNER" bg="rgba(245,197,66,0.15)" color="#f5c542" />}
        {member.role === 'manager' && <Badge label="MGR" bg="rgba(79,142,247,0.15)" color="#4f8ef7" />}
        {member.isYou && <Badge label="YOU" bg="rgba(61,224,160,0.15)" color="#3de0a0" />}
      </div>
      <div style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>{member.handle}</div>
    </div>
    <span style={{ fontSize: 9, color: member.online ? '#3de0a0' : '#484f58', fontWeight: 700, flexShrink: 0 }}>
      {member.online ? 'online' : 'offline'}
    </span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({ projectId, currentUserId, onlineUserIds, members: externalMembers, membersLoading, membersError }) => {
  const [fetchedMembers, setFetchedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const usingExternal = externalMembers !== undefined;

  useEffect(() => {
    if (usingExternal) return; // parent already fetched — don't double-call the API
    if (!projectId) { setLoading(false); return; }
    let cancelled = false;

    api.get(`/projects/${projectId}/members`)
      .then(({ data }) => {
        if (cancelled) return;
        const mapped: Member[] = data.map((m: any) => ({
          id:       m.userId,
          name:     m.name,
          handle:   m.email ? `@${m.email.split('@')[0]}` : '',
          initials: initialsFor(m.name ?? '?'),
          color:    colorFor(m.userId),
          role:     m.role === 'owner' ? 'owner' : m.role === 'manager' ? 'manager' : 'member',
          isYou:    m.userId === currentUserId,
          online:   onlineUserIds?.has(m.userId) ?? false,
        }));
        setFetchedMembers(mapped);
      })
      .catch(err => { if (!cancelled) setLoadError(err?.message ?? 'Failed to load team'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId, currentUserId, onlineUserIds, usingExternal]);

  const members: Member[] = usingExternal
    ? (externalMembers ?? []).map(m => ({
        ...m,
        initials: initialsFor(m.name ?? '?'),
        color: colorFor(m.id),
        online: onlineUserIds?.has(m.id) ?? false,
      }))
    : fetchedMembers;
  const isLoading = usingExternal ? (membersLoading ?? false) : loading;
  const loadErr = usingExternal ? (membersError ?? null) : loadError;

  const onlineCount = members.filter(m => m.online).length;

  return (
    <div style={{
      width: 235, minWidth: 235,
      background: '#161b22',
      borderRight: '1px solid #21262d',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ══ Header ══ */}
      <div style={{ padding: '10px 12px 9px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: '#484f58', textTransform: 'uppercase' }}>
            Team
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3de0a0', boxShadow: '0 0 5px #3de0a0' }} />
            <span style={{ fontSize: 9, color: '#3de0a0', fontWeight: 700 }}>{onlineCount} online</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#484f58' }}>{members.length} member{members.length === 1 ? '' : 's'}</div>
      </div>

      {/* ══ List ══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 8px' }}>
        {isLoading && (
          <div style={{ padding: '20px 12px', fontSize: 11, color: '#484f58', textAlign: 'center' }}>Loading team…</div>
        )}
        {!isLoading && loadErr && (
          <div style={{ padding: '20px 12px', fontSize: 11, color: '#f85149', textAlign: 'center' }}>{loadErr}</div>
        )}
        {!isLoading && !loadErr && members.length === 0 && (
          <div style={{ padding: '20px 12px', fontSize: 11, color: '#484f58', textAlign: 'center' }}>No members found.</div>
        )}
        {!isLoading && !loadErr && members.map(m => <MemberRow key={m.id} member={m} />)}
      </div>
    </div>
  );
};

export default Sidebar;
