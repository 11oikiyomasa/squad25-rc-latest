import { FC } from 'react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationDrawer: FC<NavigationDrawerProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>
      )}
      
      <div 
        className={`fixed left-0 top-0 z-30 h-full w-4/5 max-w-sm transform bg-[#171717] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <button 
              onClick={onClose}
              className="flex flex-col gap-1 p-1"
              aria-label="Close menu"
            >
              <span className="h-0.5 w-6 bg-white"></span>
              <span className="h-0.5 w-6 bg-white"></span>
              <span className="h-0.5 w-6 bg-white"></span>
            </button>
            <h2 className="text-2xl font-serif font-bold text-white">Editorial</h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-6">
              <li>
                <a href="#" className="flex items-center gap-3 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  Library
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.293l5.414 5.414A1 1 0 0120 7.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5" />
                  </svg>
                  Stories
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Stats
                </a>
              </li>
            </ul>
            
            <div className="my-8 border-t border-gray-800"></div>
            
            <ul className="space-y-6">
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Games
                  <span className="ml-2 rounded bg-yellow-400 px-2 py-0.5 text-xs text-gray-900">Beta</span>
                </a>
              </li>
            </ul>
            
            <div className="my-8 border-t border-gray-800"></div>
            
            <ul className="space-y-6">
              <li>
                <div className="mb-4 text-gray-500">Following</div>
                <ul className="space-y-4">
                  <li>
                    <a href="#" className="flex items-center gap-3 text-gray-500">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs text-white">A</div>
                      AI_Chief
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center gap-3 text-gray-500">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">L</div>
                      Libera Global AI
                    </a>
                  </li>
                </ul>
              </li>
              
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Find writers and publications to follow
                </a>
              </li>
              
              <li>
                <a href="#" className="flex items-center gap-3 text-gray-500">
                  See suggestions
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};