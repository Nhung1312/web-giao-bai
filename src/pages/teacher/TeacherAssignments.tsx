import React, { useState } from 'react';
import { Assignment, ClassRoom, Submission } from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  BookOpen, 
  Plus, 
  Share2, 
  BarChart3, 
  Trash2, 
  Clock, 
  Calendar, 
  Play, 
  Search, 
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface TeacherAssignmentsProps {
  assignments: Assignment[];
  classes: ClassRoom[];
  submissions: Submission[];
  onRefresh: () => void;
  onNavigate: (tab: string, params?: any) => void;
  onOpenShare: (assignment: Assignment) => void;
  onTestAssignment: (assignment: Assignment) => void;
}

export const TeacherAssignments: React.FC<TeacherAssignmentsProps> = ({
  assignments,
  classes,
  submissions,
  onRefresh,
  onNavigate,
  onOpenShare,
  onTestAssignment
}) => {
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa bài tập "${title}"?`)) {
      StorageService.deleteAssignment(id);
      onRefresh();
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      //
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (filterGrade !== 'all' && a.grade !== filterGrade) return false;
    if (filterClass !== 'all' && a.classId !== filterClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q) ||
        a.assignmentCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản lý bài tập & Đề thi</h1>
          <p className="text-sm text-slate-500">
            Tạo mã bài tập, quản lý ngân hàng câu hỏi và theo dõi hạn nộp.
          </p>
        </div>
        <button
          onClick={() => onNavigate('create')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo bài mới</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài, chủ đề, mã bài..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Grade Filter */}
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
        >
          <option value="all">Tất cả khối lớp</option>
          <option value="6">Khối 6</option>
          <option value="7">Khối 7</option>
          <option value="8">Khối 8</option>
          <option value="9">Khối 9</option>
        </select>

        {/* Class Filter */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
        >
          <option value="all">Tất cả lớp học</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>Lớp {cls.name}</option>
          ))}
        </select>
      </div>

      {/* Assignments Cards List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">Chưa có bài tập nào phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Bấm "+ Tạo bài mới" để soạn bộ câu hỏi Toán THCS và giao cho học sinh.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((asg) => {
            const asgSubs = submissions.filter(s => s.assignmentId === asg.id);
            const targetClass = classes.find(c => c.id === asg.classId);
            const classStudentCount = targetClass ? (targetClass.students?.length || 0) : 10;

            return (
              <div
                key={asg.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Khối {asg.grade}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Lớp {asg.className || 'Toàn khối'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(asg.id, asg.title)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{asg.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{asg.topic}</p>

                  {/* Code chip */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Mã bài tập</span>
                      <span className="font-mono font-extrabold text-indigo-900 text-base">
                        {asg.assignmentCode}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(asg.assignmentCode)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      {copiedCode === asg.assignmentCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép mã</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Details stats */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asg.questions.length} câu</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asg.durationMinutes > 0 ? `${asg.durationMinutes} phút` : 'Tự do'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">
                        {asgSubs.length}/{classStudentCount} đã nộp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => onOpenShare(asg)}
                    className="flex items-center justify-center space-x-1 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors border border-blue-200"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Lấy QR</span>
                  </button>

                  <button
                    onClick={() => onTestAssignment(asg)}
                    className="flex items-center justify-center space-x-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Làm thử</span>
                  </button>

                  <button
                    onClick={() => onNavigate('results', { assignmentId: asg.id })}
                    className="flex items-center justify-center space-x-1 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Kết quả</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
