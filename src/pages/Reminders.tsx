import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Check, Trash2, Calendar, AlertCircle, GripVertical, CheckSquare, Edit2, Repeat, Pin } from 'lucide-react';
import { cn, playEraseSound } from '../lib/utils';
import { format } from 'date-fns';
import { Reminder } from '../types';
import { TaskEditForm } from '../components/TaskEditForm';

const initialReminders: Reminder[] = [
  { id: '1', title: 'Complete project proposal', completed: false, priority: 'high', deadline: '2026-03-28' },
  { id: '2', title: 'Buy groceries', completed: false, priority: 'low' },
  { id: '3', title: 'Call mom', completed: true, priority: 'medium' },
];

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('mento-reminders');
    return saved ? JSON.parse(saved) : initialReminders;
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isStickyNoteVisible, setIsStickyNoteVisible] = useState(() => {
    return localStorage.getItem('mento-sticky-note-visible') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('mento-reminders', JSON.stringify(reminders));
    window.dispatchEvent(new Event('mento-reminders-updated'));
  }, [reminders]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mento-reminders' && e.newValue) {
        setReminders(JSON.parse(e.newValue));
      }
      if (e.key === 'mento-sticky-note-visible') {
        setIsStickyNoteVisible(e.newValue === 'true');
      }
    };
    
    const handleCustomEvent = () => {
      setIsStickyNoteVisible(localStorage.getItem('mento-sticky-note-visible') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mento-sticky-note-toggle', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mento-sticky-note-toggle', handleCustomEvent);
    };
  }, []);

  const toggleStickyNote = () => {
    const newValue = !isStickyNoteVisible;
    setIsStickyNoteVisible(newValue);
    localStorage.setItem('mento-sticky-note-visible', String(newValue));
    window.dispatchEvent(new Event('mento-sticky-note-toggle'));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Reminder = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      deadline: newTaskDeadline || undefined,
    };

    setReminders([newTask, ...reminders]);
    setNewTaskTitle('');
    setNewTaskDeadline('');
    setNewTaskPriority('medium');
  };

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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(reminders);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setReminders(items);
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--title)] flex items-center gap-3">
            Reminders
            <button
              onClick={toggleStickyNote}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium",
                isStickyNoteVisible 
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                  : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--title)] hover:bg-[var(--background)] border border-[var(--border)]"
              )}
              title={isStickyNoteVisible ? "Hide Desktop Note" : "Pin to Desktop"}
            >
              <Pin size={16} className={cn(isStickyNoteVisible && "fill-current")} />
              <span className="hidden sm:inline">{isStickyNoteVisible ? "Pinned" : "Pin to Desktop"}</span>
            </button>
          </h1>
          <p className="text-[var(--muted)] mt-2">Manage your tasks and deadlines.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[var(--color-primary)]">
            {reminders.filter(r => r.completed).length}
          </span>
          <span className="text-[var(--muted)]"> / {reminders.length} done</span>
        </div>
      </header>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="card-container p-4 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="input-field w-full bg-[var(--background)]"
            required
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="input-field bg-[var(--background)] text-sm py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            value={newTaskDeadline}
            onChange={(e) => setNewTaskDeadline(e.target.value)}
            className="input-field bg-[var(--background)] text-sm py-2"
          />
          <button
            type="submit"
            className="btn-primary flex items-center justify-center p-2.5"
            disabled={!newTaskTitle.trim()}
          >
            <Plus size={20} />
          </button>
        </div>
      </form>

      {/* Task List */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="reminders-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {sortedReminders.map((reminder, index) => (
                <Draggable key={reminder.id} draggableId={reminder.id} index={index}>
                  {(provided, snapshot) => (
                    editingTaskId === reminder.id ? (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskEditForm
                          task={reminder}
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
                      </div>
                    ) : (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "group card-container p-4 flex items-center gap-4 transition-all duration-200",
                          snapshot.isDragging ? "shadow-lg scale-[1.02] z-10" : "",
                          reminder.completed ? "opacity-60 bg-[var(--background)]" : ""
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-[var(--muted)] hover:text-[var(--title)] cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical size={20} />
                        </div>

                        <button
                          onClick={() => toggleComplete(reminder.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                            reminder.completed
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                              : "border-dashed border-[var(--muted)] hover:border-[var(--color-primary)]"
                          )}
                        >
                          {reminder.completed && <Check size={14} strokeWidth={3} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-medium truncate transition-all",
                            reminder.completed ? "text-[var(--muted)] line-through" : "text-[var(--title)]"
                          )}>
                            {reminder.title}
                          </h3>
                          {reminder.note && (
                            <p className="text-sm text-[var(--muted)] truncate mt-0.5">
                              {reminder.note}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className={cn("px-2 py-0.5 rounded-full border", priorityColors[reminder.priority])}>
                              {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                            </span>
                            {reminder.deadline && (
                              <span className="flex items-center gap-1 text-[var(--muted)]">
                                <Calendar size={12} />
                                {format(new Date(reminder.deadline), 'MMM d, yyyy')}
                                {reminder.time && ` at ${reminder.time}`}
                              </span>
                            )}
                            {reminder.repeatDates && reminder.repeatDates.length > 0 && (
                              <span className="flex items-center gap-1 text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                                <Repeat size={10} />
                                {reminder.repeatDates.length} days
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <button
                            onClick={() => setEditingTaskId(reminder.id)}
                            className="p-2 text-[var(--muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteTask(reminder.id)}
                            className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {reminders.length === 0 && (
                <div className="text-center py-12 text-[var(--muted)] card-container border-dashed">
                  <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p>All caught up! No reminders left.</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </motion.div>
  );
}
