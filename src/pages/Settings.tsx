import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Settings as SettingsIcon, Moon, Sun, Download, Trash2, Save, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name }
      });
      
      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      notes: JSON.parse(localStorage.getItem('mento-notes') || '[]'),
      reminders: JSON.parse(localStorage.getItem('mento-reminders') || '[]'),
      journal: JSON.parse(localStorage.getItem('mento-journal') || '[]'),
      habits: JSON.parse(localStorage.getItem('mento-habits') || '[]'),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mento-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--title)]">Settings</h1>
          <p className="text-[var(--muted)] mt-1">Manage your account and preferences.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <SettingsIcon size={24} />
        </div>
      </header>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="card-container p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-[var(--color-primary)]" size={24} />
            <h2 className="text-xl font-semibold text-[var(--title)]">Profile Information</h2>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[var(--body)] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full bg-[var(--background)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--body)] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full bg-[var(--background)] opacity-50 cursor-not-allowed"
                  disabled
                  title="Email cannot be changed here"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? <span className="animate-pulse">Saving...</span> : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="card-container p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Sun className="text-orange-500" size={24} />
            <h2 className="text-xl font-semibold text-[var(--title)]">Preferences</h2>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-medium text-[var(--title)]">Theme</h3>
              <p className="text-sm text-[var(--muted)]">Switch between light and dark mode</p>
            </div>
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--color-primary)] transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span className="font-medium capitalize">{theme}</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-[var(--title)]">Data Sync</h3>
              <p className="text-sm text-[var(--muted)]">Sync your data across devices (Supabase)</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium flex items-center gap-1">
              <Shield size={12} />
              Active
            </span>
          </div>
        </div>

        {/* Data Management */}
        <div className="card-container p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Download className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-[var(--title)]">Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <div>
                <h3 className="font-medium text-[var(--title)]">Export Data</h3>
                <p className="text-sm text-[var(--muted)]">Download all your notes, habits, and journal entries as JSON.</p>
              </div>
              <button 
                onClick={handleExportData}
                className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Download size={18} />
                Export JSON
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-400">Delete Account</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Permanently delete your account and all data.</p>
              </div>
              <button 
                onClick={() => window.confirm('Are you sure? This action cannot be undone.')}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
