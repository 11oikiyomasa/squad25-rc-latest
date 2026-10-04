export function OpenInAppBar() {
  return (
    <div className="flex h-10 items-center justify-center border-b border-t border-gray-800 bg-[#171717]">
      <div className="flex items-center gap-1 text-gray-300">
        <span>Open in app</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}