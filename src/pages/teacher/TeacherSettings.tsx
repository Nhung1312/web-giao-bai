import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { aiService, HybridAIService } from '../../services/aiService';
import { 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles, 
  Check, 
  Database, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface TeacherSettingsProps {
  onResetData: () => void;
}

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({ onResetData }) => {
  // Gemini API state
  const hybridAi = aiService as HybridAIService;
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [autoGradeEnabled, setAutoGradeEnabled] = useState<boolean>(true);
  
  // Test connection state
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; modelUsed?: string } | null>(null);

  useEffect(() => {
    const currentKey = hybridAi.getApiKey() || '';
    setApiKeyInput(currentKey);
    setSelectedModel(hybridAi.getModel() || 'gemini-2.5-flash');
    setAutoGradeEnabled(hybridAi.isAutoGradeEnabled());
  }, []);

  const handleSaveApiKey = () => {
    hybridAi.setApiKey(apiKeyInput);
    hybridAi.setModel(selectedModel);
    hybridAi.setAutoGradeEnabled(autoGradeEnabled);
    setSavedKeySuccess(true);
    setTestResult(null);
    setTimeout(() => setSavedKeySuccess(false), 3000);
  };

  const handleClearApiKey = () => {
    if (window.confirm('Bạn có chắc chắn muốn gỡ bỏ Gemini API Key? Hệ thống sẽ tự động chuyển sang chế độ phân tích toán học thông minh ngoại tuyến.')) {
      hybridAi.clearApiKey();
      setApiKeyInput('');
      setTestResult(null);
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 3000);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await hybridAi.testConnection(apiKeyInput);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Lỗi không xác định: ' + (err.message || String(err))
      });
    } finally {
      setTestingConnection(false);
    }
  };

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
          localStorage.setItem('toan_thcs_classes_v4', JSON.stringify(json.classes));
          localStorage.setItem('toan_thcs_assignments_v4', JSON.stringify(json.assignments));
          if (json.submissions) {
            localStorage.setItem('toan_thcs_submissions_v4', JSON.stringify(json.submissions));
          }
          alert('Khôi phục dữ liệu sao lưu thành công!');
          window.location.reload();
        } else {
          alert('Tệp dữ liệu không đúng cấu trúc TOÁN THCS.');
        }
      } catch {
        alert('Lỗi đọc tệp sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  const hasConfiguredKey = Boolean(apiKeyInput && apiKeyInput.trim().length > 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Cài đặt hệ thống & Cấu hình AI</h1>
        <p className="text-sm text-slate-500">
          Cấu hình trợ lý Gemini AI chấm bài tự luận, quản lý cơ sở dữ liệu và sao lưu dự phòng.
        </p>
      </div>

      {/* SECTION 1: GEMINI AI CONFIGURATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base text-slate-900">Cấu hình Trợ lý Gemini AI</h2>
                {hasConfiguredKey ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Đã kết nối API
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                    Chế độ quy tắc ngoại tuyến
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Tự động nhận diện ảnh chụp bài làm tự luận của học sinh, chấm điểm chi tiết và gợi ý phương pháp giải.
              </p>
            </div>
          </div>
        </div>

        {/* API Key Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Google Gemini API Key (Lưu cục bộ tại trình duyệt):</span>
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold inline-flex items-center gap-1"
              >
                <span>Lấy khóa miễn phí tại Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Selection & Auto-Grade Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mô hình AI sử dụng:</span>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Nhanh & chuẩn Toán)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Chuyên sâu toán học & hình học)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tốc độ cao)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={autoGradeEnabled}
                  onChange={(e) => setAutoGradeEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Tự động chấm bài tự luận khi học sinh nộp ảnh
                </span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={handleSaveApiKey}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu cấu hình</span>
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{testingConnection ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>

            {apiKeyInput && (
              <button
                onClick={handleClearApiKey}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <span>Xóa Key</span>
              </button>
            )}

            {savedKeySuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công!
              </span>
            )}
          </div>

          {/* Test Connection Alert Box */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs animate-in fade-in duration-200 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.success ? 'Kết nối thành công!' : 'Kiểm tra kết nối thất bại'}
                  </div>
                  <p className="mt-0.5 opacity-90">{testResult.message}</p>
                  {testResult.modelUsed && (
                    <div className="mt-1 font-mono text-[11px] opacity-75">
                      Model đang hoạt động: {testResult.modelUsed}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Guide Card */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 text-xs text-purple-900 space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-purple-950">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>Hướng dẫn lấy Gemini API Key miễn phí:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-purple-800 text-[11px] leading-relaxed">
              <li>Truy cập <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-purple-900">Google AI Studio (aistudio.google.com/apikey)</a>.</li>
              <li>Đăng nhập bằng tài khoản Google của Thầy/Cô và nhấn <strong>Create API Key</strong>.</li>
              <li>Sao chép mã API Key vừa tạo, dán vào ô bên trên và bấm <strong>Lưu cấu hình</strong>.</li>
              <li>Nếu không nhập API Key, hệ thống vẫn hoạt động mượt mà bằng bộ phân tích toán học thông minh tích hợp sẵn.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* SECTION 2: BACKUP & RESTORE */}
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
              className="mt-4 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
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

      {/* SECTION 3: DEMO SEED RESET */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Khôi phục Dữ liệu Mẫu (Demo Reset)</h2>
            <p className="text-xs text-slate-500">
              Đặt lại dữ liệu chuẩn gồm Khối 6, 7, 8, 9, danh sách học sinh và các bài kiểm tra mẫu.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Thao tác này rất thuận tiện khi Thầy/Cô muốn làm sạch dữ liệu thử nghiệm và tải lại toàn bộ ngân hàng câu hỏi gốc.
        </p>

        <button
          onClick={onResetData}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Đặt lại dữ liệu mẫu ban đầu</span>
        </button>
      </div>
    </div>
  );
};
