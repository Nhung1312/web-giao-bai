import React from 'react';
import { Assignment, ClassRoom, Submission } from '../../types';
import { 
  Users, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  PlusCircle, 
  TrendingUp, 
  Share2, 
  BarChart3, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TeacherOverviewProps {
  classes: ClassRoom[];
  assignments: Assignment[];
  submissions: Submission[];
  onNavigate: (tab: string, params?: any) => void;
  onOpenShare: (assignment: Assignment) => void;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({
  classes,
  assignments,
  submissions,
  onNavigate,
  onOpenShare
}) => {
  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);
  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter(a => a.isPublished).length;
  const totalSubmissions = submissions.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            Khu vực Quản trị Giáo viên
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chào mừng Thầy/Cô đến với TOÁN THCS
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mt-2 leading-relaxed">
            Hệ thống tạo đề, giao bài tập tự động bằng mã QR và phân tích chi tiết kết quả học tập của từng lớp.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigate('create')}
              className="inline-flex items-center space-x-2 bg-white text-indigo-700 hover:bg-blue-50 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tạo bài tập mới</span>
            </button>
            <button
              onClick={() => onNavigate('classes')}
              className="inline-flex items-center space-x-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl border border-indigo-400/40 transition-all text-sm"
            >
              <Users className="w-4 h-4" />
              <span>Quản lý lớp học</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Số lớp học</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{classes.length}</div>
          <span className="text-xs text-slate-400 mt-1 block">Lớp đang quản lý</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Học sinh</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalStudents}</div>
          <span className="text-xs text-slate-400 mt-1 block">Học sinh trong danh sách</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-violet-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng bài tập</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalAssignments}</div>
          <span className="text-xs text-slate-400 mt-1 block">Đề thi & bài luyện</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Đang giao</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeAssignments}</div>
          <span className="text-xs text-slate-400 mt-1 block">Bài tập có hiệu lực</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Bài đã nộp</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalSubmissions}</div>
          <span className="text-xs text-slate-400 mt-1 block">Lượt nộp đã tự chấm</span>
        </div>
      </div>

      {/* Recent Assignments Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh sách bài tập gần đây</h2>
            <p className="text-xs text-slate-500">
              Theo dõi tiến độ làm bài, mã bài tập và kết quả chấm điểm của học sinh.
            </p>
          </div>
          <button
            onClick={() => onNavigate('assignments')}
            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Xem tất cả ({assignments.length})</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-y border-slate-200">
                <th className="py-3 px-4">Bài tập</th>
                <th className="py-3 px-3">Lớp</th>
                <th className="py-3 px-3 text-center">Số câu</th>
                <th className="py-3 px-3">Mã bài</th>
                <th className="py-3 px-3 text-center">Đã nộp</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((asg) => {
                const asgSubmissions = submissions.filter(s => s.assignmentId === asg.id);
                const targetClass = classes.find(c => c.id === asg.classId);
                const studentCount = targetClass ? (targetClass.students?.length || 0) : 10;

                return (
                  <tr key={asg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{asg.title}</div>
                      <div className="text-xs text-slate-500">{asg.topic} • Khối {asg.grade}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-md">
                        {asg.className || 'Toàn khối'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {asg.questions.length}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                        {asg.assignmentCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs border border-emerald-200">
                        {asgSubmissions.length} / {studentCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onOpenShare(asg)}
                          title="Lấy mã QR & Link"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('results', { assignmentId: asg.id })}
                          title="Xem kết quả & Thống kê"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-lg transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Kết quả</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
