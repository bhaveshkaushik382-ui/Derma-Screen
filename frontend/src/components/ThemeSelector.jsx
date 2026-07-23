import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector({ align = 'right', compact = false, fullWidth = false, direction = 'down' }) {
  const { theme, setTheme, THEMES, currentThemeObj } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'} text-left`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-outline-variant/60 bg-surface/70 hover:bg-surface-container hover:border-primary/50 transition-all cursor-pointer text-on-surface shadow-sm ${
          fullWidth ? 'w-full' : ''
        } ${compact ? 'text-xs' : 'text-sm font-medium'}`}
        title="Change Theme"
        type="button"
      >
        <div className="flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-colors"
            style={{ backgroundColor: currentThemeObj.color }}
          />
          <span className="material-symbols-outlined text-[18px] text-primary">
            {currentThemeObj.icon}
          </span>
          <span className="font-label-md">
            {currentThemeObj.name}
          </span>
        </div>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-60 rounded-2xl bg-surface/95 backdrop-blur-xl border border-outline-variant shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${align === 'left' ? 'left-0' : 'right-0'}`}
        >

          <div className="px-3 py-2 text-xs font-semibold text-on-surface-variant/80 border-b border-outline-variant/40 flex items-center justify-between">
            <span>Select Theme</span>
            <span className="material-symbols-outlined text-[14px]">palette</span>
          </div>

          <div className="py-1">
            {THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      {t.icon}
                    </span>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{t.name}</div>
                      <div className="text-[10px] text-on-surface-variant opacity-80 leading-tight">{t.desc}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
