import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { BookOpen, Smile, HeartCrack, Sparkles, CloudSun, Coffee, CloudRain, Brain, Briefcase, Flame, Dumbbell, Plus, MoreHorizontal, Trash2, Meh, Hammer, Book, Fish, Moon, Headphones, HelpCircle, Zap, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { RichTextEditor } from '../components/RichTextEditor';

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  date: string;
  image?: string | null;
}

const moods = [
  // Visible (7)
  { id: 'happy', label: '美滋滋', icon: Smile, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'emo', label: 'emo', icon: CloudRain, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'cracked', label: '裂开', icon: HeartCrack, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  { id: 'dazed', label: '发呆', icon: Meh, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'exercise', label: '运动', icon: Dumbbell, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  { id: 'coffee', label: '咖啡', icon: Coffee, color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' },
  { id: 'sunny', label: '等天晴', icon: CloudSun, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  // Hidden
  { id: 'koi', label: '求锦鲤', icon: Sparkles, color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30' },
  { id: 'work', label: '搬砖', icon: Hammer, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { id: 'study', label: '学习', icon: Book, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
  { id: 'slack', label: '摸鱼', icon: Fish, color: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30' },
  { id: 'sleep', label: '睡觉', icon: Moon, color: 'text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'music', label: '听歌', icon: Headphones, color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30' },
  { id: 'energetic', label: '元气满满', icon: Zap, color: 'text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'overthinking', label: '胡思乱想', icon: Brain, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'businesstrip', label: '出差', icon: Briefcase, color: 'text-teal-500 bg-teal-100 dark:bg-teal-900/30' },
  { id: 'busy', label: '忙', icon: Flame, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  { id: 'unknown', label: '未知', icon: HelpCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
];

const initialEntries: JournalEntry[] = [
  { id: '1', content: '<p>Had a great productive day today. Finished the project proposal and went for a run.</p>', mood: 'happy', date: new Date().toISOString() },
  { id: '2', content: '<p>Feeling a bit tired but accomplished. Need to rest more.</p>', mood: 'dazed', date: new Date(Date.now() - 86400000).toISOString() },
];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('mento-journal');
    return saved ? JSON.parse(saved) : initialEntries;
  });
  const [newEntry, setNewEntry] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState('happy');
  const [key, setKey] = useState(0); // Used to force re-render RichTextEditor after submit
  const [showMoodPopover, setShowMoodPopover] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mento-journal', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowMoodPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || newEntry === '<p><br></p>') return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      content: newEntry,
      mood: selectedMood,
      date: new Date().toISOString(),
      image: newImage,
    };

    setEntries([entry, ...entries]);
    setNewEntry('');
    setNewImage(null);
    setKey(prev => prev + 1); // Reset editor
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntries(entries.filter(entry => entry.id !== id));
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
    }
  };

  const visibleMoods = moods.slice(0, 7);
  const hiddenMoods = moods.slice(7);
  const isSelectedHidden = hiddenMoods.some(m => m.id === selectedMood);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8"
      onClick={() => setSelectedEntryId(null)} // Click outside to deselect
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--title)]">Journal</h1>
          <p className="text-[var(--muted)] mt-1">Reflect on your days and track your mood.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <BookOpen size={24} />
        </div>
      </header>

      {/* New Entry Form */}
      <form onSubmit={handleAddEntry} className="space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="h-[200px]">
          <RichTextEditor
            key={key}
            initialContent={newEntry}
            onChange={setNewEntry}
            onImageUpload={setNewImage}
            minHeight="100%"
            placeholder="How was your day?"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
            <span className="text-sm font-medium text-[var(--muted)] mr-1 flex-shrink-0">Mood:</span>
            
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 flex-1 sm:flex-initial pr-1">
              {visibleMoods.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => setSelectedMood(mood.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all flex-shrink-0 text-sm",
                    selectedMood === mood.id 
                      ? mood.color + " ring-2 ring-offset-2 ring-[var(--background)] ring-offset-transparent font-medium" 
                      : "text-[var(--muted)] hover:bg-[var(--card)] border border-transparent hover:border-[var(--border)]"
                  )}
                  title={mood.label}
                >
                  <mood.icon size={16} />
                  <span>{mood.label}</span>
                </button>
              ))}

              {isSelectedHidden && (
                <button
                  type="button"
                  onClick={() => {}}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all flex-shrink-0 text-sm",
                    moods.find(m => m.id === selectedMood)!.color + " ring-2 ring-offset-2 ring-[var(--background)] ring-offset-transparent font-medium"
                  )}
                  title={moods.find(m => m.id === selectedMood)!.label}
                >
                  {React.createElement(moods.find(m => m.id === selectedMood)!.icon, { size: 16 })}
                  <span>{moods.find(m => m.id === selectedMood)!.label}</span>
                </button>
              )}
            </div>

            <div className="relative flex-shrink-0 ml-1" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setShowMoodPopover(!showMoodPopover)}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                  showMoodPopover ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "text-[var(--muted)] hover:bg-[var(--card)] border border-transparent hover:border-[var(--border)]"
                )}
                title="More moods"
              >
                <MoreHorizontal size={16} />
              </button>

              <AnimatePresence>
                {showMoodPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto w-[280px] p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 grid grid-cols-4 gap-2 origin-bottom-right sm:origin-bottom"
                  >
                    {hiddenMoods.map(mood => (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => {
                          setSelectedMood(mood.id);
                          setShowMoodPopover(false);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all",
                          selectedMood === mood.id
                            ? mood.color + " ring-1 ring-[var(--background)] font-medium"
                            : "text-[var(--muted)] hover:bg-[var(--background)]"
                        )}
                        title={mood.label}
                      >
                        <mood.icon size={20} />
                        <span className="text-[11px] whitespace-nowrap">{mood.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newEntry.trim() || newEntry === '<p><br></p>'}
            className="btn-primary flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            Save Entry
          </button>
        </div>

        {newImage && (
          <div className="relative inline-block mt-2">
            <img 
              src={newImage} 
              alt="Upload preview" 
              className="h-20 w-20 object-cover rounded-xl border border-[var(--border)] shadow-sm" 
            />
            <button
              type="button"
              onClick={() => setNewImage(null)}
              className="absolute -top-2 -right-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-red-500 rounded-full p-1 shadow-sm transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </form>

      {/* Timeline */}
      <div className="relative pl-4 sm:pl-8 border-l-2 border-[var(--border)] space-y-8 pb-8">
        {entries.map((entry, index) => {
          const moodConfig = moods.find(m => m.id === entry.mood) || moods[0];
          const isSelected = selectedEntryId === entry.id;
          
          return (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[21px] sm:-left-[37px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[var(--background)]",
                moodConfig.color
              )} title={moodConfig.label}>
                <moodConfig.icon size={18} />
              </div>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEntryId(isSelected ? null : entry.id);
                }}
                className={cn(
                  "card-container p-5 ml-4 sm:ml-6 transition-all cursor-pointer",
                  isSelected 
                    ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" 
                    : "hover:border-[var(--color-primary)]/30"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-primary)]">
                    {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", moodConfig.color)}>
                      {moodConfig.label}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {format(new Date(entry.date), 'h:mm a')}
                    </span>
                    {isSelected && (
                      <button
                        onClick={(e) => handleDeleteEntry(entry.id, e)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0 ml-2"
                        title="Delete Entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div 
                  className="prose dark:prose-invert max-w-none prose-p:text-[var(--body)] prose-headings:text-[var(--title)] prose-a:text-[var(--color-primary)]"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
                {entry.image && (
                  <div className="mt-4">
                    <img 
                      src={entry.image} 
                      alt="Journal attachment" 
                      className="h-32 w-32 object-cover rounded-xl border border-[var(--border)] shadow-sm" 
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p>Your journal is empty. Start writing your first entry!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
