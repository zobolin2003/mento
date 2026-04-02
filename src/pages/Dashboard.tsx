import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Calendar as CalendarIcon, Edit2, Repeat } from 'lucide-react';
import { cn, playEraseSound } from '../lib/utils';
import { Reminder } from '../types';
import { TaskEditForm } from '../components/TaskEditForm';

const WARM_QUOTES = [
  "Take your time, you are doing just fine.",
  "Every small step is progress. Be proud of yourself today.",
  "Remember to pause, breathe, and appreciate how far you've come.",
  "You are doing better than you think. Keep going.",
  "May your day be as wonderful as your mindset.",
  "Allow yourself to rest if you need to. You are human.",
  "Focus on the good, and the good will grow.",
  "Your pace is the right pace. Don't rush your journey.",
  "Sending you good energy for whatever you face today.",
  "You have the strength to handle whatever comes your way today."
];

export default function Dashboard() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('mento-reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(WARM_QUOTES[Math.floor(Math.random() * WARM_QUOTES.length)]);
  }, []);

  useEffect(() => {
    localStorage.setItem('mento-reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mento-reminders' && e.newValue) {
        setReminders(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleComplete = (id: string) => {
    const task = reminders.find(r => r.id === id);
    if (task && !task.completed) {
      playEraseSound();
    }
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteTask = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Reminder = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      priority: 'medium',
      deadline: format(selectedDate, 'yyyy-MM-dd'),
    };

    setReminders([newTask, ...reminders]);
    setNewTaskTitle('');
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const tasksForSelectedDate = reminders.filter(r => {
    if (r.repeatDates && r.repeatDates.length > 0) {
      return r.repeatDates.includes(selectedDateStr);
    }
    if (!r.deadline) {
      return isSameDay(selectedDate, new Date());
    }
    const taskDateStr = r.deadline.includes('T') ? format(new Date(r.deadline), 'yyyy-MM-dd') : r.deadline;
    return taskDateStr === selectedDateStr;
  }).sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--title)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="p-2 rounded-full hover:bg-[var(--background)] text-[var(--muted)] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="p-2 rounded-full hover:bg-[var(--background)] text-[var(--muted)] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      const isWeekend = i === 0 || i === 6;
      days.push(
        <div key={i} className={cn(
          "text-center text-xs font-semibold uppercase tracking-wider w-full",
          isWeekend ? "text-[#9B2D3E] dark:text-[#C95B6D]" : "text-[var(--muted)]"
        )}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="flex justify-between mb-4">{days}</div>;
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
        const isWeekend = i === 0 || i === 6;
        
        // Check if this day has incomplete tasks
        const dayDateStr = format(cloneDay, 'yyyy-MM-dd');
        const hasTasks = reminders.some(r => {
          if (r.completed) return false;
          if (r.repeatDates && r.repeatDates.length > 0) {
            return r.repeatDates.includes(dayDateStr);
          }
          const taskDateStr = r.deadline?.includes('T') ? format(new Date(r.deadline), 'yyyy-MM-dd') : r.deadline;
          return taskDateStr === dayDateStr;
        });

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className="w-full flex justify-center py-1"
          >
            <div
              className={cn(
                "relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full cursor-pointer transition-all text-sm sm:text-base",
                !isSameMonth(day, monthStart) 
                  ? "text-[var(--muted)] opacity-40" 
                  : isWeekend 
                    ? "text-[#9B2D3E] dark:text-[#C95B6D] font-medium" 
                    : "text-[var(--body)]",
                isSameDay(day, selectedDate) 
                  ? "bg-[var(--color-primary)] text-white font-medium shadow-md shadow-[var(--color-primary)]/20" 
                  : "hover:bg-[var(--background)]",
                isToday(day) && !isSameDay(day, selectedDate) ? "text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/10" : ""
              )}
            >
              <span>{formattedDate}</span>
              {hasTasks && !isSameDay(day, selectedDate) && (
                <div className="absolute bottom-1 sm:bottom-2 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex justify-between w-full" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col gap-1">{rows}</div>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto h-full flex flex-col"
    >
      <header className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-[var(--title)]">Good morning, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p className="text-[var(--muted)] mt-1">{quote || "Here is your schedule and tasks for the day."}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-0">
        {/* Left: Calendar */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="card-container p-6 sm:p-8 flex-1">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>
        </div>

        {/* Right: Tasks for Selected Date */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="card-container p-6 sm:p-8 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[var(--title)]">
                  {isToday(selectedDate) ? "Today's Tasks" : format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {tasksForSelectedDate.filter(t => t.completed).length} of {tasksForSelectedDate.length} completed
                </p>
              </div>
              <button 
                onClick={() => document.getElementById('new-task-input')?.focus()}
                className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Add new task"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              <AnimatePresence mode="popLayout">
                {tasksForSelectedDate.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-[var(--muted)] min-h-[200px]"
                  >
                    <CalendarIcon size={48} className="mb-4 opacity-20" />
                    <p>No tasks scheduled for this day.</p>
                  </motion.div>
                ) : (
                  tasksForSelectedDate.map(task => (
                    editingTaskId === task.id ? (
                      <TaskEditForm
                        key={task.id}
                        task={task}
                        onSave={(updatedTask) => {
                          setReminders(reminders.map(r => r.id === updatedTask.id ? updatedTask : r));
                          setEditingTaskId(null);
                        }}
                        onCancel={() => setEditingTaskId(null)}
                        onDelete={(id) => {
                          deleteTask(id);
                          setEditingTaskId(null);
                        }}
                        onToggleComplete={toggleComplete}
                      />
                    ) : (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={task.id}
                        className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--background)] transition-colors border border-transparent hover:border-[var(--border)]"
                      >
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                            task.completed 
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" 
                              : "border-dashed border-[var(--muted)] hover:border-[var(--color-primary)]"
                          )}
                        >
                          {task.completed && <Check size={14} strokeWidth={3} />}
                        </button>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className={cn(
                            "text-[var(--body)] transition-all truncate",
                            task.completed && "line-through text-[var(--muted)] opacity-60"
                          )}>
                            {task.title}
                          </span>
                          {task.note && (
                            <span className="text-xs text-[var(--muted)] truncate mt-0.5">
                              {task.note}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("px-2 py-0.5 rounded-full border text-[10px]", priorityColors[task.priority || 'medium'])}>
                              {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                            </span>
                            {task.repeatDates && task.repeatDates.length > 0 && (
                              <span className="flex items-center gap-1 text-[var(--color-primary)] text-xs">
                                <Repeat size={10} />
                                {task.repeatDates.length} days
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <button
                            onClick={() => setEditingTaskId(task.id)}
                            className="p-2 text-[var(--muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Add Task Input */}
            <form onSubmit={handleAddTask} className="mt-4 relative flex-shrink-0">
              <input
                id="new-task-input"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={`Add a task for ${format(selectedDate, 'MMM d')}...`}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl py-3 pl-4 pr-12 text-[var(--body)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

