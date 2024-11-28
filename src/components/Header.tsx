import React from 'react';
import { Tv, Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-[#2a2a2a] border-b border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Tv className="text-purple-500" size={32} />
          <span className="text-white text-xl font-bold">WebTV</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}