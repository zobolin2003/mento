import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell } from 'recharts';
import { BarChart2, TrendingUp, Calendar, Target, CheckSquare, Book, X, ArrowRight, Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeRangeSelector, PresetRange, DateRange } from '../components/TimeRangeSelector';
import { cn } from '../lib/utils';
import { format, subDays, eachDayOfInterval, addDays, isAfter, startOfDay } from 'date-fns';

const generateYearlyData = (year: number) => {
  const base = [
    { name: 'Jan', notes: 4, tasks: 12, habits: 20 },
    { name: 'Feb', notes: 3, tasks: 15, habits: 22 },
    { name: 'Mar', notes: 5, tasks: 10, habits: 25 },
    { name: 'Apr', notes: 7, tasks: 18, habits: 21 },
    { name: 'May', notes: 2, tasks: 8, habits: 15 },
    { name: 'Jun', notes: 6, tasks: 14, habits: 28 },
    { name: 'Jul', notes: 8, tasks: 20, habits: 26 },
    { name: 'Aug', notes: 5, tasks: 16, habits: 24 },
    { name: 'Sep', notes: 9, tasks: 22, habits: 29 },
    { name: 'Oct', notes: 4, tasks: 11, habits: 18 },
    { name: 'Nov', notes: 6, tasks: 19, habits: 23 },
    { name: 'Dec', notes: 7, tasks: 15, habits: 27 },
  ];
  
  if (year === 2025) {
    return base.map(item => ({
      ...item,
      notes: Math.max(0, item.notes - 2),
      tasks: Math.max(0, item.tasks - 5),
      habits: Math.max(0, item.habits - 8),
    }));
  }
  return base;
};

const generateFocusData = (focusRange: { preset: PresetRange; range: DateRange }) => {
  const { preset, range } = focusRange;
  
  if (preset === 'Custom' && range.from && range.to) {
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    return days.map(day => ({
      day: format(day, days.length > 14 ? 'MMM d' : 'EEE, MMM d'),
      focus: Math.floor(Math.random() * 180) + 30
    }));
  }

  if (preset === 'Last 3 Days') {
    return [
      { day: format(subDays(new Date(), 2), 'EEE'), focus: 45 },
      { day: format(subDays(new Date(), 1), 'EEE'), focus: 120 },
      { day: 'Today', focus: 90 },
    ];
  }
  if (preset === 'Last Week') {
    return [
      { day: 'Mon', focus: 120 }, { day: 'Tue', focus: 90 }, { day: 'Wed', focus: 150 },
      { day: 'Thu', focus: 60 }, { day: 'Fri', focus: 180 }, { day: 'Sat', focus: 30 },
      { day: 'Sun', focus: 0 }
    ];
  }
  
  const length = preset === 'Last Month' ? 4 : preset === 'Last Quarter' ? 12 : preset === 'Last 6 Months' ? 24 : 52;
  const labelPrefix = preset === 'Last Month' ? 'Week' : 'W';
  return Array.from({ length }, (_, i) => ({
    day: `${labelPrefix}${i + 1}`,
    focus: Math.floor(Math.random() * 300) + 50
  }));
};

const generateDistributionData = (date: Date) => {
  if (isAfter(startOfDay(date), startOfDay(new Date()))) {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      displayTime: `${i}:00`,
      timeRange: `${i}:00 - ${i+1}:00`,
      duration: 0
    }));
  }

  const seed = date.getDate() + date.getMonth();
  return Array.from({ length: 24 }, (_, i) => {
    let base = 5;
    if (i >= 9 && i <= 11) base = 40;
    if (i >= 14 && i <= 17) base = 35;
    if (i >= 0 && i <= 5) base = 0;
    
    const duration = base === 0 ? 0 : Math.max(0, Math.floor((seed * i * 7) % 30 + base));
    
    return {
      hour: i,
      displayTime: `${i}:00`,
      timeRange: `${i}:00 - ${i+1}:00`,
      duration
    };
  });
};

type StatType = 'Notes' | 'Tasks' | 'Habits' | 'Focus' | null;

export default function Stats() {
  const [mounted, setMounted] = useState(false);
  const [selectedStat, setSelectedStat] = useState<StatType>(null);
  
  const [overviewYear, setOverviewYear] = useState<number>(2026);
  const [focusRange, setFocusRange] = useState<{ preset: PresetRange; range: DateRange }>({
    preset: 'Last Week',
    range: { from: undefined, to: undefined }
  });
  const [distributionDate, setDistributionDate] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const overviewData = generateYearlyData(overviewYear);
  const focusTrendData = generateFocusData(focusRange);
  const distributionData = generateDistributionData(distributionDate);
  const maxDuration = Math.max(...distributionData.map(d => d.duration));
  const totalDuration = distributionData.reduce((sum, item) => sum + item.duration, 0);

  const handlePrevDay = () => setDistributionDate(prev => subDays(prev, 1));
  const handleNextDay = () => setDistributionDate(prev => addDays(prev, 1));

  const renderStatDetails = () => {
    switch (selectedStat) {
      case 'Notes':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-4">Recent Notes</h4>
            {[
              { title: 'Project Ideas 2026', date: 'Today', category: 'Work' },
              { title: 'Grocery List', date: 'Yesterday', category: 'Personal' },
              { title: 'Meeting Notes: Q1 Review', date: 'Mar 25', category: 'Work' },
              { title: 'Book Recommendations', date: 'Mar 20', category: 'Leisure' },
            ].map((note, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer group">
                <div>
                  <p className="font-medium text-[var(--title)] group-hover:text-[var(--color-primary)] transition-colors">{note.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{note.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)]">{note.date}</span>
                  <ArrowRight size={14} className="text-[var(--muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'Tasks':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-4">Completion Breakdown</h4>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">On Time</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">128</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Overdue</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">14</p>
              </div>
            </div>
            <h4 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-4">Recently Completed</h4>
            {[
              { title: 'Submit quarterly report', time: '2 hours ago' },
              { title: 'Call dentist for appointment', time: 'Yesterday' },
              { title: 'Pay electricity bill', time: 'Mar 28' },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <CheckSquare size={12} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--title)] truncate">{task.title}</p>
                </div>
                <span className="text-xs text-[var(--muted)] whitespace-nowrap">{task.time}</span>
              </div>
            ))}
          </div>
        );
      case 'Habits':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl"
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg relative z-10">
                  <Flame size={40} className="text-white" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-[var(--title)]">12 Days Strong!</h3>
              <p className="text-[var(--muted)]">You're on a roll. Keep up the great work maintaining your daily routines.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-[var(--muted)]">{day}</span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    i < 5 ? "bg-green-500 text-white" : "bg-[var(--sidebar-hover)] text-[var(--muted)]"
                  )}>
                    {i < 5 ? <CheckSquare size={14} /> : <span className="text-xs">-</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Focus':
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-4">Focus Distribution</h4>
            <div className="space-y-4">
              {[
                { label: 'Deep Work', value: '25h', percent: 55, color: 'bg-purple-500' },
                { label: 'Learning', value: '12h', percent: 26, color: 'bg-blue-500' },
                { label: 'Admin', value: '8h', percent: 19, color: 'bg-gray-400' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[var(--title)]">{item.label}</span>
                    <span className="text-[var(--muted)]">{item.value}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--sidebar-hover)] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-start gap-4">
              <div className="p-2 bg-[var(--color-primary)]/20 rounded-lg text-[var(--color-primary)]">
                <Clock size={20} />
              </div>
              <div>
                <h5 className="font-medium text-[var(--title)] text-sm">Peak Productivity</h5>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">Your most productive hours are between 9:00 AM and 11:30 AM. Try scheduling your hardest tasks during this window.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--title)]">Statistics</h1>
          <p className="text-[var(--muted)] mt-1">Track your progress and productivity.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <BarChart2 size={24} />
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'Notes' as StatType, title: 'Total Notes', value: '27', icon: Book, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { id: 'Tasks' as StatType, title: 'Tasks Completed', value: '142', icon: CheckSquare, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          { id: 'Habits' as StatType, title: 'Habit Streak', value: '12 Days', icon: Target, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
          { id: 'Focus' as StatType, title: 'Focus Time', value: '45h', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedStat(stat.id)}
            className="card-container p-6 flex items-center gap-4 cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">{stat.title}</p>
              <h3 className="text-2xl font-bold text-[var(--title)]">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Overview Chart */}
        <div className="card-container p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--title)]">Activity Overview</h2>
            <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-1">
              <button 
                onClick={() => setOverviewYear(2025)}
                className={cn("px-3 py-1 rounded-md text-sm font-medium transition-colors", overviewYear === 2025 ? "bg-[var(--card)] shadow-sm text-[var(--title)]" : "text-[var(--muted)] hover:text-[var(--title)]")}
              >
                2025
              </button>
              <button 
                onClick={() => setOverviewYear(2026)}
                className={cn("px-3 py-1 rounded-md text-sm font-medium transition-colors", overviewYear === 2026 ? "bg-[var(--card)] shadow-sm text-[var(--title)]" : "text-[var(--muted)] hover:text-[var(--title)]")}
              >
                2026
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--background)' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.75rem', color: 'var(--title)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="notes" name="Notes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="tasks" name="Tasks" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="habits" name="Habits" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Time Trend */}
        <div className="card-container p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--title)]">Focus Time Trend</h2>
            <TimeRangeSelector value={focusRange} onChange={setFocusRange} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.75rem', color: 'var(--title)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="focus" 
                  name="Focus Time (mins)" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--card)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Focus Time Distribution */}
      <div className="card-container p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--title)]">Focus Time Distribution</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Daily focus duration across 4-hour intervals</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] text-[var(--muted)] hover:text-[var(--title)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="relative">
              <input 
                type="date" 
                value={format(distributionDate, 'yyyy-MM-dd')}
                onChange={(e) => e.target.value && setDistributionDate(new Date(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm font-medium text-[var(--title)] hover:bg-[var(--sidebar-hover)] transition-colors relative z-0">
                <Calendar size={14} className="text-[var(--muted)]" />
                <span>{format(distributionDate, 'MMM d, yyyy')}</span>
              </button>
            </div>
            <button 
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] text-[var(--muted)] hover:text-[var(--title)] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="h-[300px] w-full relative">
          {totalDuration === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[var(--muted)] text-sm">No focus records found for this date.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="displayTime" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted)', fontSize: 12 }} 
                  dy={10} 
                  ticks={['0:00', '4:00', '8:00', '12:00', '16:00', '20:00']}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--background)' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.75rem', color: 'var(--title)' }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.timeRange || label}
                />
                <Bar 
                  dataKey="duration" 
                  name="Focus Time (mins)" 
                  radius={[2, 2, 0, 0]} 
                  maxBarSize={12}
                  label={{ 
                    position: 'top', 
                    fill: 'var(--muted)', 
                    fontSize: 10,
                    formatter: (val: number) => val > 0 ? val : '' 
                  }}
                >
                  {distributionData.map((entry, index) => {
                    const opacity = maxDuration > 0 ? Math.max(0.2, entry.duration / maxDuration) : 0.2;
                    return <Cell key={`cell-${index}`} fill="var(--color-primary)" fillOpacity={opacity} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stat Detail Modal */}
      <AnimatePresence>
        {selectedStat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStat(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--title)]">
                    {selectedStat === 'Notes' && 'Notes Overview'}
                    {selectedStat === 'Tasks' && 'Tasks Overview'}
                    {selectedStat === 'Habits' && 'Habit Streak'}
                    {selectedStat === 'Focus' && 'Focus Insights'}
                  </h3>
                  <button 
                    onClick={() => setSelectedStat(null)}
                    className="p-2 rounded-full hover:bg-[var(--sidebar-hover)] text-[var(--muted)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                {renderStatDetails()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
