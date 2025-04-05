import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface DropdownFilterProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Adjust dropdown position dynamically
  useEffect(() => {
    if (isOpen && listboxRef.current && dropdownRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const listbox = listboxRef.current;
      const viewportHeight = window.innerHeight;
      const dropdownHeight = listbox.offsetHeight;

      if (dropdownRect.bottom + dropdownHeight > viewportHeight) {
        listbox.style.top = 'auto';
        listbox.style.bottom = '100%';
        listbox.style.marginBottom = '4px';
      } else {
        listbox.style.top = '100%';
        listbox.style.bottom = 'auto';
        listbox.style.marginTop = '4px';
      }
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Enter':
      case 'ArrowDown':
        if (!isOpen) setIsOpen(true);
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full h-[42px] rounded-lg bg-white px-4 text-left
          border shadow-sm transition-colors duration-200
          flex items-center justify-between gap-2
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
          ${error ? 'border-red-300' : 'border-gray-200'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-base">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </span>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && !disabled && (
        <div 
          ref={listboxRef}
          className="absolute left-0 right-0 z-50 mt-1 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto"
          style={{ width: dropdownRef.current?.offsetWidth }}
        >
          <ul
            className="py-1"
            role="listbox"
            tabIndex={-1}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`
                  px-4 py-2.5 text-base cursor-pointer select-none
                  transition-colors duration-150 flex items-center justify-between
                  ${value === option.value
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-50'
                  }
                `}
                role="option"
                aria-selected={value === option.value}
              >
                <span className="block truncate">
                  {option.label}
                </span>
                {value === option.value && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};