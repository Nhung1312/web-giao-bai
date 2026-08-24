import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Assignment, GradeLevel } from '../types';
import { ALL_GRADE_METAS } from '../data';
import { 
  User, 
  GraduationCap, 
  Sparkles, 
  QrCode, 
  Zap, 
  BarChart3, 
  ArrowRight,
  Calculator,
  Shapes,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  Layers,
  FileCheck
} from 'lucide-react';

interface HomePageProps {
  assignments: Assignment[];
}

export const HomePage: React.FC<HomePageProps> = ({ assignments }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStartWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setError('Vui lòng nhập mã bài tập.');
      return;
    }
    navigate(`/join?code=${encodeURIComponent(inputCode.trim().toUpperCase())}`);
  };

  const sampleAssignment = assignments[0];

  const gradeList: GradeLevel[] = ['6', '7', '8', '9'];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between transition-colors">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Hệ thống Ôn tập & Kiểm tra Toán THCS trực tuyến</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 dark:from-blue-400 dark:via-indigo-400 dark:to-teal-300 tracking-tight leading-tight mb-4">
          Lớp 6 • Lớp 7 • Lớp 8 • Lớp 9
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
          Khám phá ngân hàng đề thi và bài tập trắc nghiệm Toán THCS. Làm bài trực tiếp, chấm điểm tức thì và xem lời giải chi tiết.
        </p>

        {/* Quick Code Entry Box */}
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-indigo-100 dark:border-slate-800 mb-14">
          <form onSubmit={handleStartWithCode} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Nhập mã bài tập (Ví dụ: TOAN6A1-8K4P)"
                className="w-full uppercase font-mono font-bold tracking-wider px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-base placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-95 text-base flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              <span>VÀO THI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium text-left">{error}</p>}

          {/* Quick Demo Assignment Pill */}
          {sampleAssignment && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Đề thi mẫu:</span>
              <button
                type="button"
                onClick={() => navigate(`/join?code=${sampleAssignment.assignmentCode}`)}
                className="inline-flex items-center space-x-1 font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                <span>{sampleAssignment.assignmentCode}</span>
                <span className="font-sans font-normal text-slate-500 dark:text-slate-400">({sampleAssignment.title})</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 GRADE CARDS SECTION */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-6 text-left">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📚 Danh mục Lớp học</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300">
                  Lớp 6, 7, 8, 9
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Nhấp vào từng lớp để xem toàn bộ danh sách bài kiểm tra & đề ôn tập của lớp đó.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gradeList.map((grade) => {
              const meta = ALL_GRADE_METAS[grade];
              const count = assignments.filter(a => a.grade === grade).length;

              return (
                <div
                  key={grade}
                  onClick={() => navigate(`/grade/${grade}`)}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 ${meta.colorScheme.border} ${meta.colorScheme.hoverBorder} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer text-left flex flex-col justify-between group relative overflow-hidden`}
                >
                  {/* Decorative background subtle glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${meta.colorScheme.gradientFrom} ${meta.colorScheme.gradientTo} opacity-5 dark:opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`} />

                  <div>
                    {/* Top Grade Badge & Count */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${meta.colorScheme.badgeBg} ${meta.colorScheme.badgeText}`}>
                        {meta.badge}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {count} đề thi
                      </span>
                    </div>

                    {/* Grade Title & Subtitle */}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {meta.title}
                    </h3>
                    <p className={`text-xs font-bold mt-1 ${meta.colorScheme.accentText} line-clamp-1`}>
                      {meta.subtitle}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {meta.description}
                    </p>

                    {/* Topic preview tags */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                      {meta.sampleTopics.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Button */}
                  <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className={`w-full py-2.5 px-3.5 rounded-xl ${meta.colorScheme.btnBg} font-bold text-xs flex items-center justify-between shadow-xs group-hover:shadow-md transition-all`}>
                      <span>Xem bài tập {meta.title}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2 Big Action Portals (Teacher & Student) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-16">
          {/* Teacher Portal */}
          <Link
            to="/teacher"
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-850 border-2 border-indigo-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-lg transition-all text-left flex items-start space-x-4 active:scale-98"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                Dành cho Thầy/Cô
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                👨‍🏫 GIÁO VIÊN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tạo lớp, nhập file Excel/Word/PDF, quản lý đề theo từng lớp, xuất PDF đề thi và xem bảng xếp hạng.
              </p>
            </div>
          </Link>

          {/* Student Portal */}
          <Link
            to="/join"
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 hover:bg-emerald-50/40 dark:hover:bg-slate-850 border-2 border-emerald-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all text-left flex items-start space-x-4 active:scale-98"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                Dành cho các em
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                👨‍🎓 HỌC SINH
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Vào phòng thi nhanh với mã bài tập, làm bài tự do theo từng lớp và nhận lời giải chi tiết.
              </p>
            </div>
          </Link>
        </div>

        {/* Platform Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Giao bài 1 chạm bằng QR</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tạo mã bài tập ngắn gọn hoặc mã QR để gửi qua nhóm Zalo, học sinh vào làm tức thì không cần đăng ký.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Tự động chấm & Lời giải</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hệ thống tự chấm bài trắc nghiệm ngay khi bấm nộp, phân tích lỗi sai và hiển thị lời giải từng bước.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Phân tích kết quả theo Lớp</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Bảng xếp hạng vinh danh Top 3, phát hiện các câu hỏi học sinh hay nhầm lẫn nhất để củng cố.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            TOÁN THCS – Nền tảng Ôn tập & Kiểm tra Toán Lớp 6, Lớp 7, Lớp 8, Lớp 9
          </p>
          <div className="flex items-center space-x-3 text-slate-500">
            <Link to="/grade/6" className="hover:text-indigo-600">Lớp 6</Link>
            <span>•</span>
            <Link to="/grade/7" className="hover:text-indigo-600">Lớp 7</Link>
            <span>•</span>
            <Link to="/grade/8" className="hover:text-indigo-600">Lớp 8</Link>
            <span>•</span>
            <Link to="/grade/9" className="hover:text-indigo-600">Lớp 9</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
