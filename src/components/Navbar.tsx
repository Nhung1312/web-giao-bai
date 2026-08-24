import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, GraduationCap, RotateCcw, Sparkles, Moon, Sun, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GradeLevel } from '../types';

interface NavbarProps {
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onResetData }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isTeacher = location.pathname.startsWith('/teacher');
  const isStudent = location.pathname.startsWith('/join') || location.pathname.startsWith('/exam');
  const isGrade = location.pathname.startsWith('/grade');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                TOÁN THCS
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                Giao bài • Luyện tập • Tự chấm
              </p>
            </div>
          </Link>

          {/* Grade Quick Navigation Dropdown/Buttons on larger screens */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['6', '7', '8', '9'] as GradeLevel[]).map((g) => {
              const active = location.pathname === `/grade/${g}`;
              return (
                <Link
                  key={g}
                  to={`/grade/${g}`}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Lớp {g}
                </Link>
              );
            })}
          </div>

          {/* Actions & Role switchers */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối (Dịu mắt khi học đêm)'}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center active:scale-95"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Quick Demo Reset (Desktop only to save space on mobile) */}
            <button
              onClick={onResetData}
              title="Khôi phục dữ liệu mẫu chuẩn (Lớp 6, 7, 8, 9)"
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Dữ liệu mẫu</span>
            </button>

            {/* Desktop Role switchers (hidden on mobile, handled by MobileBottomNav) */}
            <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <Link
                to="/teacher"
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isTeacher
                    ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-200" />
                <span>Giáo viên</span>
              </Link>

              <Link
                to="/join"
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isStudent
                    ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-200" />
                <span>Học sinh</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
