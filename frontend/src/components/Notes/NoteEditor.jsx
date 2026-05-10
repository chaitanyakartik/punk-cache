import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../api/client';

export default function NoteEditor({ card, contextId, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get(`/cards/${contextId}/${card.id}/note`)
      .then(data => { setContent(data.content); })
      .catch(() => { setContent(''); })
      .finally(() => setLoading(false));
  }, [contextId, card.id]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/cards/${contextId}/${card.id}/note`, { content });
      setDirty(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  // Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dirty, content]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl h-[82vh] flex flex-col rounded-2xl overflow-hidden surface-overlay">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 shrink-0
          border-b border-black/[0.06] dark:border-white/[0.06]">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
            bg-emerald-100/80 dark:bg-emerald-500/[0.14]
            text-emerald-600 dark:text-emerald-300/90">
            Note
          </span>
          <span className="flex-1 text-[14px] font-semibold text-gray-800 dark:text-gray-200 truncate">
            {card.content || 'Untitled Note'}
          </span>

          <span className={`text-[11px] transition-opacity duration-150 ${dirty ? 'opacity-60' : 'opacity-0'} text-gray-400 dark:text-gray-600`}>
            Unsaved
          </span>

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-3.5 py-1.5 text-[12px] font-semibold rounded-lg
              bg-emerald-500 hover:bg-emerald-600 text-white
              disabled:opacity-35 disabled:cursor-default
              transition-all duration-150"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <span className="text-[10px] text-gray-300/60 dark:text-gray-700 hidden sm:block">⌘S</span>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400/80
              hover:text-gray-600 dark:hover:text-gray-200
              hover:bg-black/[0.05] dark:hover:bg-white/[0.08]
              transition-all duration-120"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-400/40 border-t-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">

            {/* Editor pane */}
            <div className="flex-1 flex flex-col border-r border-black/[0.05] dark:border-white/[0.05]">
              <div className="px-4 py-2 shrink-0
                text-[9px] font-bold uppercase tracking-[0.1em]
                text-gray-300/70 dark:text-gray-700
                border-b border-black/[0.04] dark:border-white/[0.04]">
                Markdown
              </div>
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); setDirty(true); }}
                placeholder="Write in Markdown…"
                spellCheck
                className="flex-1 p-5 text-[13px] font-mono leading-[1.7]
                  bg-transparent
                  text-gray-800 dark:text-gray-200
                  placeholder-gray-300/60 dark:placeholder-gray-700
                  resize-none outline-none"
              />
            </div>

            {/* Preview pane */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 shrink-0
                text-[9px] font-bold uppercase tracking-[0.1em]
                text-gray-300/70 dark:text-gray-700
                border-b border-black/[0.04] dark:border-white/[0.04]">
                Preview
              </div>
              <div className="flex-1 overflow-y-auto p-5
                prose prose-sm dark:prose-invert max-w-none
                prose-p:text-[13px] prose-p:leading-[1.7]
                prose-headings:font-semibold
                prose-code:text-[12px] prose-code:font-mono
                prose-pre:bg-black/[0.04] dark:prose-pre:bg-white/[0.04]
                prose-pre:rounded-xl prose-pre:p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*Nothing to preview…*'}
                </ReactMarkdown>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
