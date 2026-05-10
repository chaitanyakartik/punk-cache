import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CategoriesProvider, useCategories } from './context/CategoriesContext';
import { useContexts } from './hooks/useContexts';
import Dashboard from './components/Dashboard/Dashboard';
import Workspace from './components/Workspace/Workspace';
import CategoryView from './components/Category/CategoryView';
import CalendarPage from './components/Calendar/CalendarPage';
import LifePage from './components/Life/LifePage';
import CommandBar from './components/CommandBar/CommandBar';

// ─── Workspace color palette ──────────────────────────────────────────────────

export const WORKSPACE_COLORS = [
  { id: 'violet',  hex: '#8b5cf6' },
  { id: 'indigo',  hex: '#6366f1' },
  { id: 'blue',    hex: '#3b82f6' },
  { id: 'cyan',    hex: '#06b6d4' },
  { id: 'emerald', hex: '#10b981' },
  { id: 'rose',    hex: '#f43f5e' },
  { id: 'orange',  hex: '#f97316' },
  { id: 'amber',   hex: '#f59e0b' },
  { id: 'slate',   hex: '#94a3b8' },
];

export const DEFAULT_WORKSPACE_COLOR = WORKSPACE_COLORS[0].hex;

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function SunIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MoonIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
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

function HeartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

// ─── Workspace settings popover (color + category) ───────────────────────────

function WorkspaceSettingsPopover({ currentColor, currentCategory, onSelectColor, onSelectCategory, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1.5 z-50
        p-2.5 rounded-xl
        bg-white/90 dark:bg-[#18182a]/95
        border border-black/[0.08] dark:border-white/[0.09]
        backdrop-blur-xl
        shadow-xl shadow-black/[0.12] dark:shadow-black/[0.50]"
      style={{ minWidth: 148 }}
    >
      <div className="absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent pointer-events-none" />

      {/* Color swatches */}
      <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400/60 dark:text-gray-700 mb-1.5 px-0.5">Color</p>
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {WORKSPACE_COLORS.map(c => (
          <button
            key={c.id}
            title={c.id}
            onClick={() => onSelectColor(c.hex)}
            className="w-7 h-7 rounded-lg transition-all duration-120 flex items-center justify-center"
            style={{ backgroundColor: c.hex + '22', border: `1.5px solid ${c.hex}55` }}
          >
            <span
              className="w-3.5 h-3.5 rounded-full transition-transform duration-120"
              style={{
                backgroundColor: c.hex,
                transform: currentColor === c.hex ? 'scale(1.25)' : 'scale(1)',
                boxShadow: currentColor === c.hex ? `0 0 6px ${c.hex}88` : 'none',
              }}
            />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] mb-2.5" />

      {/* Category */}
      <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400/60 dark:text-gray-700 mb-1.5 px-0.5">Category</p>
      <div className="flex flex-col gap-1">
        {MASTER_CATEGORIES.map(cat => {
          const isActive = currentCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isActive ? null : cat.id)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-120"
              style={isActive ? { backgroundColor: cat.color + '18', color: cat.color } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: cat.color,
                  opacity: isActive ? 1 : 0.5,
                  boxShadow: isActive ? `0 0 4px ${cat.color}88` : 'none',
                }}
              />
              <span className={`text-[11px] font-medium ${isActive ? '' : 'text-gray-500 dark:text-gray-500'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
        {currentCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-120"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300/60 dark:bg-gray-700" />
            <span className="text-[11px] font-medium text-gray-400/70 dark:text-gray-600">None</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Spaces editor ────────────────────────────────────────────────────────────

function InlineColorPicker({ current, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2 mt-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.04]">
      {WORKSPACE_COLORS.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.hex)}
          className="w-5 h-5 rounded-full transition-all duration-100 focus:outline-none"
          style={{
            backgroundColor: c.hex,
            transform: current === c.hex ? 'scale(1.25)' : 'scale(1)',
            boxShadow: current === c.hex ? `0 0 6px ${c.hex}88` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function SpacesEditorPopover({ categories, onClose }) {
  const { categories: _, updateCategoryColor } = useCategories();
  const { contexts, createContext, deleteContext, updateContextColor } = useContexts();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [openColorFor, setOpenColorFor] = useState(null); // 'cat:id' or 'ws:id'
  const [creatingIn, setCreatingIn] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    function handleDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [onClose]);

  const handleCreate = async (e, catId) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const ctx = await createContext(newName.trim(), catId);
    setNewName('');
    setCreatingIn(null);
    navigate(`/workspace/${ctx.id}`);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1.5 z-50 w-72 rounded-2xl overflow-hidden
        bg-white/95 dark:bg-[#13131f]/98
        border border-black/[0.08] dark:border-white/[0.08]
        backdrop-blur-xl shadow-2xl shadow-black/[0.15] dark:shadow-black/[0.6]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent pointer-events-none" />

      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
        <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Spaces</p>
        <p className="text-[11px] text-gray-400/70 dark:text-gray-600 mt-0.5">Manage categories and workspaces</p>
      </div>

      <div className="overflow-y-auto max-h-[72vh] divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {categories.map(cat => {
          const catWs = contexts.filter(c => c.category === cat.id);
          const catKey = `cat:${cat.id}`;
          return (
            <div key={cat.id} className="px-3 py-3">

              {/* Category header */}
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={() => setOpenColorFor(p => p === catKey ? null : catKey)}
                  className="w-3.5 h-3.5 rounded-full shrink-0 transition-transform duration-120 hover:scale-110 focus:outline-none"
                  style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}55` }}
                  title="Change category color"
                />
                <span className="text-[12px] font-bold tracking-wide text-gray-800 dark:text-gray-100">
                  {cat.label}
                </span>
                <span className="ml-auto text-[10px] text-gray-400/50 dark:text-gray-700 font-mono">
                  {catWs.length} space{catWs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {openColorFor === catKey && (
                <InlineColorPicker
                  current={cat.color}
                  onChange={hex => { updateCategoryColor(cat.id, hex); setOpenColorFor(null); }}
                />
              )}

              {/* Workspace rows */}
              <div className="mt-1.5 space-y-0.5 ml-1">
                {catWs.map(ws => {
                  const wsKey = `ws:${ws.id}`;
                  const wsColor = ws.color || DEFAULT_WORKSPACE_COLOR;
                  return (
                    <div key={ws.id}>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg group
                        hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors duration-120">
                        <button
                          onClick={() => setOpenColorFor(p => p === wsKey ? null : wsKey)}
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-120 hover:scale-125 focus:outline-none"
                          style={{ backgroundColor: wsColor }}
                          title="Change workspace color"
                        />
                        <span className="flex-1 text-[12px] text-gray-700 dark:text-gray-300 truncate">
                          {ws.name}
                        </span>
                      </div>
                      {openColorFor === wsKey && (
                        <div className="ml-5">
                          <InlineColorPicker
                            current={wsColor}
                            onChange={hex => { updateContextColor(ws.id, hex); setOpenColorFor(null); }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add workspace */}
                {creatingIn === cat.id ? (
                  <form onSubmit={e => handleCreate(e, cat.id)} className="px-2 py-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Escape' && (setCreatingIn(null), setNewName(''))}
                      onBlur={() => { if (!newName.trim()) setCreatingIn(null); }}
                      placeholder="Workspace name…"
                      className="w-full px-2.5 py-1.5 text-[12px] rounded-lg border outline-none
                        bg-white/60 dark:bg-white/[0.05] text-gray-800 dark:text-gray-200"
                      style={{ borderColor: cat.color + '55' }}
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => { setCreatingIn(cat.id); setOpenColorFor(null); }}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg w-full
                      text-[11px] font-medium transition-all duration-120
                      hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                    style={{ color: cat.color + 'aa' }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add workspace
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

// A single category group: [● General] [ws1] [ws2] [+]
function CategoryGroup({ category, workspaces, pickerOpenFor, setPickerOpenFor, updateContextColor, updateContextCategory }) {
  const navigate = useNavigate();
  const { createContext } = useContexts();
  const [creatingName, setCreatingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!creatingName.trim()) return;
    const ctx = await createContext(creatingName.trim(), category.id);
    setCreatingName('');
    setIsCreating(false);
    navigate(`/workspace/${ctx.id}`);
  };

  return (
    <div
      className="flex items-center gap-0 px-1 py-1 rounded-lg"
      style={{ backgroundColor: category.color + '14', border: `1px solid ${category.color}30` }}
    >
      {/* General tab — navigates to /category/:id */}
      <NavLink
        to={`/category/${category.id}`}
        className="relative flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all duration-150 select-none shrink-0"
        style={({ isActive }) => isActive
          ? { backgroundColor: category.color, color: '#fff', boxShadow: `0 0 10px ${category.color}55` }
          : { backgroundColor: category.color + '33', color: category.color }
        }
      >
        {({ isActive }) => (
          <>
            {category.label}
            {isActive && (
              <span
                className="tab-active-bar"
                style={{ background: `linear-gradient(90deg, ${category.color}cc, ${category.color}66)` }}
              />
            )}
          </>
        )}
      </NavLink>

      {/* Workspace tabs within this category */}
      {workspaces.map(ctx => (
        <div key={ctx.id} className="relative">
          {/* Thin divider before each workspace */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-3 opacity-20"
            style={{ backgroundColor: category.color }} />
          <NavLink
            to={`/workspace/${ctx.id}`}
            className={({ isActive }) =>
              `relative flex items-center px-2.5 py-1 rounded-md text-[12px] transition-all duration-150 max-w-[120px] select-none ${
                isActive
                  ? 'font-medium'
                  : 'hover:text-gray-700 dark:hover:text-gray-400'
              }`
            }
            style={({ isActive }) => isActive
              ? { color: category.color }
              : { color: `${category.color}99` }
            }
          >
            {({ isActive }) => (
              <>
                <span className="truncate">{ctx.name}</span>
                {isActive && (
                  <span
                    className="tab-active-bar"
                    style={{ background: `linear-gradient(90deg, ${category.color}cc, ${category.color}44)` }}
                  />
                )}
              </>
            )}
          </NavLink>

          {pickerOpenFor === ctx.id && (
            <WorkspaceSettingsPopover
              currentColor={ctx.color || DEFAULT_WORKSPACE_COLOR}
              currentCategory={ctx.category || null}
              onSelectColor={hex => updateContextColor(ctx.id, hex)}
              onSelectCategory={cat => updateContextCategory(ctx.id, cat)}
              onClose={() => setPickerOpenFor(null)}
            />
          )}
        </div>
      ))}

      {/* Scoped + button */}
      <div className="pl-1">
        {isCreating ? (
          <form onSubmit={handleCreate}>
            <input
              autoFocus
              value={creatingName}
              onChange={e => setCreatingName(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && (setIsCreating(false), setCreatingName(''))}
              onBlur={() => { if (!creatingName.trim()) setIsCreating(false); }}
              placeholder="Name…"
              className="w-24 px-2 py-0.5 text-[12px] rounded-md
                border outline-none"
              style={{ borderColor: category.color + '55', color: 'inherit',
                backgroundColor: 'rgba(255,255,255,0.6)' }}
            />
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            title={`New ${category.label} workspace`}
            className="w-5 h-5 rounded-md flex items-center justify-center
              transition-all duration-150 focus:outline-none"
            style={{ color: category.color + '88' }}
            onMouseEnter={e => e.currentTarget.style.color = category.color}
            onMouseLeave={e => e.currentTarget.style.color = category.color + '88'}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function TabBar({ onOpenCommandBar }) {
  const { contexts, loading, updateContextColor, updateContextCategory } = useContexts();
  const { categories } = useCategories();
  const { theme, toggleTheme } = useTheme();
  const [pickerOpenFor, setPickerOpenFor] = useState(null);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const spacesRef = useRef(null);

  return (
    <div className="flex items-center h-11 px-2 gap-1.5 shrink-0 relative z-10
      bg-white/60 dark:bg-[#0a0a14]/85
      border-b border-black/[0.07] dark:border-white/[0.055]
      backdrop-blur-2xl">

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent pointer-events-none" />

      {/* Home tab */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 select-none ${
            isActive
              ? 'bg-black/[0.07] dark:bg-white/[0.09] text-gray-900 dark:text-white'
              : 'text-gray-500/80 dark:text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-gray-300'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <HomeIcon className="w-3.5 h-3.5 opacity-75" />
            Home
            {isActive && <span className="tab-active-bar" />}
          </>
        )}
      </NavLink>

      {/* Calendar tab */}
      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          `relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 select-none ${
            isActive
              ? 'bg-black/[0.07] dark:bg-white/[0.09] text-gray-900 dark:text-white'
              : 'text-gray-500/80 dark:text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-gray-300'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <CalendarIcon className="w-3.5 h-3.5 opacity-75" />
            Calendar
            {isActive && <span className="tab-active-bar" />}
          </>
        )}
      </NavLink>

      {/* Life tab */}
      <NavLink
        to="/life"
        className={({ isActive }) =>
          `relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 select-none ${
            isActive
              ? 'bg-black/[0.07] dark:bg-white/[0.09] text-gray-900 dark:text-white'
              : 'text-gray-500/80 dark:text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-gray-300'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <HeartIcon className="w-3.5 h-3.5 opacity-75" />
            Life
            {isActive && <span className="tab-active-bar" />}
          </>
        )}
      </NavLink>

      {/* Separator */}
      <div className="w-px h-4 bg-black/[0.09] dark:bg-white/[0.09] mx-0.5" />

      {/* Category groups */}
      {!loading && categories.map(cat => (
        <CategoryGroup
          key={cat.id}
          category={cat}
          workspaces={contexts.filter(c => c.category === cat.id)}
          pickerOpenFor={pickerOpenFor}
          setPickerOpenFor={setPickerOpenFor}
          updateContextColor={updateContextColor}
          updateContextCategory={updateContextCategory}
        />
      ))}

      <div className="flex-1" />

      {/* Cmd+K button */}
      <button
        onClick={onOpenCommandBar}
        title="Open AI command bar (⌘K)"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          text-gray-400/70 dark:text-gray-600
          hover:bg-black/[0.05] dark:hover:bg-white/[0.06]
          hover:text-gray-600 dark:hover:text-gray-300
          transition-all duration-150"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <kbd className="text-[10px] font-mono text-gray-400/50 dark:text-gray-700">⌘K</kbd>
      </button>

      {/* Spaces editor button */}
      <div ref={spacesRef} className="relative">
        <button
          onClick={() => setSpacesOpen(p => !p)}
          title="Edit spaces"
          className={`p-1.5 rounded-md transition-all duration-150
            ${spacesOpen
              ? 'bg-black/[0.07] dark:bg-white/[0.09] text-gray-700 dark:text-gray-200'
              : 'text-gray-400/70 dark:text-gray-600 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-300'
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
        {spacesOpen && (
          <SpacesEditorPopover
            categories={categories}
            onClose={() => setSpacesOpen(false)}
          />
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        className="p-1.5 rounded-md
          text-gray-400/70 dark:text-gray-600
          hover:bg-black/[0.05] dark:hover:bg-white/[0.06]
          hover:text-gray-600 dark:hover:text-gray-300
          transition-all duration-150"
      >
        {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}


// ─── App shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const location = useLocation();
  const { contexts } = useContexts();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Parse current contextId from URL (e.g. /workspace/ml-research → ml-research)
  const wsMatch = location.pathname.match(/^\/workspace\/(.+)$/);
  const contextId = wsMatch ? wsMatch[1] : null;
  const contextName = contextId ? contexts.find(c => c.id === contextId)?.name : null;

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden
      bg-[#eeeef3] dark:bg-[#070710]
      text-gray-900 dark:text-gray-100">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 w-2/3 h-2/3 rounded-full
          bg-indigo-200/25 dark:bg-indigo-900/15 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full
          bg-violet-200/20 dark:bg-violet-900/12 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full
          bg-sky-100/15 dark:bg-sky-900/8 blur-[80px]" />
      </div>

      <TabBar onOpenCommandBar={() => setCmdOpen(true)} />

      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/life" element={<LifePage />} />
          <Route path="/category/:categoryId" element={<CategoryView />} />
          <Route path="/workspace/:contextId" element={<Workspace />} />
        </Routes>
      </div>

      <CommandBar
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        contextId={contextId}
        contextName={contextName}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CategoriesProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </CategoriesProvider>
    </ThemeProvider>
  );
}
