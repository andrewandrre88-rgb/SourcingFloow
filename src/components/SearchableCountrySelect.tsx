import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Globe } from 'lucide-react';
import { COUNTRIES, findCountry, getCountryFlag, CountryData } from '../lib/countryFlags';

interface SearchableCountrySelectProps {
  id?: string;
  value: string;
  onChange: (countryName: string) => void;
  className?: string;
  placeholder?: string;
}

export const SearchableCountrySelect: React.FC<SearchableCountrySelectProps> = ({
  id = 'client-country-select',
  value,
  onChange,
  className = '',
  placeholder = 'Select destination country...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentCountry = useMemo(() => findCountry(value), [value]);
  const currentFlag = getCountryFlag(value);

  // Filter countries by name, ISO code, or dial code
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;

    const cleanDial = q.startsWith('+') ? q : `+${q}`;
    return COUNTRIES.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase() === q;
      const matchDial = c.dialCode.includes(q) || c.dialCode === cleanDial;
      return matchName || matchCode || matchDial;
    });
  }, [searchQuery]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden native select for standard HTML form queries / testing compatibility */}
      <select
        id={id}
        value={value || 'United States'}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.name}>
            {c.flag} {c.name} ({c.dialCode})
          </option>
        ))}
      </select>

      {/* Visible Combobox Trigger Button */}
      <button
        type="button"
        id={`${id}-trigger`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-md text-xs text-slate-800 transition shadow-2xs cursor-pointer ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-100'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <span className="text-base leading-none shrink-0" role="img" aria-label={value || 'Flag'}>
            {currentFlag}
          </span>
          <span className="font-semibold text-slate-900 truncate">
            {value || placeholder}
          </span>
          {currentCountry && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {currentCountry.dialCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
          />
        </div>
      </button>

      {/* Search Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                id="country-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search country, code or dial code (e.g. Saudi, +966, US)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1.5 font-medium">
              <span>{filteredCountries.length} countries found</span>
              <span className="text-slate-400">Press Esc to close</span>
            </div>
          </div>

          {/* Country Results List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-50 scrollbar-thin scrollbar-thumb-slate-200"
          >
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = value?.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1 rounded">
                        {c.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {c.dialCode}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <Globe className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  No predefined country found for &ldquo;<span className="text-slate-900 font-semibold">{searchQuery}</span>&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery.trim())}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition"
                >
                  Use &ldquo;{searchQuery.trim()}&rdquo; anyway
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
