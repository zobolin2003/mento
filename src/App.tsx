import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import Notes from './pages/Notes';
import Journal from './pages/Journal';
import AI from './pages/AI';
import Pomodoro from './pages/Pomodoro';
import Habits from './pages/Habits';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="notes" element={<Notes />} />
              <Route path="journal" element={<Journal />} />
              <Route path="ai" element={<AI />} />
              <Route path="pomodoro" element={<Pomodoro />} />
              <Route path="habits" element={<Habits />} />
              <Route path="stats" element={<Stats />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
