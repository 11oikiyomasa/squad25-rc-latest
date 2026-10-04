interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-800 bg-[#171717] px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="flex flex-col gap-1 p-1" aria-label="Open menu">
          <span className="h-0.5 w-6 bg-white"></span><span className="h-0.5 w-6 bg-white"></span><span className="h-0.5 w-6 bg-white"></span>
        </button>
        <h1 className="text-3xl font-serif font-bold text-white">Editorial</h1>
      </div>
      <div className="flex items-center gap-4">
        <button aria-label="Search"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-white" aria-label="User profile">A</button>
      </div>
    </header>
  );
}
