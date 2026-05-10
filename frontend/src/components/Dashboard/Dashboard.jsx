import SchedulePanel from './SchedulePanel';
import TodoList from './TodoList';
import ClipboardPanel from './ClipboardPanel';
import TodayTrackerStrip from './TodayTrackerStrip';

function PanelLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col overflow-hidden p-3.5 gap-3">

      {/* Three panels */}
      <div className="flex flex-1 gap-3 min-h-0">

        {/* Left — Schedule */}
        <div className="w-[200px] shrink-0 flex flex-col rounded-2xl overflow-hidden surface">
          <SchedulePanel />
        </div>

        {/* Middle — In Progress */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden surface min-w-0">
          <div className="px-5 pt-4 pb-3 shrink-0 border-b border-black/[0.05] dark:border-white/[0.05]">
            <PanelLabel>In Progress</PanelLabel>
            <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 mt-0.5 tracking-tight">
              Active Work
            </p>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <TodoList />
          </div>
        </div>

        {/* Right — Clipboard */}
        <div className="w-[260px] shrink-0 flex flex-col rounded-2xl overflow-hidden surface">
          <ClipboardPanel />
        </div>

      </div>

      {/* Bottom — Today's tracker strip */}
      <div className="rounded-2xl surface shrink-0">
        <TodayTrackerStrip />
      </div>

    </div>
  );
}
