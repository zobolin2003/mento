import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  initialDates: string[];
  onSave: (dates: string[]) => void;
  onClose: () => void;
}

export function RepeatCalendarPopover({ initialDates, onSave, onClose }: Props) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set(initialDates));

  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 3);

  const handleToggleDate = (date: Date) => {
    if (isBefore(date, today) || date > maxDate) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }
    setSelectedDates(newSet);
  };

  const handleSelectEveryday = () => {
    const newSet = new Set(selectedDates);
    let curr = today;
    while (curr <= maxDate) {
      newSet.add(format(curr, 'yyyy-MM-dd'));
      curr = addDays(curr, 1);
    }
    setSelectedDates(newSet);
  };

  const handleClearMonth = () => {
    const newSet = new Set(selectedDates);
    let curr = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    while (curr <= end) {
      newSet.delete(format(curr, 'yyyy-MM-dd'));
      curr = addDays(curr, 1);
    }
    setSelectedDates(newSet);
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-medium text-[#999] dark:text-[var(--muted)] w-8">
          {format(addDays(startDate, i), 'EEEEE')}
        </div>
      );
    }
    return <div className="flex justify-between mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const dateStr = format(cloneDay, 'yyyy-MM-dd');
        const isSelected = selectedDates.has(dateStr);
        const isDisabled = isBefore(cloneDay, today) || cloneDay > maxDate;
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => !isDisabled && handleToggleDate(cloneDay)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors",
              !isCurrentMonth ? "text-transparent pointer-events-none" : "",
              isCurrentMonth && isDisabled ? "text-[#CCC] dark:text-white/20 cursor-not-allowed" : "",
              isCurrentMonth && !isDisabled && !isSelected ? "text-[#666] dark:text-[var(--muted)] hover:bg-[#F0EBE1] dark:hover:bg-white/10 cursor-pointer" : "",
              isSelected ? "bg-[#AEC2A9] text-[#1A2616] dark:bg-[var(--color-primary)] dark:text-white font-medium" : "",
              isToday(cloneDay) && !isSelected ? "border-2 border-[#4A503D] dark:border-[var(--muted)] font-medium text-[#4A503D] dark:text-[var(--title)]" : "",
              isToday(cloneDay) && isSelected ? "border-2 border-[#1A2616] dark:border-white" : ""
            )}
          >
            {isCurrentMonth ? formattedDate : ''}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex justify-between w-full mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col">{rows}</div>;
  };

  return (
    <div className="bg-[#FCFAF8] dark:bg-[var(--card)] border border-[#EAE6DF] dark:border-[var(--border)] rounded-2xl p-4 shadow-xl w-[320px] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#666] dark:text-[var(--muted)]">Select repeat days within the next 3 months</span>
        <button onClick={onClose} className="text-[#666] hover:text-[#333] dark:text-[var(--muted)] dark:hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between px-2">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(today))}
          className="p-1 disabled:opacity-30 text-[#666] dark:text-[var(--muted)] hover:text-[#333] dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-[#333] dark:text-[var(--title)]">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={currentMonth >= startOfMonth(maxDate)}
          className="p-1 disabled:opacity-30 text-[#666] dark:text-[var(--muted)] hover:text-[#333] dark:hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div>
        {renderDays()}
        {renderCells()}
      </div>

      <div className="text-center text-sm text-[#666] dark:text-[var(--muted)]">
        {selectedDates.size} days selected 🌿
      </div>

      <div className="flex flex-col gap-2">
        <button 
          onClick={handleSelectEveryday}
          className="w-full py-2.5 rounded-xl bg-[#D4E0D0] dark:bg-[var(--color-primary)]/20 text-[#2A3626] dark:text-[var(--color-primary)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Select Everyday (Next 3 Months)
        </button>
        <button 
          onClick={() => onSave(Array.from(selectedDates))}
          className="w-full py-2.5 rounded-xl bg-[#AEC2A9] dark:bg-[var(--color-primary)] text-[#1A2616] dark:text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Save
        </button>
        <button 
          onClick={handleClearMonth}
          className="w-full py-2.5 rounded-xl bg-[#E8E9E1] dark:bg-[var(--background)] text-[#4A503D] dark:text-[var(--body)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Clear selection for this month
        </button>
      </div>
    </div>
  );
}
