
//new file 
// components/ProjectInquiryForm.tsx

/*import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { IoClose } from 'react-icons/io5';
import api from '../../../../api';

export interface ProjectForm {
  projectName:         string;
  description:         string;
  projectType:         string;
  color:               string;
  nature:              string;
  techStack:           string;
  targetUser:          string;
  purpose:             string;
  explanationDepth:    'beginner' | 'intermediate' | 'expert';
  learningOrientation: string;
  knownConstraints:    string;
  keyFeatures:         string;
  outOfScope:          string;
  boardSummary:        string;
}

const EMPTY_FORM: ProjectForm = {
  projectName:         '',
  description:         '',
  projectType:         '',
  color:               '',
  nature:              '',
  techStack:           '',
  targetUser:          '',
  purpose:             '',
  explanationDepth:    'intermediate',
  learningOrientation: '',
  knownConstraints:    '',
  keyFeatures:         '',
  outOfScope:          '',
  boardSummary:        '',
};

interface Props {
  projectId: string;
  onClose:   () => void;
  onDone:    (data: ProjectForm) => void;
}

export default function ProjectInquiryForm({ projectId, onClose, onDone }: Props) {
  const [formData, setFormData] = useState<ProjectForm>(EMPTY_FORM);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── Auto-fetch on open ────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    api.get(`/aiContext/${projectId}`)
      .then(res => {
        const data = res.data;
        setFormData({
          ...EMPTY_FORM,
          ...data,
          techStack:   Array.isArray(data.techStack)   ? data.techStack.join(', ')   : (data.techStack   ?? ''),
          keyFeatures: Array.isArray(data.keyFeatures)  ? data.keyFeatures.join(', ')  : (data.keyFeatures ?? ''),
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res  = await api.post('/aiContext', { ...formData, projectId });
      const saved = res.data;
      onDone({
        ...formData,
        techStack:   Array.isArray(saved.techStack)   ? saved.techStack.join(', ')   : formData.techStack,
        keyFeatures: Array.isArray(saved.keyFeatures)  ? saved.keyFeatures.join(', ')  : formData.keyFeatures,
      });
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2 style={s.title}>AI Context</h2>
            <p style={s.subtitle}>Define parameters for this project's AI assistance.</p>
          </div>
          <IoClose style={{ fontSize: '22px', cursor: 'pointer', opacity: 0.8 }} onClick={onClose} />
        </div>
      </header>

      {loading && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
          Loading project context…
        </div>
      )}

      {error && (
        <div style={s.errorBanner}>⚠ {error}</div>
      )}

      {!loading && (
        <form onSubmit={handleSubmit} style={s.formBody}>

          <div style={s.sectionLabel}>Project info (auto-filled)</div>
          <div style={s.readOnlyGrid}>
            <ReadOnly label="Name"   value={formData.projectName} />
            <ReadOnly label="Type"   value={formData.projectType} />
            <ReadOnly label="Nature" value={formData.nature} />
            <ReadOnly label="Color"  value={formData.color} icon={
              formData.color
                ? <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: formData.color, marginRight: 6, verticalAlign: 'middle' }} />
                : null
            } />
          </div>
          {formData.description && (
            <ReadOnly label="Description" value={formData.description} full />
          )}

          <div style={s.divider} />

          <div style={s.sectionLabel}>AI context fields</div>
          <div style={s.grid}>
            <Field label="Tech Stack">
              <input style={s.input} name="techStack" value={formData.techStack}
                placeholder="React, Node, MongoDB…" onChange={handleChange} />
              <span style={s.hint}>Comma-separated</span>
            </Field>
            <Field label="Target User">
              <input style={s.input} name="targetUser" value={formData.targetUser}
                placeholder="e.g. End users, Developers" onChange={handleChange} />
            </Field>
          </div>

          <Field label="Purpose & Goal">
            <textarea style={{ ...s.input, height: '76px', resize: 'vertical' }}
              name="purpose" value={formData.purpose}
              placeholder="What are we building and why?" onChange={handleChange} />
          </Field>

          <div style={s.grid}>
            <Field label="Explanation Depth">
              <select style={s.input} name="explanationDepth"
                value={formData.explanationDepth} onChange={handleChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </Field>
            <Field label="Learning Orientation">
              <input style={s.input} name="learningOrientation"
                value={formData.learningOrientation}
                placeholder="e.g. Concept-heavy, hands-on" onChange={handleChange} />
            </Field>
          </div>

          <Field label="Known Constraints">
            <input style={s.input} name="knownConstraints"
              value={formData.knownConstraints}
              placeholder="e.g. No external CSS, limited API quota" onChange={handleChange} />
          </Field>

          <div style={s.divider} />

          <div style={s.sectionLabel}>From planning board</div>
          <Field label="Key Features">
            <input style={s.input} name="keyFeatures" value={formData.keyFeatures}
              placeholder="Auth, Dashboard, PDF export…" onChange={handleChange} />
            <span style={s.hint}>Comma-separated</span>
          </Field>

          <div style={s.grid}>
            <Field label="Out of Scope">
              <input style={s.input} name="outOfScope" value={formData.outOfScope}
                placeholder="e.g. No mobile, no payments" onChange={handleChange} />
            </Field>
            <div />
          </div>

          <Field label="Board Summary">
            <textarea style={{ ...s.input, height: '68px', resize: 'vertical' }}
              name="boardSummary" value={formData.boardSummary}
              placeholder="Key decisions from the planning board…" onChange={handleChange} />
          </Field>

          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.cancelBtn} disabled={saving}>
              Cancel
            </button>
            <button type="submit" style={{ ...s.doneBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Done'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({
  label, value, full = false, icon,
}: { label: string; value: string; full?: boolean; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ ...s.field, ...(full ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={s.label}>{label}</label>
      <div style={s.readOnlyValue}>{icon}{value}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    overflow: 'hidden',
    fontFamily: '"Segoe UI", Roboto, sans-serif',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    backgroundColor: '#001F46',
    padding: '20px 24px',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  title:    { margin: 0, fontSize: '20px', fontWeight: 600 },
  subtitle: { margin: '4px 0 0', fontSize: '13px', opacity: 0.75 },
  formBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '-6px',
  },
  divider:      { borderTop: '1px solid #F3F4F6', margin: '4px 0' },
  grid:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  readOnlyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  field:        { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:        { fontSize: '13px', fontWeight: 600, color: '#001F46' },
  input: {
    padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    backgroundColor: '#FAFAFA', transition: 'border-color 0.15s',
  },
  readOnlyValue: {
    padding: '8px 12px', background: '#F3F4F6', borderRadius: '8px',
    fontSize: '13px', color: '#374151', border: '1px solid #E5E7EB',
  },
  hint: { fontSize: '11px', color: '#9CA3AF', marginTop: '-2px' },
  footer: {
    marginTop: '8px', display: 'flex', justifyContent: 'flex-end',
    gap: '10px', borderTop: '1px solid #F3F4F6', paddingTop: '18px',
  },
  cancelBtn: {
    padding: '9px 18px', borderRadius: '8px', border: '1px solid #D1D5DB',
    backgroundColor: 'white', color: '#4B5563', fontWeight: 500,
    cursor: 'pointer', fontSize: '14px',
  },
  doneBtn: {
    padding: '9px 22px', borderRadius: '8px', border: 'none',
    backgroundColor: '#0056D2', color: 'white', fontWeight: 600,
    cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,86,210,0.25)',
  },
  errorBanner: {
    margin: '12px 24px 0', padding: '10px 14px', background: '#FEF2F2',
    border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626',
  },
};*/
//the exchange content of this file 
// components/ProjectInquiryForm.tsx
// components/ProjectInquiryForm.tsx
// Refactored: responsive layout, CSS-in-JS replaced with injected stylesheet,
// useCallback on handlers, memoised EMPTY_FORM outside component.
// components/ProjectInquiryForm.tsx
// Refactored: responsive layout, CSS-in-JS replaced with injected stylesheet,
// useCallback on handlers, memoised EMPTY_FORM outside component.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { IoClose } from 'react-icons/io5';
import api from '../../../../api';

/* ─── Types ──────────────────────────────────────────────────────── */
export interface ProjectForm {
  projectName:         string;
  description:         string;
  projectType:         string;
  color:               string;
  nature:              string;
  techStack:           string;
  targetUser:          string;
  purpose:             string;
  explanationDepth:    'beginner' | 'intermediate' | 'expert';
  learningOrientation: string;
  knownConstraints:    string;
  keyFeatures:         string;
  outOfScope:          string;
  boardSummary:        string;
}

interface Props {
  projectId: string;
  onClose:   () => void;
  onDone:    (data: ProjectForm) => void;
}

/* ─── Constants (outside component — no re-creation on render) ───── */
const EMPTY_FORM: ProjectForm = {
  projectName:         '',
  description:         '',
  projectType:         '',
  color:               '',
  nature:              '',
  techStack:           '',
  targetUser:          '',
  purpose:             '',
  explanationDepth:    'intermediate',
  learningOrientation: '',
  knownConstraints:    '',
  keyFeatures:         '',
  outOfScope:          '',
  boardSummary:        '',
};

/* ─── Stylesheet injection ─────────────────────────────────────────── */
const STYLE_ID = 'pif-styles';
const CSS = `
  /* ── Outer positioner: the component controls its own offset ── */
  .pif-outer {
    width: 100%;
    max-width: 560px;
    margin: 56px auto 0;        /* 56px clears the black top bar */
    padding: 0 12px 24px;
    box-sizing: border-box;
  }

  .pif-wrap {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    font-family: "Segoe UI", system-ui, sans-serif;
    max-height: calc(100vh - 72px);   /* 72px = 56px top offset + 16px breathing room */
    display: flex;
    flex-direction: column;
    width: 100%;
    box-shadow: 0 12px 40px rgba(0,31,70,0.16);
  }

  /* ── Header ── */
  .pif-header {
    background: #001F46;
    padding: 18px 20px;
    color: #fff;
    border-radius: 16px 16px 0 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }
  .pif-title { margin: 0; font-size: clamp(16px, 2.5vw, 20px); font-weight: 700; letter-spacing: -0.01em; }
  .pif-sub   { margin: 3px 0 0; font-size: 13px; opacity: .72; }
  .pif-close {
    background: rgba(255,255,255,0.12);
    border: none; border-radius: 8px;
    color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    padding: 5px; flex-shrink: 0;
    transition: background 0.15s;
  }
  .pif-close:hover { background: rgba(255,255,255,0.22); }

  /* ── Scrollable body ── */
  .pif-body {
    overflow-y: auto;
    flex: 1;
    overscroll-behavior: contain;
  }

  /* ── Form ── */
  .pif-form {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Section labels ── */
  .pif-section {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9CA3AF;
    margin: 0 0 -8px;
  }

  .pif-divider { border: none; border-top: 1px solid #F0F1F3; margin: 2px 0; }

  /* ── Grids ── */
  .pif-grid-2  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .pif-ro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  /* ── Field ── */
  .pif-field { display: flex; flex-direction: column; gap: 5px; }
  .pif-label { font-size: 13px; font-weight: 600; color: #001F46; }
  .pif-hint  { font-size: 11px; color: #9CA3AF; margin-top: -2px; }

  /* ── Controls ── */
  .pif-input, .pif-select, .pif-textarea {
    padding: 9px 12px;
    border: 1.5px solid #D1D5DB;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    background: #FAFAFA;
    color: #111827;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    box-sizing: border-box;
  }
  .pif-input:focus, .pif-select:focus, .pif-textarea:focus {
    border-color: #0056D2;
    box-shadow: 0 0 0 3px rgba(0,86,210,0.1);
    background: #fff;
  }
  .pif-textarea { resize: vertical; min-height: 76px; }

  /* ── Read-only pill ── */
  .pif-ro {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px;
    background: #F3F4F6;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 13px;
    color: #374151;
    min-height: 36px;
  }
  .pif-ro-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }

  /* ── Sticky footer ── */
  .pif-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid #F0F1F3;
    background: #fff;
    flex-shrink: 0;
  }
  .pif-btn-cancel {
    padding: 9px 18px;
    border-radius: 8px;
    border: 1.5px solid #D1D5DB;
    background: #fff;
    color: #4B5563;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
  }
  .pif-btn-cancel:hover:not(:disabled) { background: #F9FAFB; border-color: #9CA3AF; }
  .pif-btn-done {
    padding: 9px 20px;
    border-radius: 8px;
    border: none;
    background: #0056D2;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 2px 6px rgba(0,86,210,0.28);
    transition: background 0.15s, transform 0.1s;
  }
  .pif-btn-done:hover:not(:disabled)   { background: #004BB5; transform: translateY(-1px); }
  .pif-btn-done:active:not(:disabled)  { transform: translateY(0); }
  .pif-btn-done:disabled,
  .pif-btn-cancel:disabled             { opacity: 0.6; cursor: not-allowed; }

  /* ── Loading / Error states ── */
  .pif-loading {
    padding: 40px 24px;
    text-align: center;
    color: #6B7280;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .pif-spinner {
    width: 24px; height: 24px;
    border: 2.5px solid #E5E7EB;
    border-top-color: #0056D2;
    border-radius: 50%;
    animation: pif-spin 0.7s linear infinite;
  }
  @keyframes pif-spin { to { transform: rotate(360deg); } }

  .pif-error {
    margin: 12px 20px 0;
    padding: 10px 14px;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 8px;
    font-size: 13px;
    color: #DC2626;
  }

  /* ── Responsive ── */
  @media (max-width: 520px) {
    .pif-outer  { margin-top: 44px; padding: 0 8px 16px; }
    .pif-wrap   { border-radius: 12px; max-height: calc(100vh - 60px); }
    .pif-header { padding: 14px 16px; border-radius: 12px 12px 0 0; }
    .pif-form   { padding: 16px; gap: 14px; }
    .pif-footer { padding: 12px 16px; }

    .pif-grid-2,
    .pif-ro-grid { grid-template-columns: 1fr; gap: 12px; }

    .pif-btn-done,
    .pif-btn-cancel { flex: 1; text-align: center; padding: 10px 12px; }
  }

  @media (max-width: 360px) {
    .pif-title { font-size: 15px; }
    .pif-sub   { font-size: 12px; }
    .pif-input, .pif-select, .pif-textarea { font-size: 13px; }
  }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
function normalizeArray(v: unknown): string {
  return Array.isArray(v) ? (v as string[]).join(', ') : ((v as string) ?? '');
}

/* ─── Sub-components ──────────────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pif-field">
      <label className="pif-label">{label}</label>
      {children}
      {hint && <span className="pif-hint">{hint}</span>}
    </div>
  );
}

function ReadOnly({
  label, value, full = false, color,
}: { label: string; value: string; full?: boolean; color?: string }) {
  if (!value) return null;
  return (
    <div className="pif-field" style={full ? { gridColumn: '1 / -1' } : undefined}>
      <label className="pif-label">{label}</label>
      <div className="pif-ro">
        {color && <span className="pif-ro-dot" style={{ background: color }} />}
        {value}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function ProjectInquiryForm({ projectId, onClose, onDone }: Props) {
  const injected = useRef(false);
  if (!injected.current) { injectStyles(); injected.current = true; }

  const [formData, setFormData] = useState<ProjectForm>(EMPTY_FORM);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  /* ── Fetch on open ── */
  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get(`/aiContext/${projectId}`)
      .then(res => {
        if (cancelled) return;
        const d = res.data;
        setFormData({
          ...EMPTY_FORM,
          ...d,
          techStack:   normalizeArray(d.techStack),
          keyFeatures: normalizeArray(d.keyFeatures),
        });
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [projectId]);

  /* ── Handlers ── */
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res   = await api.post('/aiContext', { ...formData, projectId });
      const saved = res.data;
      onDone({
        ...formData,
        techStack:   normalizeArray(saved.techStack)   || formData.techStack,
        keyFeatures: normalizeArray(saved.keyFeatures) || formData.keyFeatures,
      });
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setSaving(false);
    }
  }, [formData, projectId, onDone]);

  const handleClose = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);

  /* ── Render ── */
  return (
    /* pif-outer: pushes the whole card below the black top bar */
    <div className="pif-outer">
      <div className="pif-wrap">

        {/* ── Blue header ── */}
        <header className="pif-header">
          <div>
            <h2 className="pif-title">AI Context</h2>
            <p className="pif-sub">Define parameters for this project's AI assistance.</p>
          </div>
          <button className="pif-close" onClick={handleClose} aria-label="Close">
            <IoClose size={20} />
          </button>
        </header>

        {/* ── Scrollable white body ── */}
        <div className="pif-body">

          {error && <div className="pif-error">⚠ {error}</div>}

          {loading ? (
            <div className="pif-loading">
              <div className="pif-spinner" />
              Loading project context…
            </div>
          ) : (
            <form id="pif-form" onSubmit={handleSubmit} className="pif-form" noValidate>

              <p className="pif-section">Project info (auto-filled)</p>
              <div className="pif-ro-grid">
                <ReadOnly label="Name"   value={formData.projectName} />
                <ReadOnly label="Type"   value={formData.projectType} />
                <ReadOnly label="Nature" value={formData.nature} />
                <ReadOnly label="Color"  value={formData.color} color={formData.color || undefined} />
              </div>
              {formData.description && (
                <ReadOnly label="Description" value={formData.description} full />
              )}

              <hr className="pif-divider" />

              <p className="pif-section">AI context fields</p>
              <div className="pif-grid-2">
                <Field label="Tech Stack" hint="Comma-separated">
                  <input className="pif-input" name="techStack" value={formData.techStack}
                    placeholder="React, Node, MongoDB…" onChange={handleChange} />
                </Field>
                <Field label="Target User">
                  <input className="pif-input" name="targetUser" value={formData.targetUser}
                    placeholder="e.g. End users, Developers" onChange={handleChange} />
                </Field>
              </div>

              <Field label="Purpose & Goal">
                <textarea className="pif-textarea" name="purpose" value={formData.purpose}
                  placeholder="What are we building and why?" onChange={handleChange} />
              </Field>

              <div className="pif-grid-2">
                <Field label="Explanation Depth">
                  <select className="pif-select" name="explanationDepth"
                    value={formData.explanationDepth} onChange={handleChange}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </Field>
                <Field label="Learning Orientation">
                  <input className="pif-input" name="learningOrientation"
                    value={formData.learningOrientation}
                    placeholder="e.g. Concept-heavy, hands-on" onChange={handleChange} />
                </Field>
              </div>

              <Field label="Known Constraints">
                <input className="pif-input" name="knownConstraints"
                  value={formData.knownConstraints}
                  placeholder="e.g. No external CSS, limited API quota" onChange={handleChange} />
              </Field>

              <hr className="pif-divider" />

              <p className="pif-section">From planning board</p>
              <Field label="Key Features" hint="Comma-separated">
                <input className="pif-input" name="keyFeatures" value={formData.keyFeatures}
                  placeholder="Auth, Dashboard, PDF export…" onChange={handleChange} />
              </Field>

              <div className="pif-grid-2">
                <Field label="Out of Scope">
                  <input className="pif-input" name="outOfScope" value={formData.outOfScope}
                    placeholder="e.g. No mobile, no payments" onChange={handleChange} />
                </Field>
                <div />
              </div>

              <Field label="Board Summary">
                <textarea className="pif-textarea" style={{ minHeight: '68px' }}
                  name="boardSummary" value={formData.boardSummary}
                  placeholder="Key decisions from the planning board…" onChange={handleChange} />
              </Field>

            </form>
          )}
        </div>

        {/* ── Sticky footer ── */}
        {!loading && (
          <footer className="pif-footer">
            <button type="button" className="pif-btn-cancel" onClick={handleClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="pif-form" className="pif-btn-done" disabled={saving}>
              {saving ? 'Saving…' : 'Done'}
            </button>
          </footer>
        )}

      </div>
    </div>
  );
}