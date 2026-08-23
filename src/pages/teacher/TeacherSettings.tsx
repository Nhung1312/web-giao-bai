import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { RotateCcw, Download, Upload, ShieldCheck, Sparkles, Check, Database } from 'lucide-react';

interface TeacherSettingsProps {
  onResetData: () => void;
}

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({ onResetData }) => {
  const [copiedKeyInfo, setCopiedKeyInfo] = useState(false);

  const handleExportBackup = () => {
    const data = {
      classes: StorageService.getClasses(),
      assignments: StorageService.getAssignments(),
      submissions: StorageService.getSubmissions(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ToanTHCS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.classes && json.assignments) {
          localStorage.setItem('toan_thcs_classes', JSON.stringify(json.classes));
          localStorage.setItem('toan_thcs_assignments', JSON.stringify(json.assignments));
          if (json.submissions) {
            localStorage.setItem('toan_thcs_submissions', JSON.stringify(json.submissions));
          }
          alert('Khôi phục dữ liệu sao lưu thành công!');
          window.location.reload();
        } else {
          alert('Tệp dữ liệu không hợp lệ.');
        }
      } catch {
        alert('Lỗi đọc tệp sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Cài đặt hệ thống & Dữ liệu</h1>
        <p className="text-sm text-slate-500">
          Quản lý cơ sở dữ liệu học sinh, sao lưu dự phòng và thông tin kiến trúc ứng dụng.
        </p>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Sao lưu & Khôi phục dữ liệu</h2>
            <p className="text-xs text-slate-500">
              Xuất tệp JSON lưu trên máy tính hoặc chuyển đổi sang thiết bị khác.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Tải tệp sao lưu (Export JSON)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Lưu toàn bộ danh sách học sinh, bài tập đã tạo và lịch sử nộp bài về máy.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="mt-4 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải bản sao lưu JSON</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Nhập dữ liệu từ tệp (Import JSON)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Khôi phục lại danh sách đề thi và lớp học từ file đã sao lưu trước đó.
              </p>
            </div>
            <label className="mt-4 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Chọn file JSON...</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Demo Seed Reset */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Khôi phục Dữ liệu Mẫu (Demo Reset)</h2>
            <p className="text-xs text-slate-500">
              Đặt lại dữ liệu chuẩn gồm Lớp 6A1 (10 học sinh), Bài tập Toán 6 Phân số (20 câu) và 7 bài làm mẫu.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Thao tác này rất thuận tiện khi Thầy/Cô muốn kiểm tra lại luồng hoạt động từ đầu hoặc chạy thử bài thi mẫu.
        </p>

        <button
          onClick={onResetData}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt lại dữ liệu mẫu ban đầu</span>
        </button>
      </div>

      {/* Architecture Information for Gemini AI expansion */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-purple-950">Kiến trúc sẵn sàng tích hợp AI</h2>
            <span className="text-[11px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
              Sẵn sàng cho Gemini API
            </span>
          </div>
        </div>

        <p className="text-xs text-purple-900 leading-relaxed">
          Ứng dụng đã được xây dựng theo mô hình module phân tầng <code>IAIService</code> tại <code>src/services/aiService.ts</code>. Toàn bộ logic giao bài, chấm điểm và cơ sở dữ liệu độc lập hoàn toàn, cho phép kết nối an toàn với Gemini API qua server-side proxy khi triển khai chính thức.
        </p>
      </div>
    </div>
  );
};
