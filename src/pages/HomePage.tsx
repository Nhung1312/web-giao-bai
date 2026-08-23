import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  QrCode, 
  BarChart3, 
  Clock, 
  Sparkles, 
  Zap
} from 'lucide-react';
import { Assignment } from '../types';

interface HomePageProps {
  assignments: Assignment[];
  onSelectRole: (role: 'teacher' | 'student') => void;
  onEnterCode: (code: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  assignments,
  onSelectRole,
  onEnterCode
}) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const handleStartWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setError('Vui lòng nhập mã bài tập.');
      return;
    }
    onEnterCode(inputCode.trim().toUpperCase());
  };

  const sampleAssignment = assignments[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Nền tảng Toán THCS trực tuyến hiện đại</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          TOÁN THCS
        </h1>
        <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-8">
          Giao bài – Luyện tập – Kiểm tra
        </p>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed mb-10">
          Giải pháp toàn diện giúp giáo viên tạo đề kiểm tra, giao bài bằng mã QR hoặc link nhanh; học sinh làm bài không cần tài khoản phức tạp, hệ thống tự động chấm điểm tức thì.
        </p>

        {/* Quick Code Entry Box (Section 2 Requirement) */}
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-indigo-100 mb-12">
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
                className="w-full uppercase font-mono font-bold tracking-wider px-5 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-base placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-95 text-base flex items-center justify-center space-x-2 shrink-0"
            >
              <span>BẮT ĐẦU</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {error && <p className="text-xs text-rose-600 mt-2 font-medium text-left">{error}</p>}

          {/* Quick Demo Assignment Pill */}
          {sampleAssignment && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span>Đề mẫu có sẵn:</span>
              <button
                type="button"
                onClick={() => onEnterCode(sampleAssignment.assignmentCode)}
                className="inline-flex items-center space-x-1 font-mono font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
              >
                <span>{sampleAssignment.assignmentCode}</span>
                <span className="font-sans font-normal text-slate-500">({sampleAssignment.title})</span>
              </button>
            </div>
          )}
        </div>

        {/* 2 Big Role Buttons (Section 2 Requirement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16">
          {/* Teacher Button */}
          <button
            type="button"
            onClick={() => onSelectRole('teacher')}
            className="group p-6 rounded-3xl bg-white hover:bg-indigo-50/50 border-2 border-indigo-200 hover:border-indigo-500 shadow-md hover:shadow-xl transition-all text-left flex items-start space-x-4 active:scale-98"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                Dành cho Thầy/Cô
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 group-hover:text-indigo-700 transition-colors">
                👨‍🏫 GIÁO VIÊN
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tạo lớp, nhập danh sách, soạn câu hỏi, tạo mã QR và phân tích chi tiết kết quả.
              </p>
            </div>
          </button>

          {/* Student Button */}
          <button
            type="button"
            onClick={() => onSelectRole('student')}
            className="group p-6 rounded-3xl bg-white hover:bg-emerald-50/50 border-2 border-emerald-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all text-left flex items-start space-x-4 active:scale-98"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-emerald-600 tracking-wider">
                Dành cho các em
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 group-hover:text-emerald-700 transition-colors">
                👨‍🎓 HỌC SINH
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Vào làm bài ngay bằng mã hoặc quét QR, tự động chấm điểm và xem lời giải chi tiết.
              </p>
            </div>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Giao bài 1 chạm bằng QR</h4>
            <p className="text-xs text-slate-500 mt-1">
              Tạo mã bài tập ngắn gọn hoặc mã QR để gửi qua nhóm Zalo, học sinh vào thi tức thì.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Tự động chấm & Báo điểm</h4>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống chấm trắc nghiệm ngay khi bấm nộp bài kèm lời giải chi tiết từng bước.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Phân tích câu sai nhiều nhất</h4>
            <p className="text-xs text-slate-500 mt-1">
              Thống kê tỷ lệ đúng từng câu, phát hiện ngay chủ đề học sinh còn yếu để kịp thời ôn tập.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">TOÁN THCS – Giao bài & Luyện tập trực tuyến</p>
        <p className="mt-1">Dành cho học sinh và giáo viên THCS (Khối 6, 7, 8, 9) theo chương trình mới.</p>
      </footer>
    </div>
  );
};
