import React from 'react';
import { ShirtIcon, MailIcon } from './icons';

interface HeaderProps {
  onOpenContact?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenContact }) => {
  return (
    <header className="w-full py-4 px-4 md:px-8 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShirtIcon className="w-6 h-6 text-gray-800" />
        <h1 className="text-2xl font-serif tracking-widest text-gray-900 font-bold">
          Sabhyam Ai
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {onOpenContact ? (
          <button
            type="button"
            onClick={onOpenContact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200"
            title="Contact support at sabhyamtrivedy@gmail.com"
          >
            <MailIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>Contact Us</span>
          </button>
        ) : (
          <a
            href="mailto:sabhyamtrivedy@gmail.com"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200"
          >
            <MailIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>Contact Us</span>
          </a>
        )}
      </div>
    </header>
  );
};

export default Header;