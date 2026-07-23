import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Hệ Thống Thi Trắc Nghiệm Trực Tuyến
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {isAdmin ? (
            <>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Admin: {user?.username}</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>{user?.student_info?.full_name || user?.username} ({user?.student_info?.student_id})</span>
            </>
          )}
        </div>

        {/* Dark Mode Switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Chuyển đổi giao diện Sáng / Tối"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
