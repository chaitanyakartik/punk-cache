import { useState, useEffect } from 'react';

const CARD_TYPES = ['task', 'note', 'video', 'snippet', 'link', 'file'];
const STATES = ['pending', 'ongoing', 'done'];

// Per-type color accent for modal header stripe
const TYPE_STRIPE = {
  task:    'from-indigo-500/15 via-violet-500/8 to-transparent',
  note:    'from-emerald-500/15 via-teal-500/8 to-transparent',
  video:   'from-rose-500/15 via-orange-500/8 to-transparent',
  snippet: 'from-amber-500/15 via-yellow-500/8 to-transparent',
  link:    'from-cyan-500/15 via-blue-500/8 to-transparent',
  file:    'from-slate-500/12 via-gray-500/6 to-transparent',
};

const TYPE_BORDER = {
  task:    'border-indigo-300/40 dark:border-indigo-500/25',
  note:    'border-emerald-300/40 dark:border-emerald-500/25',
  video:   'border-rose-300/40 dark:border-rose-500/25',
  snippet: 'border-amber-300/40 dark:border-amber-500/25',
  link:    'border-cyan-300/40 dark:border-cyan-500/25',
  file:    'border-slate-300/40 dark:border-slate-500/25',
};

const STATE_CONFIG = {
  pending: { active: 'bg-amber-400/85 text-amber-950 shadow-sm shadow-amber-400/30', label: 'Pending' },
  ongoing: { active: 'bg-blue-400/85 text-blue-950 shadow-sm shadow-blue-400/30', label: 'In Progress' },
  done:    { active: 'bg-emerald-400/85 text-emerald-950 shadow-sm shadow-emerald-400/30', label: 'Done' },
};

function InputField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-gray-400/80 dark:text-gray-600 uppercase tracking-[0.07em]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = `
  w-full px-3.5 py-2.5 text-[13px] rounded-xl
  bg-white/50 dark:bg-white/[0.04]
  border border-white/50 dark:border-white/[0.08]
  text-gray-900 dark:text-white
  placeholder-gray-400/70 dark:placeholder-gray-700
  outline-none
  transition-all duration-150
  focus:border-indigo-400/60 dark:focus:border-indigo-500/45
  focus:bg-white/70 dark:focus:bg-white/[0.06]
  focus:shadow-[0_0_0_3px_rgba(99,102,241,0.10)]
`;

export default function CardModal({ card, onSave, onClose }) {
  const isNew = !card;
  const [form, setForm] = useState({
    type: card?.type || 'task',
    content: card?.content || '',
    state: card?.state || 'pending',
    meta: card?.meta || {},
  });

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 dark:bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-[420px] rounded-2xl border ${TYPE_BORDER[form.type]} surface-overlay overflow-hidden`}>

        {/* Gradient stripe header accent */}
        <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${TYPE_STRIPE[form.type]} pointer-events-none`} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight">
            {isNew ? 'New Card' : 'Edit Card'}
          </h3>
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

        <form onSubmit={handleSubmit} className="relative p-5 space-y-4">

          {/* Type selector */}
          <InputField label="Type">
            <div className="flex flex-wrap gap-1.5">
              {CARD_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-1 text-[12px] rounded-lg font-medium transition-all duration-120 capitalize ${
                    form.type === t
                      ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/35'
                      : 'bg-white/50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 border border-white/50 dark:border-white/[0.07] hover:bg-white/75 dark:hover:bg-white/[0.08] hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </InputField>

          {/* Content textarea */}
          <InputField label="Content">
            <textarea
              autoFocus
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder={
                form.type === 'video' ? 'Video title or description…'
                : form.type === 'link' ? 'Link title or description…'
                : "What's this about?"
              }
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </InputField>

          {/* URL — video or link */}
          {(form.type === 'video' || form.type === 'link') && (
            <InputField label="URL">
              <input
                value={form.meta.url || ''}
                onChange={e => setForm(f => ({ ...f, meta: { ...f.meta, url: e.target.value } }))}
                placeholder="https://…"
                className={inputClass}
              />
            </InputField>
          )}

          {/* Language — snippet */}
          {form.type === 'snippet' && (
            <InputField label="Language">
              <input
                value={form.meta.language || ''}
                onChange={e => setForm(f => ({ ...f, meta: { ...f.meta, language: e.target.value } }))}
                placeholder="python, js, bash…"
                className={inputClass}
              />
            </InputField>
          )}

          {/* State — editing only */}
          {!isNew && (
            <InputField label="Status">
              <div className="flex gap-1.5">
                {STATES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, state: s }))}
                    className={`flex-1 py-1.5 text-[12px] rounded-lg font-semibold transition-all duration-120 ${
                      form.state === s
                        ? STATE_CONFIG[s].active
                        : 'bg-white/50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-500 border border-white/50 dark:border-white/[0.07] hover:bg-white/70 dark:hover:bg-white/[0.07] hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {STATE_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </InputField>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 text-[13px] font-semibold
                bg-indigo-500 hover:bg-indigo-600
                text-white rounded-xl
                shadow-md shadow-indigo-500/25
                hover:shadow-lg hover:shadow-indigo-500/35
                hover:-translate-y-0.5
                transition-all duration-150"
            >
              {isNew ? 'Create Card' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
