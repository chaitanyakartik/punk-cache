import { useState, useEffect, useRef } from 'react';
import { useClipboard } from '../../hooks/useClipboard';

export default function ClipboardDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { entries, loading, addEntry } = useClipboard();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addEntry(input.trim());
    setInput('');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`absolute bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg transition-all duration-200 ${
          open
            ? 'bg-indigo-600 text-white shadow-indigo-500/40 scale-95'
            : 'bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-white/15 hover:shadow-xl hover:scale-105 shadow-black/10'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Clipboard
        {entries.length > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${open ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'}`}>
            {entries.length}
          </span>
        )}
      </button>

      {/* Slide-up drawer */}
      <div
        className={`absolute bottom-20 right-6 z-50 w-80 transition-all duration-300 ease-out ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="glass dark:bg-gray-900/80 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden border border-white/20 dark:border-white/5">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 dark:border-white/5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Clipboard</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Persistent scratch pad</p>
          </div>

          {/* Input */}
          <form onSubmit={handleAdd} className="px-3 py-2.5 border-b border-white/10 dark:border-white/5 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Clip something..."
              className="flex-1 px-3 py-1.5 text-sm rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-400/60 dark:focus:border-indigo-500/50 transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors font-medium"
            >
              Add
            </button>
          </form>

          {/* Entries */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-8 rounded-lg bg-white/10 animate-pulse" />)}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-600">Nothing clipped yet.</div>
            ) : (
              <ul className="p-2 space-y-1">
                {entries.map(entry => (
                  <li
                    key={entry.id}
                    className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 font-mono truncate">{entry.content}</span>
                    <button
                      onClick={() => handleCopy(entry.content)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
                      title="Copy"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
