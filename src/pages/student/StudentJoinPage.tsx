import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { Assignment, ClassRoom } from '../../types';
import { ArrowRight, Clock, HelpCircle, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

interface StudentJoinPageProps {
  initialCode?: string;
  onStartExam: (assignment: Assignment, studentName: string, classId: string, className: string) => void;
}

export const StudentJoinPage: React.FC<StudentJoinPageProps> = ({ initialCode = '', onStartExam }) => {
  const [code, setCode] = useState(initialCode);
  const [studentName, setStudentName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const loadedClasses = StorageService.getClasses();
    setClasses(loadedClasses);
    if (loadedClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(loadedClasses[0].id);
    }
    const allAssignments = StorageService.getAssignments();
    setRecentAssignments(allAssignments);

    if (initialCode) {
      handleLookupCode(initialCode);
    }
  }, [initialCode]);

  const handleLookupCode = (searchCode: string) => {
    setErrorMsg('');
    if (!searchCode.trim()) {
      setAssignment(null);
      return;
    }
    const found = StorageService.getAssignmentByCode(searchCode);
    if (found) {
      setAssignment(found);
      if (found.classId && found.classId !== 'all') {
        setSelectedClassId(found.classId);
      }
    } else {
      setAssignment(null);
      setErrorMsg('Không tìm thấy bài tập với mã này. Vui lòng kiểm tra lại mã bài tập do giáo viên cung cấp.');
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) {
      setErrorMsg('Vui lòng nhập mã bài tập hợp lệ.');
      return;
    }
    if (!studentName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên của bạn.');
      return;
    }

    let className = 'Tự do';
    const foundClass = classes.find(c => c.id === selectedClassId);
    if (foundClass) {
      className = foundClass.name;
    } else if (customClassName.trim()) {
      className = customClassName.trim();
    }

    onStartExam(assignment, studentName.trim(), selectedClassId || 'other', className);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Vào phòng làm bài thi Toán
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
          Nhập mã bài tập được giáo viên giao để bắt đầu luyện tập và tự chấm điểm ngay lập tức.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        <form onSubmit={handleStart} className="space-y-5">
          {/* Step 1: Mã bài tập */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              1. Mã bài tập <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setCode(val);
                  if (val.length >= 6) {
                    handleLookupCode(val);
                  }
                }}
                placeholder="Ví dụ: TOAN6A1-8K4P"
                className="flex-1 uppercase font-mono font-bold tracking-wider px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal text-base"
                required
              />
              <button
                type="button"
                onClick={() => handleLookupCode(code)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
              >
                Kiểm tra mã
              </button>
            </div>
            
            {/* Quick Demo Code Selection Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Thử nhanh mã mẫu:</span>
              {recentAssignments.slice(0, 2).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setCode(a.assignmentCode);
                    handleLookupCode(a.assignmentCode);
                  }}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-mono font-medium border border-emerald-200 transition-colors"
                >
                  {a.assignmentCode} ({a.className || a.title})
                </button>
              ))}
            </div>
          </div>

          {/* Assignment Preview Card if found */}
          {assignment && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã tìm thấy bài tập
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg">{assignment.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Chủ đề: <span className="font-medium text-slate-800">{assignment.topic}</span> • Khối {assignment.grade}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-200/60 text-xs">
                <div className="flex items-center space-x-1 text-slate-700">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span><strong>{assignment.questions.length}</strong> câu hỏi</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    {assignment.durationMinutes > 0 ? (
                      <strong>{assignment.durationMinutes} phút</strong>
                    ) : (
                      'Tự do'
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Tự chấm ngay</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Họ và tên */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              2. Họ và tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-base"
              required
            />
          </div>

          {/* Step 3: Chọn lớp */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              3. Lớp học <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-base"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp {cls.name} (Khối {cls.grade}) - {cls.students?.length || 0} học sinh
                </option>
              ))}
              <option value="other">-- Lớp khác (Tự nhập) --</option>
            </select>

            {selectedClassId === 'other' && (
              <input
                type="text"
                value={customClassName}
                onChange={(e) => setCustomClassName(e.target.value)}
                placeholder="Nhập tên lớp của bạn (Ví dụ: 6A3)"
                className="mt-2 w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
              />
            )}
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Start Exam Button - 3 Clicks Flow */}
          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <span>BẮT ĐẦU LÀM BÀI</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Học sinh không cần tạo tài khoản. Kết quả sẽ được lưu và chấm tự động ngay khi bấm nộp bài.
          </p>
        </div>
      </div>
    </div>
  );
};
