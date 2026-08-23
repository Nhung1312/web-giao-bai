import React, { useState, useMemo } from 'react';
import { Assignment, ClassRoom, Submission, QuestionAnalysis } from '../../types';
import { GradingService } from '../../services/gradingService';
import { aiService } from '../../services/aiService';
import { MathDisplay } from '../../components/MathDisplay';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Trophy, 
  ArrowUpDown, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Download,
  BookOpen,
  Filter,
  Eye
} from 'lucide-react';

interface TeacherResultsProps {
  assignments: Assignment[];
  classes: ClassRoom[];
  submissions: Submission[];
  initialAssignmentId?: string;
  onOpenShare: (assignment: Assignment) => void;
}

export const TeacherResults: React.FC<TeacherResultsProps> = ({
  assignments,
  classes,
  submissions,
  initialAssignmentId,
  onOpenShare
}) => {
  const [selectedAsgId, setSelectedAsgId] = useState<string>(
    initialAssignmentId || assignments[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'submissions' | 'unsubmitted' | 'analysis'>('submissions');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'time' | 'submittedAt'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedSubmissionDetail, setSelectedSubmissionDetail] = useState<Submission | null>(null);

  // AI Weakness Analysis state
  const [aiReport, setAiReport] = useState<{
    summary: string;
    weakTopics: string[];
    recommendations: string[];
  } | null>(null);
  const [loadingAiReport, setLoadingAiReport] = useState(false);

  const currentAssignment = assignments.find(a => a.id === selectedAsgId) || assignments[0];
  const targetClass = currentAssignment ? classes.find(c => c.id === currentAssignment.classId) : null;
  const classStudents = targetClass?.students || [];

  // Filter submissions for current assignment
  const currentSubmissions = useMemo(() => {
    return submissions.filter(s => s.assignmentId === currentAssignment?.id);
  }, [submissions, currentAssignment]);

  // Compute full stats
  const stats = useMemo(() => {
    if (!currentAssignment) return null;
    return GradingService.computeAssignmentStats(
      currentAssignment,
      classStudents.length || 10,
      currentSubmissions
    );
  }, [currentAssignment, classStudents, currentSubmissions]);

  // Find unsubmitted students
  const unsubmittedStudents = useMemo(() => {
    if (!targetClass) return [];
    const submittedStudentNames = new Set(currentSubmissions.map(s => s.studentName.toLowerCase().trim()));
    return targetClass.students.filter(
      st => !submittedStudentNames.has(st.name.toLowerCase().trim())
    );
  }, [targetClass, currentSubmissions]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    let list = [...currentSubmissions];
    if (searchStudent.trim()) {
      list = list.filter(s => s.studentName.toLowerCase().includes(searchStudent.toLowerCase()));
    }

    list.sort((a, b) => {
      let res = 0;
      if (sortBy === 'name') {
        res = a.studentName.localeCompare(b.studentName);
      } else if (sortBy === 'score') {
        res = a.totalScore - b.totalScore;
      } else if (sortBy === 'time') {
        res = a.timeSpentSeconds - b.timeSpentSeconds;
      } else if (sortBy === 'submittedAt') {
        res = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      return sortOrder === 'desc' ? -res : res;
    });

    return list;
  }, [currentSubmissions, searchStudent, sortBy, sortOrder]);

  const handleSort = (field: 'name' | 'score' | 'time' | 'submittedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Run simulated AI Class analysis
  const handleRunAiAnalysis = async () => {
    if (!stats || !currentAssignment) return;
    setLoadingAiReport(true);
    try {
      const report = await aiService.analyzeClassMistakes({
        assignmentTitle: currentAssignment.title,
        grade: currentAssignment.grade,
        totalStudents: currentSubmissions.length,
        questionAnalyses: stats.questionAnalyses,
        submissions: currentSubmissions
      });
      setAiReport(report);
    } catch {
      alert('Không thể thực hiện phân tích lúc này.');
    } finally {
      setLoadingAiReport(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (currentSubmissions.length === 0) return;
    const header = ['STT', 'Họ và tên', 'Lớp', 'Điểm', 'Số câu đúng', 'Số câu sai', 'Thời gian làm', 'Ngày nộp'];
    const rows = currentSubmissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.className}"`,
      s.totalScore,
      s.correctCount,
      s.wrongCount,
      `"${GradingService.formatDuration(s.timeSpentSeconds)}"`,
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KetQua_${currentAssignment?.assignmentCode || 'ToanTHCS'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentAssignment) {
    return (
      <div className="text-center py-12 text-slate-500">
        Chưa có bài tập nào để xem kết quả.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header & Assignment Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Báo cáo & Kết quả bài làm</h1>
          <p className="text-sm text-slate-500">
            Theo dõi phổ điểm, danh sách đã nộp/chưa nộp và phân tích sâu từng câu hỏi.
          </p>
        </div>

        {/* Assignment Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-600 shrink-0">Chọn bài tập:</label>
          <select
            value={selectedAsgId}
            onChange={(e) => {
              setSelectedAsgId(e.target.value);
              setAiReport(null);
              setSelectedSubmissionDetail(null);
            }}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500"
          >
            {assignments.map((asg) => (
              <option key={asg.id} value={asg.id}>
                {asg.title} ({asg.className || 'Toàn khối'}) - Mã: {asg.assignmentCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Tổng học sinh</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.totalAssigned || 0}
          </div>
          <span className="text-[11px] text-slate-500">Sĩ số lớp {currentAssignment.className}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase">Đã nộp bài</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {stats?.submittedCount || 0}
          </div>
          <span className="text-[11px] text-emerald-600">
            {stats?.totalAssigned ? Math.round((stats.submittedCount / stats.totalAssigned) * 100) : 0}% hoàn thành
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-rose-500 uppercase">Chưa nộp</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {unsubmittedStudents.length}
          </div>
          <span className="text-[11px] text-rose-500">Cần nhắc nhở</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-indigo-600 uppercase">Điểm trung bình</div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">
            {stats?.averageScore || 0}
            <span className="text-xs font-normal text-slate-400">/10</span>
          </div>
          <span className="text-[11px] text-slate-500">Toàn lớp</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-amber-600 uppercase">Điểm cao nhất</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {stats?.highestScore || 0}
            <span className="text-xs font-normal text-slate-400">/10</span>
          </div>
          <span className="text-[11px] text-slate-500">Thủ khoa lớp</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Điểm thấp nhất</div>
          <div className="text-2xl font-extrabold text-slate-700 mt-1">
            {stats?.lowestScore || 0}
            <span className="text-xs font-normal text-slate-400">/10</span>
          </div>
          <span className="text-[11px] text-slate-500">Cần phụ đạo</span>
        </div>
      </div>

      {/* Tabs Navigation & Action Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'submissions'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Đã nộp ({stats?.submittedCount || 0})
          </button>

          <button
            onClick={() => setActiveTab('unsubmitted')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'unsubmitted'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Chưa nộp ({unsubmittedStudents.length})
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'analysis'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Phân tích từng câu hỏi
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel/CSV</span>
          </button>

          <button
            onClick={() => onOpenShare(currentAssignment)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors"
          >
            <span>Mã bài: {currentAssignment.assignmentCode}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Submissions Table */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Tìm học sinh theo tên..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              Nhấp vào tiêu đề cột để sắp xếp
            </span>
          </div>

          {sortedSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Chưa có học sinh nào nộp bài</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Chia sẻ mã bài tập <strong>{currentAssignment.assignmentCode}</strong> để học sinh làm bài.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-y border-slate-200">
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th
                      onClick={() => handleSort('name')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1">
                        <span>Họ và tên</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('score')}
                      className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Điểm số</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Đúng / Tổng</th>
                    <th
                      onClick={() => handleSort('time')}
                      className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Thời gian</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('submittedAt')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1">
                        <span>Thời điểm nộp</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedSubmissions.map((sub, idx) => {
                    const scoreColor =
                      sub.totalScore >= 8.0
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : sub.totalScore >= 6.5
                        ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                        : sub.totalScore >= 5.0
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-rose-700 bg-rose-50 border-rose-200';

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center text-xs font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {sub.studentName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl font-extrabold text-sm border ${scoreColor}`}
                          >
                            {sub.totalScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-semibold">
                          <span className="text-emerald-600 font-bold">{sub.correctCount}</span>
                          <span className="text-slate-400">/{sub.totalQuestions}</span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-medium text-slate-600">
                          {GradingService.formatTimeShort(sub.timeSpentSeconds)}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          •{' '}
                          {new Date(sub.submittedAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedSubmissionDetail(sub)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem bài</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Unsubmitted Students */}
      {activeTab === 'unsubmitted' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Danh sách học sinh chưa nộp bài ({unsubmittedStudents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Lớp {currentAssignment.className} • Hạn nộp: {new Date(currentAssignment.deadline).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {unsubmittedStudents.length === 0 ? (
            <div className="text-center py-12 bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <p className="text-base font-bold text-emerald-900">100% Học sinh đã nộp bài!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Tất cả học sinh trong danh sách lớp đều đã hoàn thành bài tập này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {unsubmittedStudents.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{st.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{st.code || 'HS'}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                    Chưa nộp
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Question Item Analysis (Section 11) */}
      {activeTab === 'analysis' && stats && (
        <div className="space-y-6">
          {/* Section: CÂU HỌC SINH SAI NHIỀU NHẤT */}
          <div className="bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-rose-200/80 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  CÁC CÂU HỌC SINH SAI NHIỀU NHẤT
                </h3>
                <p className="text-xs text-slate-600">
                  Phần kiến thức học sinh hay nhầm lẫn nhất cần giáo viên giảng lại trên lớp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {stats.mostMissedQuestions.map((q, idx) => (
                <div
                  key={q.questionId}
                  className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        Top {idx + 1} sai nhiều
                      </span>
                      <span className="text-xs font-extrabold text-rose-600">
                        {100 - q.accuracyRate}% sai ({q.wrongCount}/{q.totalResponses} em)
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-900 mb-2 line-clamp-2">
                      Câu {q.order}: {q.questionText}
                    </div>

                    {q.topicHint && (
                      <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg font-medium mb-2">
                        Dạng bài: <strong>{q.topicHint}</strong>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    Đáp án đúng: <strong className="text-emerald-700">{q.correctAnswer}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Class Weakness Analysis Simulated Hook */}
            <div className="mt-6 pt-4 border-t border-rose-200/60">
              {!aiReport ? (
                <button
                  onClick={handleRunAiAnalysis}
                  disabled={loadingAiReport}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {loadingAiReport ? 'Đang phân tích dữ liệu toàn lớp...' : '💡 AI Phân tích điểm yếu & Đề xuất phương án giảng dạy'}
                  </span>
                </button>
              ) : (
                <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-xs space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Báo cáo Sư phạm AI về kiến thức lớp {currentAssignment.className}:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {aiReport.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <strong className="text-amber-900 block mb-1">Chủ đề hổng kiến thức:</strong>
                      <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                        {aiReport.weakTopics.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <strong className="text-emerald-900 block mb-1">Đề xuất bài giảng tiếp theo:</strong>
                      <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                        {aiReport.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Question By Question Analytics Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Bảng tỷ lệ trả lời đúng theo từng câu ({stats.questionAnalyses.length} câu)
            </h3>

            <div className="space-y-3">
              {stats.questionAnalyses.map((q) => {
                const acc = q.accuracyRate;
                const barColor =
                  acc >= 80 ? 'bg-emerald-500' : acc >= 60 ? 'bg-indigo-500' : acc >= 40 ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <div
                    key={q.questionId}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {q.order}
                        </span>
                        <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                          {q.questionText}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 text-xs">
                        <span className="font-bold text-slate-700">Đúng: {q.correctCount}/{q.totalResponses}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-white ${barColor}`}>
                          {acc}% đúng
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>

                    {/* Options Distribution Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-500">Phân bố lựa chọn:</span>
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const isCorrect = q.correctAnswer === opt;
                        const count = q.optionDistribution[opt] || 0;
                        return (
                          <span
                            key={opt}
                            className={`px-2 py-0.5 rounded-md font-mono ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {opt}: <strong>{count}</strong> {isCorrect && '✓'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Single Student's Submission Detail */}
      {selectedSubmissionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Lớp {selectedSubmissionDetail.className}
                </span>
                <h3 className="font-extrabold text-xl text-slate-900 mt-1">
                  Bài làm của {selectedSubmissionDetail.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Thời gian làm: {GradingService.formatDuration(selectedSubmissionDetail.timeSpentSeconds)} • Điểm:{' '}
                  <strong className="text-indigo-600 text-sm">{selectedSubmissionDetail.totalScore}/10</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedSubmissionDetail.answers.map((ans, idx) => {
                const question = currentAssignment.questions.find(q => q.id === ans.questionId);
                if (!question) return null;

                return (
                  <div
                    key={ans.questionId}
                    className={`p-4 rounded-2xl border ${
                      ans.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Câu {question.order}</span>
                      <span className={ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {ans.isCorrect ? '✓ Đúng (+ ' + ans.pointsEarned + 'đ)' : '✗ Sai (0đ)'}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-900 mb-2">
                      <MathDisplay text={question.question} />
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-4">
                      <span>
                        Học sinh chọn: <strong className="text-indigo-700">{ans.selectedAnswer || '(Bỏ trống)'}</strong>
                      </span>
                      <span>
                        Đáp án đúng: <strong className="text-emerald-700">{question.correctAnswer}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
