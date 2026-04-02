import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, subDays, subMonths, subYears, subQuarters } from 'date-fns';
import { cn } from '../lib/utils';

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type PresetRange = 
  | 'Last 3 Days' 
  | 'Last Week' 
  | 'Last Month' 
  | 'Last Quarter' 
  | 'Last 6 Months' 
  | 'Last Year'
  | 'Custom';

interface TimeRangeSelectorProps {
  value: { preset: PresetRange; range: DateRange };
  onChange: (value: { preset: PresetRange; range: DateRange }) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [tempPreset, setTempPreset] = useState<PresetRange>(value.preset);
  const [tempRange, setTempRange] = useState<DateRange>(value.range);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: PresetRange) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date = today;

    switch (preset) {
      case 'Last 3 Days':
        from = subDays(today, 3);
        break;
      case 'Last Week':
        from = subDays(today, 7);
        break;
      case 'Last Month':
        from = subMonths(today, 1);
        break;
      case 'Last Quarter':
        from = subQuarters(today, 1);
        break;
      case 'Last 6 Months':
        from = subMonths(today, 6);
        break;
      case 'Last Year':
        from = subYears(today, 1);
        break;
      default:
        from = undefined;
    }

    setTempPreset(preset);
    if (preset !== 'Custom') {
      setTempRange({ from, to });
      onChange({ preset, range: { from, to } });
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    onChange({ preset: 'Custom', range: tempRange });
    setIsOpen(false);
  };

  const displayValue = value.preset === 'Custom' && value.range.from && value.range.to
    ? `${format(value.range.from, 'MMM d, yyyy')} - ${format(value.range.to, 'MMM d, yyyy')}`
    : value.preset;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm font-medium text-[var(--title)] hover:bg-[var(--sidebar-hover)] transition-colors"
      >
        <CalendarIcon size={14} className="text-[var(--muted)]" />
        <span>{displayValue}</span>
        <ChevronDown size={14} className="text-[var(--muted)] ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-[var(--card)] border border-[var(--border)] shadow-xl rounded-xl overflow-hidden z-50 flex flex-col"
          >
            <div className="p-2 space-y-1 border-b border-[var(--border)]">
              {(['Last 3 Days', 'Last Week', 'Last Month', 'Last Quarter', 'Last 6 Months', 'Last Year'] as PresetRange[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    tempPreset === preset 
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium" 
                      : "text-[var(--title)] hover:bg-[var(--sidebar-hover)]"
                  )}
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => setTempPreset('Custom')}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  tempPreset === 'Custom' 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium" 
                    : "text-[var(--title)] hover:bg-[var(--sidebar-hover)]"
                )}
              >
                Custom Range
              </button>
            </div>

            <AnimatePresence>
              {tempPreset === 'Custom' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 bg-[var(--background)]/50"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">Start Date</label>
                      <input 
                        type="date" 
                        value={tempRange.from ? format(tempRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setTempRange({ ...tempRange, from: e.target.value ? new Date(e.target.value) : undefined })}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-md px-2 py-1.5 text-sm text-[var(--title)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">End Date</label>
                      <input 
                        type="date" 
                        value={tempRange.to ? format(tempRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setTempRange({ ...tempRange, to: e.target.value ? new Date(e.target.value) : undefined })}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-md px-2 py-1.5 text-sm text-[var(--title)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <button 
                      onClick={handleCustomApply}
                      disabled={!tempRange.from || !tempRange.to}
                      className="w-full mt-2 bg-[var(--color-primary)] text-white py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Apply Range
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
