import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';

const DEBOUNCE_MS = 900;

function SaveIndicator({ saved, wordCount, text }) {
  if (!saved) return (
    <span className="text-[10px] text-indigo-400 dark:text-indigo-500 animate-pulse font-medium">saving…</span>
  );
  if (text) return (
    <span className="text-[10px] text-gray-300/80 dark:text-gray-700 tabular-nums">{wordCount}w</span>
  );
  return null;
}

export default function ClipboardPanel() {
  const [text, setText] = useState('');
  const [entryId, setEntryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    api.get('/clipboard').then(data => {
      if (data.entries.length > 0) {
        const last = data.entries[data.entries.length - 1];
        setText(last.content);
        setEntryId(last.id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async (value) => {
    if (entryId) await api.del(`/clipboard/${entryId}`);
    if (!value.trim()) { setEntryId(null); setSaved(true); return; }
    const entry = await api.post('/clipboard', { text: value });
    setEntryId(entry.id);
    setSaved(true);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(e.target.value), DEBOUNCE_MS);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-black/[0.05] dark:border-white/[0.05]
        flex items-start justify-between">
        <div>
          <p className="section-label">Scratch Pad</p>
          <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mt-0.5 tracking-tight">
            Clipboard
          </p>
        </div>
        <div className="mt-1">
          <SaveIndicator saved={saved} wordCount={wordCount} text={text} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 p-3">
            <div className="w-full h-full rounded-xl shimmer" />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={handleChange}
            placeholder="Start typing — auto-saves…"
            spellCheck={false}
            className="
              flex-1 w-full resize-none
              bg-transparent
              px-4 py-3
              text-[12.5px] leading-[1.75]
              text-gray-700 dark:text-gray-300
              placeholder-gray-300/80 dark:placeholder-gray-700
              font-mono
              outline-none
              transition-colors
            "
          />
        )}
      </div>

      {/* Footer status bar */}
      <div className="px-4 py-2 border-t border-black/[0.04] dark:border-white/[0.04] shrink-0
        flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          !saved
            ? 'bg-indigo-400 animate-pulse shadow-[0_0_4px_rgba(99,102,241,0.5)]'
            : text
            ? 'bg-emerald-400/70'
            : 'bg-gray-200 dark:bg-gray-800'
        }`} />
        <span className="text-[10px] text-gray-400/50 dark:text-gray-700">
          {!saved ? 'Saving…' : text ? 'Saved' : 'Empty'}
        </span>
      </div>

    </div>
  );
}
