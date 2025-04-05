import React from 'react';
import { Search } from 'lucide-react';

const SearchHero: React.FC = () => {
  return (
    <div className="mb-8 sm:mb-12 space-y-6 sm:space-y-8 text-center px-4">
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-8">
        Find Your Path to Australia
      </h2>
      <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
        The most comprehensive platform for skilled migration pathways.
      </p>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search occupation (e.g., Software Engineer, Teacher)..."
          className="block w-full pl-10 pr-3 py-3 sm:py-4 border-2 border-gray-200 rounded-xl 
                   text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm
                   shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-200
                   text-sm sm:text-base"
        />
      </div>
    </div>
  );
};

export default SearchHero;