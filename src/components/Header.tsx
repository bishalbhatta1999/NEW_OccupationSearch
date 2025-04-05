import React from 'react';
import { Search, ExternalLink, LogIn, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onHomeClick: () => void;
  onSignInClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, onSignInClick }) => {
  return (
    <header className="bg-white border-b sticky top-0 z-50 px-4 sm:px-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo and Title */}
          <div 
            className="flex items-center space-x-4 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={onHomeClick}
          >
            <div className="relative w-10 h-10 sm:w-14 sm:h-14">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 374.999991" className="w-full h-full">
                <defs>
                  <clipPath id="logo-clip">
                    <path d="M 0 89.5 L 375 89.5 L 375 285 L 0 285 Z M 0 89.5" />
                  </clipPath>
                </defs>
                <g clipPath="url(#logo-clip)">
                  <path fill="#4F46E5" d="M187.5 89.5c-54.1 0-98 43.9-98 98s43.9 98 98 98 98-43.9 98-98-43.9-98-98-98zm0 176.4c-43.3 0-78.4-35.1-78.4-78.4s35.1-78.4 78.4-78.4 78.4 35.1 78.4 78.4-35.1 78.4-78.4 78.4z"/>
                  <path fill="#3B82F6" d="M187.5 128.7c-32.5 0-58.8 26.3-58.8 58.8s26.3 58.8 58.8 58.8 58.8-26.3 58.8-58.8-26.3-58.8-58.8-58.8zm0 98c-21.7 0-39.2-17.5-39.2-39.2s17.5-39.2 39.2-39.2 39.2 17.5 39.2 39.2-17.5 39.2-39.2 39.2z"/>
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600">
               <Link to={'/'}>Occupation Search</Link>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Your trusted source for ANZSCO occupation information
              </p>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Resources</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={onSignInClick}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-medium whitespace-nowrap"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <button className="md:hidden hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;