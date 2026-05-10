import { useState, useEffect } from 'react';

const STORAGE_KEY = 'calendar_embed_url';
const DEFAULT_URL = 'https://calendar.google.com/calendar/r';

function ExternalLinkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

export default function CalendarPage() {
  const [embedUrl, setEmbedUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_URL);
  const [editingUrl, setEditingUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [frameError, setFrameError] = useState(false);

  // Reset error when URL changes
  useEffect(() => { setFrameError(false); }, [embedUrl]);

  const handleSaveUrl = () => {
    const trimmed = editingUrl.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setEmbedUrl(trimmed);
    setShowUrlInput(false);
    setEditingUrl('');
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEmbedUrl(DEFAULT_URL);
    setShowUrlInput(false);
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2.5">
      {/* Header bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl surface">
        <CalendarIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Google Calendar</span>

        <div className="flex-1" />

        {/* Open in new tab */}
        <a
          href={embedUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
            bg-black/[0.04] dark:bg-white/[0.05]
            hover:bg-black/[0.08] dark:hover:bg-white/[0.09]
            text-gray-600 dark:text-gray-400
            transition-colors duration-150"
        >
          <ExternalLinkIcon className="w-3.5 h-3.5" />
          Open in new tab
        </a>

        {/* Custom embed URL */}
        <button
          onClick={() => { setShowUrlInput(v => !v); setEditingUrl(embedUrl); }}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium
            bg-black/[0.04] dark:bg-white/[0.05]
            hover:bg-black/[0.08] dark:hover:bg-white/[0.09]
            text-gray-600 dark:text-gray-400
            transition-colors duration-150"
        >
          Set embed URL
        </button>
      </div>

      {/* Embed URL input */}
      {showUrlInput && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl surface">
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Google Calendar's main URL blocks iframes. Use the embeddable version:
              Settings → your calendar → "Integrate calendar" → copy the embed URL.
            </p>
            <input
              autoFocus
              value={editingUrl}
              onChange={e => setEditingUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveUrl(); if (e.key === 'Escape') setShowUrlInput(false); }}
              placeholder="https://calendar.google.com/calendar/embed?src=..."
              className="w-full px-3 py-2 rounded-lg text-[13px]
                bg-black/[0.04] dark:bg-white/[0.05]
                border border-black/[0.08] dark:border-white/[0.07]
                text-gray-800 dark:text-gray-200
                placeholder-gray-400 dark:placeholder-gray-600
                outline-none focus:border-indigo-400/60 dark:focus:border-indigo-500/50
                transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={handleSaveUrl}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium
                bg-indigo-500 hover:bg-indigo-600
                text-white transition-colors duration-150"
            >
              Save
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-[12px]
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                transition-colors duration-150"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* iframe */}
      <div className="flex-1 rounded-xl overflow-hidden surface relative">
        {frameError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
            <CalendarIcon className="w-10 h-10 text-gray-300 dark:text-gray-700" />
            <div>
              <p className="text-[14px] font-medium text-gray-600 dark:text-gray-400">Calendar can't load here</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-1 max-w-xs">
                Google blocks its main site in iframes. Set an embed URL above, or open in a new tab.
              </p>
            </div>
            <a
              href={embedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium
                bg-indigo-500 hover:bg-indigo-600 text-white
                transition-colors duration-150"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Open Google Calendar
            </a>
          </div>
        ) : (
          <iframe
            key={embedUrl}
            src={embedUrl}
            className="w-full h-full border-0"
            title="Google Calendar"
            onError={() => setFrameError(true)}
          />
        )}
      </div>
    </div>
  );
}
