import { MASTER_CATEGORIES } from '../../constants/categories';

const DEFAULT_COLOR = '#8b5cf6';

function CategoryColumn({ category, workspaces, filter, onFilterChange }) {
  const isGeneralActive =
    filter?.type === 'category' && filter.id === category.id;

  const selectGeneral = () => {
    if (isGeneralActive) { onFilterChange(null); return; }
    onFilterChange({ type: 'category', id: category.id });
  };

  const selectWorkspace = (ctx) => {
    const isActive = filter?.type === 'context' && filter.id === ctx.id;
    if (isActive) { onFilterChange(null); return; }
    onFilterChange({ type: 'context', id: ctx.id });
  };

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border border-black/[0.05] dark:border-white/[0.05]"
      style={{ backgroundColor: category.color + '0a' }}
    >
      {/* Category header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.05] dark:border-white/[0.05]"
        style={{ borderBottomColor: category.color + '22' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: category.color, boxShadow: `0 0 5px ${category.color}66` }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-[0.10em]"
          style={{ color: category.color }}
        >
          {category.label}
        </span>
        {workspaces.length > 0 && (
          <span className="ml-auto text-[10px] tabular-nums font-mono" style={{ color: category.color + '88' }}>
            {workspaces.length}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">

        {/* General — always present */}
        <button
          onClick={selectGeneral}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-120"
          style={isGeneralActive ? {
            backgroundColor: category.color + '1a',
            color: category.color,
          } : {}}
        >
          <span
            className="w-1 h-1 rounded-full shrink-0 transition-all duration-150"
            style={{
              backgroundColor: isGeneralActive ? category.color : category.color + '55',
              boxShadow: isGeneralActive ? `0 0 4px ${category.color}88` : 'none',
            }}
          />
          <span className={`text-[12px] font-medium truncate transition-colors duration-120 ${
            isGeneralActive
              ? ''
              : 'text-gray-500/80 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}>
            General
          </span>
        </button>

        {/* Sub-workspaces */}
        {workspaces.map(ctx => {
          const wsColor = ctx.color || DEFAULT_COLOR;
          const isActive = filter?.type === 'context' && filter.id === ctx.id;
          return (
            <button
              key={ctx.id}
              onClick={() => selectWorkspace(ctx)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-120"
              style={isActive ? {
                backgroundColor: wsColor + '18',
                color: wsColor,
              } : {}}
            >
              <span
                className="w-1 h-1 rounded-full shrink-0 transition-all duration-150"
                style={{
                  backgroundColor: isActive ? wsColor : wsColor + '66',
                  boxShadow: isActive ? `0 0 4px ${wsColor}88` : 'none',
                }}
              />
              <span className={`text-[12px] font-medium truncate transition-colors duration-120 ${
                isActive
                  ? ''
                  : 'text-gray-500/80 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
                {ctx.name}
              </span>
            </button>
          );
        })}

        {/* Empty hint */}
        {workspaces.length === 0 && (
          <p className="px-2.5 py-1 text-[11px] text-gray-400/40 dark:text-gray-700 italic">
            No workspaces
          </p>
        )}

      </div>
    </div>
  );
}

export default function WorkspaceNav({ contexts, filter, onFilterChange }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 p-3 shrink-0">
      {MASTER_CATEGORIES.map(cat => (
        <CategoryColumn
          key={cat.id}
          category={cat}
          workspaces={contexts.filter(ctx => ctx.category === cat.id)}
          filter={filter}
          onFilterChange={onFilterChange}
        />
      ))}
    </div>
  );
}
