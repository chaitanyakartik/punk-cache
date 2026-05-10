import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useContexts } from '../../hooks/useContexts';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar() {
  const { contexts, loading, createContext } = useContexts();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const ctx = await createContext(newName.trim());
    setNewName('');
    setCreating(false);
    navigate(`/workspace/${ctx.id}`);
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <NavLink to="/" className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Personal OS
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </NavLink>

        <div className="mt-4 mb-1 px-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Workspaces
        </div>

        {loading ? (
          <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
        ) : (
          contexts.map(ctx => (
            <NavLink
              key={ctx.id}
              to={`/workspace/${ctx.id}`}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span className="truncate">{ctx.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 shrink-0">{ctx.summary?.total ?? 0}</span>
            </NavLink>
          ))
        )}

        {creating ? (
          <form onSubmit={handleCreate} className="mt-1 px-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && (setCreating(false), setNewName(''))}
              placeholder="Workspace name..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-400 dark:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="mt-1 flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workspace
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <ThemeToggle />
      </div>
    </aside>
  );
}
