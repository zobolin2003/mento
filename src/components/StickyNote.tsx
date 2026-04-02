import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';
import { X, GripHorizontal, CheckSquare, Check } from 'lucide-react';
import { Reminder } from '../types';
import { format, isSameDay } from 'date-fns';
import { cn, playEraseSound } from '../lib/utils';

export function StickyNote({ onClose }: { onClose: () => void }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const dragControls = useDragControls();
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('mento-sticky-note-pos');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const loadReminders = () => {
    const saved = localStorage.getItem('mento-reminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadReminders();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mento-reminders') {
        loadReminders();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mento-reminders-updated', loadReminders);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mento-reminders-updated', loadReminders);
    };
  }, []);

  const toggleComplete = (id: string) => {
    const task = reminders.find(r => r.id === id);
    if (task && !task.completed) {
      playEraseSound();
    }
    const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(updated);
    localStorage.setItem('mento-reminders', JSON.stringify(updated));
    window.dispatchEvent(new Event('mento-reminders-updated'));
  };

  const handleDragEnd = (event: any, info: any) => {
    const newPos = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y
    };
    setPosition(newPos);
    localStorage.setItem('mento-sticky-note-pos', JSON.stringify(newPos));
  };

  // Filter for today's reminders or high priority if no deadline
  const today = new Date();
  const todaysReminders = reminders.filter(r => {
    if (r.deadline) {
      // Check if deadline is today or in the past (overdue)
      const deadlineDate = new Date(r.deadline);
      return isSameDay(deadlineDate, today) || deadlineDate < today;
    }
    return !r.completed; // Show uncompleted tasks if no deadline
  }).sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className="fixed z-50 w-64 shadow-2xl rounded-xl overflow-hidden border border-yellow-200/50 dark:border-yellow-900/50 bg-yellow-50 dark:bg-[#2a2615]"
      style={{ 
        top: '100px',
        right: '40px',
      }}
      initial={{ opacity: 0, scale: 0.9, x: position.x, y: position.y }}
      animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div 
        className="bg-yellow-100 dark:bg-yellow-900/40 p-2 flex items-center justify-between cursor-move"
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500 px-2">
          <GripHorizontal size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Today's Focus</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-yellow-800/60 hover:text-yellow-800 dark:text-yellow-500/60 dark:hover:text-yellow-500 rounded-md hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
        {todaysReminders.length === 0 ? (
          <div className="text-center py-6 text-yellow-800/50 dark:text-yellow-500/50">
            <CheckSquare size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">All caught up for today!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysReminders.map(task => (
              <div 
                key={task.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg transition-colors group",
                  task.completed ? "opacity-60" : "hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30"
                )}
              >
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border",
                    task.completed 
                      ? "bg-yellow-500 border-yellow-500 text-white" 
                      : "border-yellow-400/50 dark:border-yellow-600/50 hover:border-yellow-500 dark:hover:border-yellow-500"
                  )}
                >
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </button>
                <span className={cn(
                  "text-sm leading-tight pt-0.5",
                  task.completed ? "line-through text-yellow-800/50 dark:text-yellow-500/50" : "text-yellow-900 dark:text-yellow-100"
                )}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
