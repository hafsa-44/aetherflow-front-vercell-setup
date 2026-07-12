
//this to use 
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ── Config ─────────────────────────────────────────────────────────────────
const OPENROUTER_KEY   = (import.meta as any).env?.VITE_OPENROUTER_KEY ?? '';
const OPENROUTER_MODEL = 'anthropic/claude-sonnet-4-5';
const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_WIDTH = 280;   // px — initial panel width
const MIN_WIDTH     = 240;   // px
// Max width (40% of window) is computed at runtime

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

// ── Suggestions ────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    label: '› Suggest next feature',
    prompt:
      'Based on a collaborative developer productivity tool (IDE + task board), what is the single most impactful next feature to build? Be concise.',
  },
  {
    label: '› Review my code',
    prompt:
      'I have a React + TypeScript + Vite project. What are the top 3 things I should audit for performance and maintainability right now?',
  },
  {
    label: '› Naming best practices',
    prompt:
      'Give me a quick reference for naming conventions in a React/TypeScript codebase — components, hooks, types, constants, and files.',
  },
];

// ── Markdown renderer ──────────────────────────────────────────────────────
// Lightweight: no external deps, handles headings/bold/italic/code/lists/hr
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <div key={`cb-${i}`} className="md-code-block">
          {lang && <div className="md-code-lang">{lang}</div>}
          <pre className="md-pre"><code>{codeLines.join('\n')}</code></pre>
          <button
            className="md-code-copy"
            title="Copy code"
            onClick={() => navigator.clipboard.writeText(codeLines.join('\n'))}
          >
            copy
          </button>
        </div>
      );
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) { nodes.push(<h1 key={`h1-${i}`} className="md-h1">{inlineMarkdown(h1[1])}</h1>); i++; continue; }
    if (h2) { nodes.push(<h2 key={`h2-${i}`} className="md-h2">{inlineMarkdown(h2[1])}</h2>); i++; continue; }
    if (h3) { nodes.push(<h3 key={`h3-${i}`} className="md-h3">{inlineMarkdown(h3[1])}</h3>); i++; continue; }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      nodes.push(<hr key={`hr-${i}`} className="md-hr" />);
      i++;
      continue;
    }

    // Unordered list — collect consecutive items
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="md-ul">
          {items.map((item, idx) => <li key={idx} className="md-li">{inlineMarkdown(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="md-ol">
          {items.map((item, idx) => <li key={idx} className="md-li">{inlineMarkdown(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      nodes.push(<div key={`br-${i}`} className="md-spacer" />);
      i++;
      continue;
    }

    // Regular paragraph
    nodes.push(<p key={`p-${i}`} className="md-p">{inlineMarkdown(line)}</p>);
    i++;
  }

  return nodes;
}

// Inline: bold, italic, inline code
function inlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Tokenise by `code`, **bold**, *italic*
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(<code key={match.index} className="md-inline-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      parts.push(<strong key={match.index} className="md-bold">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={match.index} className="md-italic">{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

// ── API call ───────────────────────────────────────────────────────────────
async function callOpenRouter(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): Promise<string> {
  if (!OPENROUTER_KEY) {
    throw new Error('Missing VITE_OPENROUTER_KEY in .env — add it and restart Vite.');
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'AetherFlow Dev Board',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert AI assistant embedded in AetherFlow — a collaborative developer IDE and task board. ' +
            'Help with code questions, architecture, debugging, naming, and feature decisions. ' +
            'Be concise and practical. Format your responses with proper Markdown: ' +
            'use ## for section headings, **bold** for emphasis, `inline code` for identifiers, ' +
            'and fenced ```language blocks for code samples. Use bullet lists for enumerations.',
        },
        ...messages,
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '(empty response)';
}

// ── Message bubble with actions ────────────────────────────────────────────
interface BubbleProps {
  msg: Message;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
}

const MessageBubble: React.FC<BubbleProps> = ({ msg, onDelete, onEdit }) => {
  const [hovered,  setHovered]  = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [copied,   setCopied]   = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const isUser = msg.role === 'user';

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEditSave = () => {
    if (editText.trim()) onEdit(msg.id, editText.trim());
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === 'Escape') { setEditing(false); setEditText(msg.content); }
  };

  return (
    <div
      className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--ai'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action toolbar — appears on hover */}
      <div className={`msg-actions ${hovered ? 'msg-actions--visible' : ''} ${isUser ? 'msg-actions--user' : 'msg-actions--ai'}`}>
        <button className="msg-act-btn" title="Copy" onClick={handleCopy}>
          {copied ? '✓' : '⎘'}
        </button>
        {isUser && (
          <button className="msg-act-btn" title="Edit" onClick={() => { setEditing(true); setEditText(msg.content); }}>
            ✎
          </button>
        )}
        <button className="msg-act-btn msg-act-btn--danger" title="Delete" onClick={() => onDelete(msg.id)}>
          ✕
        </button>
      </div>

      {/* Bubble */}
      <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'}`}>
        {editing ? (
          <div className="msg-edit-wrap">
            <textarea
              ref={editRef}
              className="msg-edit-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={3}
            />
            <div className="msg-edit-actions">
              <button className="msg-edit-save" onClick={handleEditSave}>Save</button>
              <button className="msg-edit-cancel" onClick={() => { setEditing(false); setEditText(msg.content); }}>Cancel</button>
            </div>
          </div>
        ) : isUser ? (
          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>
        ) : (
          <div className="msg-md">{renderMarkdown(msg.content)}</div>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const AIPanel: React.FC = () => {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragStartW  = useRef(DEFAULT_WIDTH);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // ── Drag-to-resize ──────────────────────────────────────────────────────
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current  = true;
    dragStartX.current  = e.clientX;
    dragStartW.current  = panelWidth;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const maxWidth = window.innerWidth * 0.40;
      const delta    = dragStartX.current - ev.clientX; // dragging left = wider
      const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, dragStartW.current + delta));
      setPanelWidth(newWidth);
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Send ────────────────────────────────────────────────────────────────
  const send = useCallback(async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const userMsg: Message = {
      id:      `u-${Date.now()}`,
      role:    'user',
      content: trimmed,
      ts:      Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const reply = await callOpenRouter(history, ctrl.signal);
      setMessages(prev => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply, ts: Date.now() },
      ]);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleDelete = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleEdit = (id: string, newContent: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setLoading(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ── Resize handle ─────────────────────────────────────── */
        .ai-resize-handle {
          width: 4px; min-width: 4px; flex-shrink: 0;
          cursor: col-resize; background: transparent;
          transition: background 0.15s;
          align-self: stretch;
          z-index: 10;
        }
        .ai-resize-handle:hover { background: #4f8ef7; }

        /* ── Panel shell ───────────────────────────────────────── */
        .ai-panel {
          display: flex; flex-direction: column;
          background: #161b22; border-left: 1px solid #21262d;
          flex-shrink: 0; overflow: hidden;
          position: relative;
        }
        .ai-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px 8px; font-size: 10px; font-weight: 700;
          letter-spacing: 1.2px; color: #484f58; text-transform: uppercase; flex-shrink: 0;
          border-bottom: 1px solid #21262d;
        }
        .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: #3fb950; box-shadow: 0 0 6px #3fb950; }

        /* ── Messages area ─────────────────────────────────────── */
        .ai-logs {
          flex: 1; overflow-y: auto;
          padding: 10px 10px 6px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .ai-logs::-webkit-scrollbar { width: 3px; }
        .ai-logs::-webkit-scrollbar-thumb { background: #21262d; border-radius: 2px; }

        .ai-empty {
          color: #484f58; font-size: 11px; text-align: center;
          margin-top: 20px; line-height: 1.7;
        }

        /* ── Message rows ──────────────────────────────────────── */
        .msg-row {
          display: flex; flex-direction: column; position: relative;
        }
        .msg-row--user  { align-items: flex-end; }
        .msg-row--ai    { align-items: flex-start; }

        /* Action toolbar */
        .msg-actions {
          display: flex; gap: 3px; margin-bottom: 3px;
          opacity: 0; transition: opacity 0.15s; pointer-events: none;
        }
        .msg-actions--visible { opacity: 1; pointer-events: all; }
        .msg-actions--user  { flex-direction: row-reverse; }
        .msg-actions--ai    { flex-direction: row; padding-left: 2px; }

        .msg-act-btn {
          background: #1c2128; border: 1px solid #30363d; border-radius: 4px;
          color: #8b949e; font-size: 11px; cursor: pointer;
          padding: 2px 6px; line-height: 1.4;
          transition: background 0.1s, color 0.1s;
        }
        .msg-act-btn:hover { background: #21262d; color: #e6edf3; }
        .msg-act-btn--danger:hover { background: rgba(248,81,73,0.12); color: #f85149; border-color: rgba(248,81,73,0.3); }

        /* Bubble */
        .msg-bubble {
          max-width: 94%;
          padding: 8px 11px;
          font-size: 12px; line-height: 1.65;
          word-break: break-word;
        }
        .msg-bubble--user {
          border-radius: 10px 10px 3px 10px;
          background: linear-gradient(135deg, #6e40c9, #4f8ef7);
          color: #fff;
        }
        .msg-bubble--ai {
          border-radius: 10px 10px 10px 3px;
          background: #1c2128; border: 1px solid #30363d;
          color: #c9d1d9;
        }

        /* Edit mode */
        .msg-edit-wrap { display: flex; flex-direction: column; gap: 5px; width: 100%; }
        .msg-edit-input {
          width: 100%; background: #0d1117; border: 1px solid #4f8ef7;
          border-radius: 5px; padding: 5px 8px; color: #e6edf3;
          font-size: 12px; resize: none; outline: none;
          font-family: inherit; line-height: 1.5;
        }
        .msg-edit-actions { display: flex; gap: 5px; justify-content: flex-end; }
        .msg-edit-save, .msg-edit-cancel {
          font-size: 11px; border-radius: 5px; padding: 3px 10px; cursor: pointer; border: 1px solid;
        }
        .msg-edit-save { background: rgba(79,142,247,0.15); border-color: rgba(79,142,247,0.4); color: #4f8ef7; }
        .msg-edit-save:hover { background: rgba(79,142,247,0.25); }
        .msg-edit-cancel { background: none; border-color: #30363d; color: #8b949e; }
        .msg-edit-cancel:hover { background: #21262d; }

        /* ── Markdown styles ───────────────────────────────────── */
        .msg-md { display: flex; flex-direction: column; gap: 4px; }
        .md-h1 { font-size: 14px; font-weight: 700; color: #e6edf3; margin: 6px 0 2px; border-bottom: 1px solid #30363d; padding-bottom: 4px; }
        .md-h2 { font-size: 12.5px; font-weight: 700; color: #cdd9e5; margin: 5px 0 2px; }
        .md-h3 { font-size: 12px; font-weight: 600; color: #b4bac8; margin: 4px 0 1px; }
        .md-p  { margin: 0; line-height: 1.65; }
        .md-bold   { font-weight: 700; color: #e6edf3; }
        .md-italic { font-style: italic; color: #b4bac8; }
        .md-inline-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 11px; background: rgba(79,142,247,0.1);
          border: 1px solid rgba(79,142,247,0.2); border-radius: 3px;
          padding: 1px 4px; color: #79c0ff;
        }
        .md-ul, .md-ol { margin: 3px 0 3px 14px; padding: 0; }
        .md-li { margin-bottom: 2px; line-height: 1.6; }
        .md-hr { border: none; border-top: 1px solid #30363d; margin: 6px 0; }
        .md-spacer { height: 4px; }

        /* Code block */
        .md-code-block {
          position: relative;
          background: #0d1117; border: 1px solid #30363d; border-radius: 7px;
          margin: 4px 0; overflow: hidden;
        }
        .md-code-lang {
          padding: 4px 10px; background: #161b22; border-bottom: 1px solid #30363d;
          font-size: 10px; color: #484f58; font-family: 'JetBrains Mono', monospace;
          text-transform: lowercase; letter-spacing: 0.5px;
        }
        .md-pre {
          margin: 0; padding: 10px 12px;
          overflow-x: auto; font-size: 11.5px; line-height: 1.7;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #e6edf3;
        }
        .md-pre::-webkit-scrollbar { height: 3px; }
        .md-pre::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
        .md-code-copy {
          position: absolute; top: 6px; right: 8px;
          background: #21262d; border: 1px solid #30363d; border-radius: 4px;
          color: #8b949e; font-size: 10px; padding: 2px 7px; cursor: pointer;
          transition: background 0.1s, color 0.1s;
          font-family: 'JetBrains Mono', monospace;
        }
        .md-code-copy:hover { background: #30363d; color: #e6edf3; }

        /* ── Typing indicator ──────────────────────────────────── */
        @keyframes ai-blink {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 1;   }
        }
        .ai-typing {
          display: flex; align-items: center; gap: 5px; paddingLeft: 4px;
          padding: 4px 2px;
        }

        /* ── Error ─────────────────────────────────────────────── */
        .ai-error {
          background: rgba(255,91,91,0.08); border: 1px solid rgba(255,91,91,0.3);
          border-radius: 6px; padding: 7px 10px;
          color: #ff5b5b; font-size: 11px; line-height: 1.5;
        }

        /* ── Suggestions ───────────────────────────────────────── */
        .ai-suggestions { padding: 0 8px 8px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .ai-suggestion-btn {
          background: #1c2128; border: 1px solid #30363d; border-radius: 6px;
          color: #8b949e; font-size: 11px; cursor: pointer; padding: 6px 9px;
          text-align: left; transition: background 0.12s, color 0.12s;
        }
        .ai-suggestion-btn:hover { background: #21262d; color: #b4bac8; }

        /* ── Input area ────────────────────────────────────────── */
        .ai-input-wrap {
          display: flex; gap: 5px; padding: 8px 8px 8px;
          flex-shrink: 0; border-top: 1px solid #21262d;
          align-items: flex-end;
        }
        .ai-textarea {
          flex: 1; background: #0d1117; border: 1px solid #30363d;
          border-radius: 6px; padding: 6px 9px; color: #b4bac8;
          font-size: 12px; outline: none; resize: none;
          font-family: inherit; line-height: 1.5;
          min-height: 32px; max-height: 120px; overflow-y: auto;
          transition: border-color 0.15s;
        }
        .ai-textarea::placeholder { color: #484f58; }
        .ai-textarea:focus { border-color: #4f8ef7; }
        .ai-send {
          background: linear-gradient(135deg, #6e40c9, #4f8ef7);
          border: none; border-radius: 6px; color: #fff;
          font-size: 12px; cursor: pointer; padding: 0 11px;
          font-weight: 600; flex-shrink: 0; height: 32px;
          transition: opacity 0.15s;
        }
        .ai-send:hover:not(:disabled) { opacity: 0.88; }
        .ai-send:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      {/* Resize handle — sits LEFT of panel, dragging it leftward widens the panel */}
      <div
        className="ai-resize-handle"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize AI panel"
      />

      <div className="ai-panel" style={{ width: panelWidth, minWidth: MIN_WIDTH }}>
        {/* Header */}
        <div className="ai-header">
          <span>AI ASSISTANT</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{
                  background: 'none', border: 'none',
                  color: '#484f58', fontSize: 9,
                  cursor: 'pointer', padding: '1px 4px', letterSpacing: 0.4,
                }}
              >
                CLEAR
              </button>
            )}
            <span className="ai-dot" />
          </div>
        </div>

        {/* Messages */}
        <div className="ai-logs">
          {messages.length === 0 && !loading && (
            <div className="ai-empty">
              Ask anything about your code,<br />architecture, or next steps.
            </div>
          )}

          {messages.map(m => (
            <MessageBubble
              key={m.id}
              msg={m}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="ai-typing">
              {[0, 0.25, 0.5].map((delay, i) => (
                <span
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#4f8ef7', display: 'inline-block',
                    animation: `ai-blink 1s ease-in-out ${delay}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {error && <div className="ai-error">⚠ {error}</div>}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions on empty state */}
        {messages.length === 0 && !loading && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map(s => (
              <button
                key={s.label}
                className="ai-suggestion-btn"
                onClick={() => send(s.prompt)}
                disabled={loading}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ai-input-wrap">
          <textarea
            ref={textareaRef}
            className="ai-textarea"
            placeholder="Ask AI… (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />
          <button
            className="ai-send"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            title="Send (Enter)"
          >
            ▶
          </button>
        </div>
      </div>
    </>
  );
};

export default AIPanel;
