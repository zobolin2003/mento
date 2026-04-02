import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Target, Flame, Calendar as CalendarIcon, Trash2, ChevronDown, ChevronUp, AlertTriangle, BarChart2, Award, Share2, MessageSquare, X, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import * as htmlToImage from 'html-to-image';

interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  history: string[]; // Array of ISO date strings
  notes?: Record<string, string>;
}

const initialHabits: Habit[] = [
  { id: '1', name: 'Drink Water', color: 'bg-blue-500', icon: '💧', createdAt: Date.now(), history: [new Date().toISOString()] },
  { id: '2', name: 'Read 20 pages', color: 'bg-purple-500', icon: '📚', createdAt: Date.now(), history: [] },
  { id: '3', name: 'Workout', color: 'bg-orange-500', icon: '💪', createdAt: Date.now(), history: [subDays(new Date(), 1).toISOString()] },
];

const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500'];
const icons = ['💧', '📚', '💪', '🧘‍♀️', '🍎', '🚶‍♂️', '💻', '🎸'];

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('mento-habits');
    return saved ? JSON.parse(saved) : initialHabits;
  });
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedIcon, setSelectedIcon] = useState(icons[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [dayModal, setDayModal] = useState<{ habitId: string, date: Date, isCompleted: boolean, note: string } | null>(null);
  const [shareHabit, setShareHabit] = useState<Habit | null>(null);
  const [shareFormat, setShareFormat] = useState<'snapshot' | 'calendar'>('snapshot');
  const [username, setUsername] = useState(() => localStorage.getItem('mento-username') || 'Mento User');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mento-habits', JSON.stringify(habits));
  }, [habits]);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      color: selectedColor,
      icon: selectedIcon,
      createdAt: Date.now(),
      history: [],
    };

    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setIsAdding(false);
  };

  const toggleCheckIn = (habitId: string) => {
    const today = new Date();
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const hasCheckedInToday = habit.history.some(date => isSameDay(new Date(date), today));
        if (hasCheckedInToday) {
          // Remove today's check-in
          return { ...habit, history: habit.history.filter(date => !isSameDay(new Date(date), today)) };
        } else {
          // Add today's check-in
          return { ...habit, history: [...habit.history, today.toISOString()] };
        }
      }
      return habit;
    }));
  };

  const openDayModal = (habit: Habit, date: Date) => {
    const isCompleted = habit.history.some(d => isSameDay(new Date(d), date));
    const note = habit.notes?.[format(date, 'yyyy-MM-dd')] || '';
    setDayModal({ habitId: habit.id, date, isCompleted, note });
  };

  const handleSaveDayDetails = () => {
    if (!dayModal) return;
    setHabits(habits.map(habit => {
      if (habit.id === dayModal.habitId) {
        const dateKey = format(dayModal.date, 'yyyy-MM-dd');
        const hasCheckedIn = habit.history.some(d => isSameDay(new Date(d), dayModal.date));
        
        let newHistory = [...habit.history];
        if (dayModal.isCompleted && !hasCheckedIn) {
          newHistory.push(dayModal.date.toISOString());
        } else if (!dayModal.isCompleted && hasCheckedIn) {
          newHistory = newHistory.filter(d => !isSameDay(new Date(d), dayModal.date));
        }

        const newNotes = { ...(habit.notes || {}) };
        if (dayModal.note.trim()) {
          newNotes[dateKey] = dayModal.note.trim();
        } else {
          delete newNotes[dateKey];
        }

        return { ...habit, history: newHistory, notes: newNotes };
      }
      return habit;
    }));
    setDayModal(null);
  };

  const downloadShareCard = async () => {
    if (!shareCardRef.current || !shareHabit || isGeneratingImage) return;
    
    setIsGeneratingImage(true);
    setShareSuccess(null);
    
    try {
      const element = shareCardRef.current;
      
      const blob = await htmlToImage.toBlob(element, { 
        backgroundColor: null, 
        pixelRatio: 3,
      });

      if (!blob) throw new Error('Failed to create blob');

      let copied = false;
      try {
        // Try standard clipboard API (Chrome/Edge/Firefox)
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copied = true;
        setShareSuccess('已复制');
      } catch (clipboardError) {
        console.error('Standard clipboard copy failed:', clipboardError);
        try {
          // Try Promise-based clipboard API (Safari requires this to preserve user gesture)
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': Promise.resolve(blob)
            })
          ]);
          copied = true;
          setShareSuccess('已复制');
        } catch (safariError) {
          console.error('Safari clipboard copy failed:', safariError);
        }
      }

      if (!copied) {
        // Fallback: Show image in a modal for manual copy/save (especially for WeChat/mobile or restricted iframes)
        const url = URL.createObjectURL(blob);
        setGeneratedImageUrl(url);
        setShareSuccess('请长按或右键复制图片');
      }
    } catch (err) {
      console.error('Failed to generate image', err);
      setShareSuccess('生成失败');
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => {
        setShareSuccess(prev => prev === '已复制' ? null : prev);
      }, 3000);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setUsername(newName);
    localStorage.setItem('mento-username', newName);
    setGeneratedImageUrl(null);
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    setHabitToDelete(null);
  };

  const getLongestStreak = (history: string[]) => {
    if (history.length === 0) return 0;
    const sortedDates = [...new Set(history.map(d => format(new Date(d), 'yyyy-MM-dd')))].sort();
    if (sortedDates.length === 0) return 0;
    
    let longest = 1;
    let current = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i-1]);
      const currDate = new Date(sortedDates[i]);
      const expectedNextDate = new Date(prevDate);
      expectedNextDate.setDate(expectedNextDate.getDate() + 1);
      
      if (isSameDay(expectedNextDate, currDate)) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  };

  const getStreak = (history: string[]) => {
    if (history.length === 0) return 0;
    
    const sortedDates = [...history].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    let currentDate = new Date();
    
    // Check if checked in today or yesterday to start counting
    const hasToday = sortedDates.some(d => isSameDay(d, currentDate));
    const hasYesterday = sortedDates.some(d => isSameDay(d, subDays(currentDate, 1)));
    
    if (!hasToday && !hasYesterday) return 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const dateToCheck = subDays(currentDate, i);
      if (sortedDates.some(d => isSameDay(d, dateToCheck))) {
        streak++;
      } else if (i > 0) { // Allow missing today, but break if missing past days
        break;
      }
    }
    return streak;
  };

  // Generate last 7 days for the mini heat map
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--title)]">Habits</h1>
          <p className="text-[var(--muted)] mt-1">Build consistency and track your progress.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Habit
        </button>
      </header>

      {/* Add Habit Form */}
      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleAddHabit} 
          className="card-container p-6 space-y-6 overflow-hidden"
        >
          <div>
            <label className="block text-sm font-medium text-[var(--body)] mb-2">Habit Name</label>
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="input-field w-full bg-[var(--background)]"
              placeholder="e.g., Read 20 pages"
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--body)] mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {icons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                      selectedIcon === icon ? "bg-[var(--background)] ring-2 ring-[var(--color-primary)]" : "hover:bg-[var(--background)]"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--body)] mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all flex items-center justify-center",
                      color,
                      selectedColor === color ? "ring-2 ring-offset-2 ring-offset-[var(--card)] ring-[var(--title)] scale-110" : "hover:scale-110 opacity-80"
                    )}
                  >
                    {selectedColor === color && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Habit
            </button>
          </div>
        </motion.form>
      )}

      {/* Habits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.map((habit, index) => {
          const today = new Date();
          const isCheckedToday = habit.history.some(date => isSameDay(new Date(date), today));
          const streak = getStreak(habit.history);
          const isExpanded = expandedHabitId === habit.id;

          return (
            <motion.div 
              key={habit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "card-container p-6 flex flex-col transition-all duration-300",
                isExpanded ? "md:col-span-2 shadow-lg ring-1 ring-[var(--border)]" : ""
              )}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm", habit.color)}>
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--title)] text-lg hover:text-[var(--color-primary)] transition-colors">{habit.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Flame size={14} className={streak > 0 ? "text-orange-500" : ""} />
                        {streak} day streak
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={14} />
                        {habit.history.length} total
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShareHabit(habit); }}
                    className="p-2 text-[var(--muted)] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Share habit"
                  >
                    <Share2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setExpandedHabitId(isExpanded ? null : habit.id); }}
                    className="p-2 text-[var(--muted)] hover:text-[var(--title)] hover:bg-[var(--background)] rounded-lg transition-colors"
                    title={isExpanded ? "Collapse details" : "Expand details"}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setHabitToDelete(habit.id); }}
                    className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Mini Heatmap (Hidden when expanded) */}
              <AnimatePresence>
                {!isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between mb-6 px-2 overflow-hidden"
                  >
                    {last7Days.map((date, i) => {
                      const isChecked = habit.history.some(d => isSameDay(new Date(d), date));
                      const isToday = isSameDay(date, today);
                      return (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <span className={cn("text-xs font-medium", isToday ? "text-[var(--title)]" : "text-[var(--muted)]")}>
                            {format(date, 'EEEE').charAt(0)}
                          </span>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isChecked ? habit.color + " shadow-sm" : "bg-[var(--background)] border border-[var(--border)]",
                            isToday && !isChecked ? "ring-2 ring-[var(--color-primary)]/30 ring-offset-2 ring-offset-[var(--card)]" : ""
                          )}>
                            {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded Stats & Calendar */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-6 border-t border-[var(--border)] mt-2 mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {/* Stats Column */}
                        <div className="flex flex-col gap-4">
                          <div className="bg-[var(--background)] p-5 rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center shadow-sm">
                            <Award size={28} className="text-yellow-500 mb-2" />
                            <span className="text-3xl font-bold text-[var(--title)]">{getLongestStreak(habit.history)}</span>
                            <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mt-1">Best Streak</span>
                          </div>
                          <div className="bg-[var(--background)] p-5 rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center shadow-sm">
                            <BarChart2 size={28} className="text-blue-500 mb-2" />
                            <span className="text-3xl font-bold text-[var(--title)]">
                              {habit.history.length > 0 ? Math.round((habit.history.length / Math.max(1, Math.floor((Date.now() - habit.createdAt) / (1000 * 60 * 60 * 24)) + 1)) * 100) : 0}%
                            </span>
                            <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mt-1">Completion Rate</span>
                          </div>
                        </div>

                        {/* Calendar Column */}
                        <div className="md:col-span-2 bg-[var(--background)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-[var(--title)] text-lg flex items-center gap-2">
                              <CalendarIcon size={20} className="text-[var(--color-primary)]" />
                              {format(currentMonthDate, 'MMMM yyyy')}
                            </h4>
                            <div className="flex gap-2 bg-[var(--card)] rounded-lg p-1 border border-[var(--border)]">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setCurrentMonthDate(subDays(startOfMonth(currentMonthDate), 1)); }}
                                className="p-1.5 hover:bg-[var(--background)] rounded-md text-[var(--muted)] hover:text-[var(--title)] transition-colors"
                              >
                                <ChevronDown size={18} className="rotate-90" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)); }}
                                className="p-1.5 hover:bg-[var(--background)] rounded-md text-[var(--muted)] hover:text-[var(--title)] transition-colors"
                              >
                                <ChevronDown size={18} className="-rotate-90" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-2 text-center mb-3">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                              <div key={day} className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: getDay(startOfMonth(currentMonthDate)) }).map((_, i) => (
                              <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[72px]" />
                            ))}
                            {eachDayOfInterval({ start: startOfMonth(currentMonthDate), end: endOfMonth(currentMonthDate) }).map((date, i) => {
                              const isChecked = habit.history.some(d => isSameDay(new Date(d), date));
                              const isTodayDate = isSameDay(date, new Date());
                              const isFuture = date > new Date();
                              const dateKey = format(date, 'yyyy-MM-dd');
                              const hasNote = habit.notes && habit.notes[dateKey];

                              return (
                                <div 
                                  key={i} 
                                  onClick={(e) => {
                                    if (!isFuture) {
                                      e.stopPropagation();
                                      openDayModal(habit, date);
                                    }
                                  }}
                                  className={cn(
                                    "min-h-[60px] sm:min-h-[72px] rounded-xl flex flex-col items-center justify-start pt-2 px-1 text-sm transition-all relative overflow-hidden",
                                    !isFuture ? "cursor-pointer" : "",
                                    isChecked 
                                      ? habit.color + " text-white font-bold shadow-md z-10 scale-105" 
                                      : isFuture 
                                        ? "opacity-30 text-[var(--muted)]" 
                                        : "bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--border)] border border-[var(--border)]",
                                    isTodayDate && !isChecked ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--background)]" : ""
                                  )}
                                >
                                  <span>{format(date, 'd')}</span>
                                  {hasNote && (
                                    <span className={cn(
                                      "text-[10px] leading-tight text-center mt-1 w-full line-clamp-2 px-0.5",
                                      isChecked ? "text-white/90 font-medium" : "text-[var(--color-primary)] font-medium"
                                    )}>
                                      {habit.notes![dateKey]}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Notes List for Current Month */}
                          {habit.notes && Object.entries(habit.notes).filter(([dateStr]) => dateStr.startsWith(format(currentMonthDate, 'yyyy-MM'))).length > 0 && (
                            <div className="mt-6 pt-6 border-t border-[var(--border)]">
                              <h4 className="font-bold text-[var(--title)] text-sm mb-4 flex items-center gap-2">
                                <MessageSquare size={16} className="text-[var(--muted)]" />
                                Notes for {format(currentMonthDate, 'MMMM')}
                              </h4>
                              <div className="space-y-3">
                                {Object.entries(habit.notes)
                                  .filter(([dateStr]) => dateStr.startsWith(format(currentMonthDate, 'yyyy-MM')))
                                  .sort((a, b) => b[0].localeCompare(a[0]))
                                  .map(([dateStr, note]) => {
                                    const noteDate = new Date(dateStr);
                                    const isCompleted = habit.history.some(d => isSameDay(new Date(d), noteDate));
                                    return (
                                      <div key={dateStr} className="flex gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                                        <div className={cn(
                                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold",
                                          isCompleted ? habit.color + " text-white" : "bg-[var(--card)] text-[var(--muted)]"
                                        )}>
                                          {format(noteDate, 'd')}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                          <div className="text-xs font-medium text-[var(--muted)] mb-1">
                                            {format(noteDate, 'EEEE, MMM d')}
                                          </div>
                                          <p className="text-sm text-[var(--title)] whitespace-pre-wrap">{note}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Check-in Button */}
              <button
                onClick={() => toggleCheckIn(habit.id)}
                className={cn(
                  "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 mt-auto",
                  isCheckedToday 
                    ? "bg-[var(--background)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--border)]" 
                    : habit.color + " text-white shadow-md hover:opacity-90 hover:-translate-y-0.5"
                )}
              >
                {isCheckedToday ? (
                  <>
                    <Check size={20} />
                    Completed Today
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Check In
                  </>
                )}
              </button>
            </motion.div>
          );
        })}

        {habits.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-16 text-[var(--muted)] card-container border-dashed">
            <Target size={48} className="mx-auto mb-4 opacity-20" />
            <p>No habits yet. Create one to start tracking!</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {habitToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--card)] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[var(--border)]"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--title)] mb-2">Delete Habit?</h3>
              <p className="text-[var(--muted)] mb-6 text-sm leading-relaxed">
                Are you sure you want to delete this habit? All your progress and history will be permanently lost.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-medium bg-[var(--background)] text-[var(--title)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteHabit(habitToDelete)}
                  className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Details Modal */}
      <AnimatePresence>
        {dayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--card)] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[var(--border)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--title)]">
                  {format(dayModal.date, 'MMMM d, yyyy')}
                </h3>
                <button onClick={() => setDayModal(null)} className="p-2 text-[var(--muted)] hover:bg-[var(--background)] rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)]">
                  <span className="font-medium text-[var(--title)]">Completed</span>
                  <button 
                    onClick={() => setDayModal({ ...dayModal, isCompleted: !dayModal.isCompleted })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      dayModal.isCompleted ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"
                    )}
                  >
                    <motion.div 
                      layout
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                      animate={{ left: dayModal.isCompleted ? '26px' : '2px' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--body)] mb-2">
                    <MessageSquare size={16} />
                    Note / Tag
                  </label>
                  <textarea
                    value={dayModal.note}
                    onChange={(e) => setDayModal({ ...dayModal, note: e.target.value })}
                    placeholder="How did it go? Add a tag or note..."
                    className="input-field w-full bg-[var(--background)] min-h-[100px] resize-none"
                    maxLength={100}
                  />
                </div>

                <button 
                  onClick={handleSaveDayDetails}
                  className="btn-primary w-full py-3"
                >
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--card)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--border)] my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--title)]">Share Milestone</h3>
                <button onClick={() => {
                  setShareHabit(null);
                  setGeneratedImageUrl(null);
                }} className="p-2 text-[var(--muted)] hover:bg-[var(--background)] rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--body)] mb-2">Your Name</label>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className="input-field w-full bg-[var(--background)]"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--body)] mb-2">Share Format</label>
                  <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                    <button
                      onClick={() => {
                        setShareFormat('snapshot');
                        setGeneratedImageUrl(null);
                      }}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                        shareFormat === 'snapshot' ? "bg-[var(--card)] shadow-sm text-[var(--title)]" : "text-[var(--muted)] hover:text-[var(--title)]"
                      )}
                    >
                      Snapshot
                    </button>
                    <button
                      onClick={() => {
                        setShareFormat('calendar');
                        setGeneratedImageUrl(null);
                      }}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                        shareFormat === 'calendar' ? "bg-[var(--card)] shadow-sm text-[var(--title)]" : "text-[var(--muted)] hover:text-[var(--title)]"
                      )}
                    >
                      Calendar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-8 overflow-hidden rounded-3xl relative">
                {generatedImageUrl ? (
                  <img src={generatedImageUrl} alt="Generated Share Card" className="w-[340px] rounded-3xl shadow-2xl" />
                ) : (
                  <div 
                    id="share-card-element"
                    ref={shareCardRef}
                    className={cn(
                      "w-[340px] p-8 rounded-3xl text-white relative overflow-hidden",
                      shareHabit.color
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/60" />
                    
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-black/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md border border-white/20 shadow-xl shrink-0">
                          {shareHabit.icon}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold leading-tight line-clamp-2">{shareHabit.name}</h2>
                          <p className="text-white/70 text-sm mt-1">@{username}</p>
                        </div>
                      </div>

                      {shareFormat === 'snapshot' ? (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <div className="text-4xl font-black mb-1">{getStreak(shareHabit.history)}</div>
                            <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">Day Streak 🔥</div>
                          </div>
                          <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <div className="text-4xl font-black mb-1">{shareHabit.history.length}</div>
                            <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">Total Days 🎯</div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10 mb-8">
                          <div className="text-center font-bold mb-3">{format(currentMonthDate, 'MMMM yyyy')}</div>
                          <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                              <div key={i} className="text-[10px] font-bold text-white/50">{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: getDay(startOfMonth(currentMonthDate)) }).map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {eachDayOfInterval({ start: startOfMonth(currentMonthDate), end: endOfMonth(currentMonthDate) }).map((date, i) => {
                              const isChecked = shareHabit.history.some(d => isSameDay(new Date(d), date));
                              return (
                                <div 
                                  key={i} 
                                  className={cn(
                                    "aspect-square rounded-md flex items-center justify-center text-[10px] font-medium",
                                    isChecked ? "bg-white text-black" : "bg-white/10 text-white/50"
                                  )}
                                >
                                  {format(date, 'd')}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                            <Target size={12} className="text-white" />
                          </div>
                          <span className="text-xs font-medium text-white/80 tracking-wide">Mento App</span>
                        </div>
                        <span className="text-xs text-white/50">{format(new Date(), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={downloadShareCard}
                disabled={isGeneratingImage || !!generatedImageUrl}
                className={cn(
                  "btn-primary w-full py-3 flex items-center justify-center gap-2 text-lg transition-all",
                  shareSuccess ? "bg-green-500 hover:bg-green-600 border-green-500" : "",
                  (isGeneratingImage || generatedImageUrl) ? "opacity-70 cursor-not-allowed" : ""
                )}
              >
                {isGeneratingImage ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : shareSuccess ? (
                  <Check size={20} />
                ) : (
                  <Download size={20} />
                )}
                {isGeneratingImage ? '生成中...' : shareSuccess ? shareSuccess : '复制图片分享'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
