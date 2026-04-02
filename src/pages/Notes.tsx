import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Edit3, FileText, Download, Tag, Folder, Book, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { RichTextEditor } from '../components/RichTextEditor';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  updatedAt: number;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const formattedNotes = data.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          category: d.category,
          tags: d.tags || [],
          updatedAt: new Date(d.updated_at).getTime()
        }));
        setNotes(formattedNotes);
        if (formattedNotes.length > 0 && !activeNoteId) {
          setActiveNoteId(formattedNotes[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreateNote = async () => {
    if (!user) return;
    
    const newNoteData = {
      user_id: user.id,
      title: 'Untitled Note',
      content: '',
      category: 'Uncategorized',
      tags: [],
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([newNoteData])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newNote: Note = {
          id: data.id,
          title: data.title,
          content: data.content,
          category: data.category,
          tags: data.tags || [],
          updatedAt: new Date(data.updated_at).getTime()
        };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    // Optimistic update
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    
    try {
      const { error } = await supabase
        .from('notes')
        .update(dbUpdates)
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const confirmDeleteNote = async () => {
    if (noteToDelete) {
      // Optimistic update
      const newNotes = notes.filter(n => n.id !== noteToDelete);
      setNotes(newNotes);
      if (activeNoteId === noteToDelete) {
        setActiveNoteId(newNotes[0]?.id || null);
        setIsEditing(false);
      }
      
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteToDelete);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting note:', error);
        // Revert on failure could be implemented here
      } finally {
        setNoteToDelete(null);
      }
    }
  };

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
  };

  const filteredNotes = notes.filter(n => {
    const plainContent = n.content.replace(/<[^>]*>?/gm, '');
    return n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           plainContent.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExport = (format: 'md' | 'txt') => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/\s+/g, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6"
    >
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 flex flex-col gap-4 transition-all duration-300",
        activeNoteId && "hidden md:flex" // Hide on mobile if a note is active
      )}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--title)]">Notes</h1>
          <button 
            onClick={handleCreateNote}
            className="p-2 bg-[var(--color-primary)] text-white rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 bg-[var(--card)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredNotes.map(note => (
            <div 
              key={note.id}
              onClick={() => {
                setActiveNoteId(note.id);
                setIsEditing(false);
              }}
              className={cn(
                "group relative p-4 rounded-2xl cursor-pointer transition-all border",
                activeNoteId === note.id 
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30" 
                  : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-primary)]/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-[var(--title)] truncate flex-1">{note.title || 'Untitled'}</h3>
                {activeNoteId === note.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-sm text-[var(--muted)] truncate mt-1">
                {note.content.replace(/[#*`_]/g, '') || 'No content...'}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1"><Folder size={12} /> {note.category}</span>
                <span>{format(note.updatedAt, 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-[var(--muted)]">
              No notes found.
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      {activeNoteId ? (
        <div className={cn(
          "flex-1 flex flex-col card-container overflow-hidden transition-all duration-300",
          !activeNoteId && "hidden md:flex"
        )}>
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveNoteId(null)}
                className="md:hidden p-2 text-[var(--muted)] hover:bg-[var(--background)] rounded-lg"
              >
                Back
              </button>
              {isEditing ? (
                <input 
                  type="text"
                  value={activeNote?.title}
                  onChange={(e) => handleUpdateNote(activeNoteId, { title: e.target.value })}
                  className="text-xl font-bold bg-transparent border-none focus:ring-0 text-[var(--title)] p-0"
                  placeholder="Note Title"
                />
              ) : (
                <h2 className="text-xl font-bold text-[var(--title)] truncate">{activeNote?.title || 'Untitled'}</h2>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isEditing ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" : "text-[var(--muted)] hover:bg-[var(--background)]"
                )}
                title={isEditing ? "Preview" : "Edit"}
              >
                {isEditing ? <FileText size={18} /> : <Edit3 size={18} />}
              </button>
              <button 
                onClick={() => handleExport('md')}
                className="p-2 text-[var(--muted)] hover:bg-[var(--background)] rounded-lg transition-colors"
                title="Export as Markdown"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={() => handleDeleteNote(activeNoteId)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Note"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Editor Metadata */}
          {isEditing && (
            <div className="flex items-center gap-4 p-4 border-b border-[var(--border)] bg-[var(--background)]/50 text-sm">
              <div className="flex items-center gap-2">
                <Folder size={14} className="text-[var(--muted)]" />
                <input 
                  type="text"
                  value={activeNote?.category}
                  onChange={(e) => handleUpdateNote(activeNoteId, { category: e.target.value })}
                  className="bg-transparent border-none focus:ring-0 text-[var(--body)] p-0 w-32"
                  placeholder="Category"
                />
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-[var(--muted)]" />
                <input 
                  type="text"
                  value={activeNote?.tags.join(', ')}
                  onChange={(e) => handleUpdateNote(activeNoteId, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="bg-transparent border-none focus:ring-0 text-[var(--body)] p-0 flex-1"
                  placeholder="Tags (comma separated)"
                />
              </div>
            </div>
          )}

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--background)]">
            {isEditing ? (
              <RichTextEditor 
                key={activeNoteId} 
                initialContent={activeNote?.content || ''} 
                onChange={(content) => handleUpdateNote(activeNoteId, { content })} 
              />
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="prose dark:prose-invert max-w-none prose-p:text-[var(--body)] prose-headings:text-[var(--title)] prose-a:text-[var(--color-primary)] p-[16px] bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[6px] min-h-[300px] shadow-sm cursor-text hover:border-[var(--color-primary)]/50 transition-colors"
                dangerouslySetInnerHTML={{ __html: activeNote?.content || '<p class="text-[var(--muted)]">*Empty note*</p>' }}
                title="Click to edit"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center card-container text-[var(--muted)]">
          <div className="text-center">
            <Book size={48} className="mx-auto mb-4 opacity-20" />
            <p>Select a note or create a new one</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[var(--border)]"
          >
            <h3 className="text-lg font-bold text-[var(--title)] mb-2">Delete Note</h3>
            <p className="text-[var(--muted)] mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 text-[var(--muted)] hover:bg-[var(--background)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteNote}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
