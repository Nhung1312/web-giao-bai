import React from 'react';
import { BookOpen, User, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentRole: 'home' | 'teacher' | 'student';
  onSelectRole: (role: 'home' | 'teacher' | 'student') => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onSelectRole, onResetData }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => onSelectRole('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                TOÁN THCS
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Luyện tập
                </span>
              </span>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Giao bài • Luyện tập • Tự chấm
              </p>
            </div>
          </div>

          {/* Role Navigation & Reset */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Demo Reset */}
            <button
              onClick={onResetData}
              title="Khôi phục dữ liệu mẫu chuẩn (Lớp 6A1, 20 câu phân số, bài nộp thử)"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Dữ liệu mẫu</span>
            </button>

            {/* Role switchers */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => onSelectRole('teacher')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentRole === 'teacher'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>Giáo viên</span>
              </button>

              <button
                onClick={() => onSelectRole('student')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentRole === 'student'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Học sinh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
