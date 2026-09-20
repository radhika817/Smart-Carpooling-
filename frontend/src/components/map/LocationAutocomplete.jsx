import React, { useState, useEffect, useRef } from 'react';
import { searchAddressNominatim } from '../../utils/geo';
import { MapPin, Search, Loader2, Compass } from 'lucide-react';

export const LocationAutocomplete = ({
  value,
  onChange,
  onSelectLocation,
  onOpenMapPicker,
  placeholder = 'Search address or campus landmark...',
  label = 'Location',
  iconColor = 'text-emerald-600',
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync internal input value if external prop changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounced search via Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchAddressNominatim(query);
      setSuggestions(results);
      setLoading(false);
      setIsOpen(results.length > 0);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.address);
    setIsOpen(false);
    if (onChange) onChange(item.address);
    if (onSelectLocation) onSelectLocation(item);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
          {onOpenMapPicker && (
            <button
              type="button"
              onClick={onOpenMapPicker}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pick on map</span>
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <MapPin className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2 flex-shrink-0`} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-elevated divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-emerald-50/50 cursor-pointer flex items-start gap-2.5 transition text-left"
            >
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 leading-tight">{item.shortName}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.address}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
