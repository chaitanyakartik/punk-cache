export default function Header({ title, actions }) {
  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
