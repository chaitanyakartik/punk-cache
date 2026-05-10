import { Link } from 'react-router-dom';
import { useContexts } from '../../hooks/useContexts';

const GRADIENTS = [
  'from-indigo-500/10 to-violet-500/10 border-indigo-200/50 dark:border-indigo-500/20 hover:shadow-indigo-500/10',
  'from-violet-500/10 to-purple-500/10 border-violet-200/50 dark:border-violet-500/20 hover:shadow-violet-500/10',
  'from-cyan-500/10 to-blue-500/10 border-cyan-200/50 dark:border-cyan-500/20 hover:shadow-cyan-500/10',
  'from-emerald-500/10 to-teal-500/10 border-emerald-200/50 dark:border-emerald-500/20 hover:shadow-emerald-500/10',
  'from-orange-500/10 to-rose-500/10 border-orange-200/50 dark:border-orange-500/20 hover:shadow-orange-500/10',
  'from-pink-500/10 to-rose-500/10 border-pink-200/50 dark:border-pink-500/20 hover:shadow-pink-500/10',
];

const DOT_COLORS = [
  'bg-indigo-400', 'bg-violet-400', 'bg-cyan-400',
  'bg-emerald-400', 'bg-orange-400', 'bg-pink-400',
];

export default function WorkspaceLinks() {
  const { contexts, loading } = useContexts();

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-24 rounded-2xl bg-white/30 dark:bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  if (!contexts.length) return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center text-sm text-gray-400 dark:text-gray-600">
      No workspaces yet — click <strong>+</strong> in the tab bar to create one.
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {contexts.map((ctx, i) => {
        const grad = GRADIENTS[i % GRADIENTS.length];
        const dot = DOT_COLORS[i % DOT_COLORS.length];
        return (
          <Link
            key={ctx.id}
            to={`/workspace/${ctx.id}`}
            className={`group relative rounded-2xl border bg-gradient-to-br ${grad} p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{ctx.summary?.total ?? 0} cards</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              {ctx.name}
            </h3>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                {ctx.summary?.pending ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {ctx.summary?.ongoing ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {ctx.summary?.done ?? 0}
              </span>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
