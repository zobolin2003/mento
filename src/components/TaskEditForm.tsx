import React, { useState } from 'react';
import { Trash2, Clock, Repeat, Calendar as CalendarIcon, Check, Flag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Reminder } from '../types';
import { RepeatCalendarPopover } from './RepeatCalendarPopover';

// Custom Pencil Icon to match the image
const PencilIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
);

interface TaskEditFormProps {
  task: Reminder;
  onSave: (task: Reminder) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export function TaskEditForm({ task, onSave, onCancel, onDelete, onToggleComplete }: TaskEditFormProps) {
  const [editedTask, setEditedTask] = useState<Reminder>(task);
  const [showRepeat, setShowRepeat] = useState(false);

  const handleChange = (field: keyof Reminder, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-[#FCFAF8] dark:bg-[var(--card)] border border-[#F4EFE6] dark:border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col gap-5 w-full my-2">
      {/* Title Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            onToggleComplete(task.id);
            handleChange('completed', !editedTask.completed);
          }}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
            editedTask.completed 
              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" 
              : "border-dashed border-[#8C8C8C] dark:border-[var(--muted)] hover:border-[var(--color-primary)]"
          )}
        >
          {editedTask.completed && <Check size={16} strokeWidth={3} />}
        </button>
        <input
          type="text"
          value={editedTask.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="flex-1 bg-transparent text-lg font-medium text-[#333] dark:text-[var(--title)] focus:outline-none"
          placeholder="Task title"
        />
        <button onClick={() => onDelete(task.id)} className="text-[#8C8C8C] dark:text-[var(--muted)] hover:text-red-500 p-1">
          <Trash2 size={22} />
        </button>
      </div>

      {/* Note Row */}
      <div className="flex items-center gap-3 text-[#666] dark:text-[var(--muted)]">
        <PencilIcon size={20} />
        <input
          type="text"
          value={editedTask.note || ''}
          onChange={(e) => handleChange('note', e.target.value)}
          className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-[#999]"
          placeholder="Add note here"
        />
      </div>

      {/* Date & Time Row */}
      <div className="flex items-center gap-3 text-[#666] dark:text-[var(--muted)]">
        <Clock size={20} />
        <div className="flex items-center gap-6 flex-1">
          <input
            type="date"
            value={editedTask.deadline || ''}
            onChange={(e) => handleChange('deadline', e.target.value)}
            className="bg-transparent text-base focus:outline-none cursor-pointer text-[#666] dark:text-[var(--muted)]"
          />
          <input
            type="time"
            value={editedTask.time || ''}
            onChange={(e) => handleChange('time', e.target.value)}
            className="bg-transparent text-base focus:outline-none cursor-pointer text-[#666] dark:text-[var(--muted)]"
          />
        </div>
      </div>

      {/* Repeat Row */}
      <div className="relative flex items-center gap-3 text-[#666] dark:text-[var(--muted)]">
        <Repeat size={20} />
        <span className="text-base">Repeat Task</span>
        <button 
          onClick={() => setShowRepeat(!showRepeat)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            showRepeat || (editedTask.repeatDates && editedTask.repeatDates.length > 0)
              ? "bg-[#AEC2A9] text-[#1A2616] dark:bg-[var(--color-primary)] dark:text-white"
              : "bg-[#EAE6DF] dark:bg-white/10 hover:bg-[#DFDCD5] dark:hover:bg-white/20"
          )}
        >
          <CalendarIcon size={18} />
        </button>
        
        {editedTask.repeatDates && editedTask.repeatDates.length > 0 && (
          <span className="text-xs text-[#AEC2A9] dark:text-[var(--color-primary)] font-medium">
            ({editedTask.repeatDates.length} days)
          </span>
        )}

        {showRepeat && (
          <div className="absolute top-full left-0 mt-2 z-50">
            <RepeatCalendarPopover 
              initialDates={editedTask.repeatDates || []}
              onSave={(dates) => {
                handleChange('repeatDates', dates);
                setShowRepeat(false);
              }}
              onClose={() => setShowRepeat(false)}
            />
          </div>
        )}
      </div>

      {/* Priority Row */}
      <div className="flex items-center gap-3 text-[#666] dark:text-[var(--muted)]">
        <Flag size={20} />
        <span className="text-base">Priority</span>
        <select
          value={editedTask.priority || 'medium'}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="bg-transparent text-base focus:outline-none cursor-pointer text-[#666] dark:text-[var(--muted)]"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-2">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#E8E9E1] dark:bg-[var(--background)] text-[#4A503D] dark:text-[var(--body)] font-medium text-base hover:opacity-90 transition-opacity"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSave(editedTask)}
          className="flex-1 py-3 rounded-xl bg-[#AEC2A9] dark:bg-[var(--color-primary)] text-[#1A2616] dark:text-white font-medium text-base hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  );
}
