import { useCalendar } from '../../hooks/useCalendar';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am–9pm

function formatHour(h) {
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function formatTime(iso) {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const period = h >= 12 ? 'p' : 'a';
  const hr = h % 12 || 12;
  return m === 0 ? `${hr}${period}` : `${hr}:${String(m).padStart(2, '0')}${period}`;
}

// Google Calendar colorId → tailwind classes
const EVENT_COLORS = {
  null:  { bg: 'bg-indigo-500/15 dark:bg-indigo-500/20',  border: 'border-indigo-500/60', text: 'text-indigo-700 dark:text-indigo-300' },
  '1':   { bg: 'bg-violet-500/15 dark:bg-violet-500/20',  border: 'border-violet-500/60', text: 'text-violet-700 dark:text-violet-300' },
  '2':   { bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',border: 'border-emerald-500/60',text: 'text-emerald-700 dark:text-emerald-300' },
  '3':   { bg: 'bg-purple-500/15 dark:bg-purple-500/20',  border: 'border-purple-500/60', text: 'text-purple-700 dark:text-purple-300' },
  '4':   { bg: 'bg-rose-500/15 dark:bg-rose-500/20',      border: 'border-rose-500/60',   text: 'text-rose-700 dark:text-rose-300' },
  '5':   { bg: 'bg-amber-500/15 dark:bg-amber-500/20',    border: 'border-amber-500/60',  text: 'text-amber-700 dark:text-amber-300' },
  '6':   { bg: 'bg-orange-500/15 dark:bg-orange-500/20',  border: 'border-orange-500/60', text: 'text-orange-700 dark:text-orange-300' },
  '7':   { bg: 'bg-sky-500/15 dark:bg-sky-500/20',        border: 'border-sky-500/60',    text: 'text-sky-700 dark:text-sky-300' },
  '8':   { bg: 'bg-blue-500/15 dark:bg-blue-500/20',      border: 'border-blue-500/60',   text: 'text-blue-700 dark:text-blue-300' },
  '9':   { bg: 'bg-green-500/15 dark:bg-green-500/20',    border: 'border-green-500/60',  text: 'text-green-700 dark:text-green-300' },
  '10':  { bg: 'bg-red-500/15 dark:bg-red-500/20',        border: 'border-red-500/60',    text: 'text-red-700 dark:text-red-300' },
  '11':  { bg: 'bg-pink-500/15 dark:bg-pink-500/20',      border: 'border-pink-500/60',   text: 'text-pink-700 dark:text-pink-300' },
};

function getColor(colorId) {
  return EVENT_COLORS[colorId] || EVENT_COLORS[null];
}

function eventsForHour(events, hour) {
  return events.filter(e => {
    if (e.isAllDay) return false;
    const start = new Date(e.start);
    const end   = new Date(e.end);
    const hStart = new Date(start); hStart.setMinutes(0, 0, 0);
    const hEnd   = new Date(hStart); hEnd.setHours(hEnd.getHours() + 1);
    return start < hEnd && end > hStart && start.getHours() === hour;
  });
}

function EventChip({ event }) {
  const c = getColor(event.colorId);
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border-l-2 ${c.bg} ${c.border} mt-0.5`}>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-semibold leading-tight truncate ${c.text}`}>
          {event.title}
        </p>
        <p className="text-[9px] text-gray-400/70 dark:text-gray-600 tabular-nums mt-0.5">
          {formatTime(event.start)} – {formatTime(event.end)}
        </p>
      </div>
    </div>
  );
}

function AllDayBanner({ events }) {
  if (!events.length) return null;
  return (
    <div className="px-3 py-1.5 space-y-1 border-b border-black/[0.05] dark:border-white/[0.05]">
      {events.map(e => {
        const c = getColor(e.colorId);
        return (
          <div key={e.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${c.bg} ${c.text} truncate`}>
            {e.title}
          </div>
        );
      })}
    </div>
  );
}

function ConnectPrompt({ connectUrl }) {
  return (
    <div className="px-3 py-2.5 border-t border-black/[0.05] dark:border-white/[0.05] shrink-0">
      {connectUrl ? (
        <a
          href={connectUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-medium
            text-indigo-500 dark:text-indigo-400
            hover:text-indigo-600 dark:hover:text-indigo-300
            transition-colors duration-120"
        >
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Connect Google Calendar
        </a>
      ) : (
        <p className="text-[10px] text-gray-400/50 dark:text-gray-700 leading-snug">
          Add GOOGLE_CLIENT_ID + SECRET to .env to connect calendar
        </p>
      )}
    </div>
  );
}

export default function SchedulePanel() {
  const { connected, events, loading, connectUrl, disconnect } = useCalendar();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const allDayEvents = events.filter(e => e.isAllDay);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
          <p className="section-label">Schedule</p>
          {connected && !loading && (
            <button
              onClick={disconnect}
              title="Disconnect calendar"
              className="text-[9px] text-gray-400/50 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-500 transition-colors"
            >
              disconnect
            </button>
          )}
        </div>
        <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 mt-0.5 tracking-tight leading-snug">
          {now.toLocaleDateString('en-US', { weekday: 'long' })}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
          {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* All-day events */}
      <AllDayBanner events={allDayEvents} />

      {/* Hour blocks */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {HOURS.map(hour => {
          const isCurrentHour = hour === currentHour;
          const isPast = hour < currentHour;
          const progressPct = isCurrentHour ? Math.round((currentMinute / 60) * 100) : 0;
          const hourEvents = eventsForHour(events, hour);

          return (
            <div key={hour} className="flex items-stretch gap-2 px-2.5 py-0">

              {/* Time label */}
              <div className="w-6 shrink-0 flex items-start justify-end pt-3">
                <span className={`text-[10px] font-mono tabular-nums leading-none ${
                  isCurrentHour
                    ? 'text-indigo-500 dark:text-indigo-400 font-bold'
                    : isPast
                    ? 'text-gray-300/80 dark:text-gray-800'
                    : 'text-gray-400/80 dark:text-gray-600'
                }`}>
                  {formatHour(hour)}
                </span>
              </div>

              {/* Spine */}
              <div className="flex flex-col items-center w-3.5 shrink-0">
                <div className={`w-px flex-1 ${
                  isPast ? 'bg-black/[0.07] dark:bg-white/[0.07]'
                  : isCurrentHour ? 'bg-indigo-300/50 dark:bg-indigo-500/30'
                  : 'bg-black/[0.05] dark:bg-white/[0.05]'
                }`} />
                <div className={`my-0.5 shrink-0 transition-all duration-300 ${
                  isCurrentHour
                    ? 'w-2 h-2 rounded-full bg-indigo-500 now-glow ring-4 ring-indigo-400/15 dark:ring-indigo-500/15'
                    : isPast
                    ? 'w-1.5 h-1.5 rounded-full bg-black/[0.12] dark:bg-white/[0.10]'
                    : 'w-1.5 h-1.5 rounded-full bg-black/[0.08] dark:bg-white/[0.07]'
                }`} />
                <div className={`w-px flex-1 ${
                  isPast || isCurrentHour ? 'bg-black/[0.07] dark:bg-white/[0.07]'
                  : 'bg-black/[0.05] dark:bg-white/[0.05]'
                }`} />
              </div>

              {/* Block */}
              <div className={`flex-1 my-1 rounded-lg overflow-hidden transition-all duration-200 ${
                isCurrentHour
                  ? 'bg-indigo-50/80 dark:bg-indigo-500/[0.08] border border-indigo-200/50 dark:border-indigo-500/[0.14] shadow-sm'
                  : isPast
                  ? 'opacity-25'
                  : 'bg-black/[0.018] dark:bg-white/[0.018] border border-black/[0.035] dark:border-white/[0.035]'
              }`}>
                {isCurrentHour && (
                  <div
                    className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-80"
                    style={{ width: `${progressPct}%` }}
                  />
                )}
                <div className="px-2 py-1.5">
                  {isCurrentHour && !hourEvents.length && (
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                      Now
                    </span>
                  )}
                  {!isCurrentHour && !hourEvents.length && (
                    <span className="text-[10px] text-gray-300/70 dark:text-gray-800">—</span>
                  )}
                  {hourEvents.map(e => <EventChip key={e.id} event={e} />)}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer — connect prompt or status */}
      {!connected && <ConnectPrompt connectUrl={connectUrl} />}
    </div>
  );
}
