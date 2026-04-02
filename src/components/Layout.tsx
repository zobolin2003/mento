import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Book, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  Clock, 
  Target, 
  BarChart2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { StickyNote } from './StickyNote';

const navItems = [
  { path: '/dashboard', icon: BarChart2, label: 'Dashboard' },
  { path: '/reminders', icon: CheckSquare, label: 'Reminders' },
  { path: '/notes', icon: Book, label: 'Notes' },
  { path: '/journal', icon: Calendar, label: 'Journal' },
  { path: '/pomodoro', icon: Clock, label: 'Focus' },
  { path: '/habits', icon: Target, label: 'Habits' },
  { path: '/stats', icon: BarChart2, label: 'Stats' },
  { path: '/ai', icon: MessageSquare, label: 'AI Assistant' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isStickyNoteVisible, setIsStickyNoteVisible] = useState(() => {
    return localStorage.getItem('mento-sticky-note-visible') === 'true';
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
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

  const handleCloseStickyNote = () => {
    setIsStickyNoteVisible(false);
    localStorage.setItem('mento-sticky-note-visible', 'false');
    window.dispatchEvent(new Event('mento-sticky-note-toggle'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--sidebar-active)] flex items-center justify-center text-[var(--sidebar-active-text)] shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20V5a1 1 0 0 1 1-1h2l5 8 5-8h2a1 1 0 0 1 1 1v15" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[var(--sidebar-text)] tracking-wide">Mento</span>
          </div>
          <button onClick={closeMobileMenu} className="lg:hidden text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)]">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200",
                  isActive 
                    ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)] font-medium shadow-sm" 
                    : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* About Mento Button */}
          <div className="mt-8 mb-2 px-1">
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="w-full text-left p-4 rounded-2xl bg-[var(--sidebar-hover)]/50 hover:bg-[var(--sidebar-hover)] transition-colors group"
            >
              <h4 className="font-medium text-[var(--sidebar-text)] mb-1 flex items-center justify-between">
                About Mento
                <Heart size={14} className="text-[var(--sidebar-muted)] group-hover:text-red-400 transition-colors" />
              </h4>
              <p className="text-xs text-[var(--sidebar-muted)] line-clamp-2 leading-relaxed">
                Your calm space to breathe, reflect, and move at your own rhythm.
              </p>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className="w-10 h-10 rounded-full bg-[var(--sidebar-active)] flex items-center justify-center text-[var(--sidebar-active-text)] font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--sidebar-text)] truncate">{user?.name}</p>
              <p className="text-xs text-[var(--sidebar-muted)] truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--sidebar-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-10">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[var(--muted)] hover:text-[var(--body)] rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1" /> {/* Spacer */}

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--muted)] hover:bg-[var(--card)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
        
        {/* Sticky Note Widget */}
        <AnimatePresence>
          {isStickyNoteVisible && <StickyNote onClose={handleCloseStickyNote} />}
        </AnimatePresence>
      </div>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAboutOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-[#FCFAF8] dark:bg-[#1C1C1C] rounded-[2rem] p-8 sm:p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <button 
                onClick={() => setIsAboutOpen(false)}
                className="absolute top-6 right-6 p-2 text-[#8C8C8C] hover:text-[#333] dark:text-[#A0A0A0] dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X size={24} />
              </button>
              
              <div className="space-y-6 text-[1.05rem] sm:text-[1.15rem] leading-[1.8] text-[#4A4A4A] dark:text-[#D4D4D4] font-medium tracking-wide">
                <p>Dear you,</p>
                
                <p>
                  In a world that moves fast and glorifies productivity, it's easy to forget 
                  what truly matters. Mento isn't here to help you do more — it's here to 
                  help you return. To what feels true and to what feels like you.
                </p>
                
                <p>
                  This is your calm space to breathe, to reflect, and to move at your own 
                  rhythm. No pressure, no judgment — only gentle clarity and presence.
                </p>
                
                <p>
                  Here, every moment of focus or reflection is an act of alignment between 
                  your purpose and your peace.
                </p>
                
                <p>
                  In this quiet sanctuary, you're not becoming who others expect — you're 
                  returning to who you truly are.
                </p>
                
                <p>
                  So, welcome to your spiritual home - Mento!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
