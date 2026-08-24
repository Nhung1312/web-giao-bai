import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Assignment, GradeLevel, ClassRoom } from '../types';
import { ALL_GRADE_METAS } from '../data';
import { PrintExamModal } from '../components/PrintExamModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { 
  BookOpen, 
  Search, 
  Filter, 
  X, 
  ArrowLeft, 
  Play, 
  Share2, 
  Printer, 
  Clock, 
  HelpCircle, 
  ChevronRight, 
  Plus, 
  Sparkles,
  Calculator,
  Shapes,
  PieChart,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface GradeAssignmentsPageProps {
  assignments: Assignment[];
  classes: ClassRoom[];
  onRefresh: () => void;
  onTestAssignment?: (assignment: Assignment) => void;
}

export const GradeAssignmentsPage: React.FC<GradeAssignmentsPageProps> = ({
  assignments,
  classes,
  onRefresh,
  onTestAssignment
}) => {
  const { gradeId } = useParams<{ gradeId: string }>();
  const navigate = useNavigate();

  // Validate gradeId
  const validGrade = (gradeId === '6' || gradeId === '7' || gradeId === '8' || gradeId === '9') ? (gradeId as GradeLevel) : '6';
  const gradeMeta = ALL_GRADE_METAS[validGrade] || ALL_GRADE_METAS['6'];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopicCategory, setFilterTopicCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'questions' | 'duration'>('newest');

  // Modals state
  const [printingAssignment, setPrintingAssignment] = useState<Assignment | null>(null);
  const [sharingAssignment, setSharingAssignment] = useState<Assignment | null>(null);

  // Filter assignments for this specific grade
  const gradeAssignments = useMemo(() => {
    return assignments.filter(a => a.grade === validGrade);
  }, [assignments, validGrade]);

  // Topic classification helper
  const matchesTopicCategory = (topic: string, category: string): boolean => {
    if (category === 'all') return true;
    const t = (topic || '').toLowerCase();
    if (category === 'algebra') {
      return t.includes('đại số') || t.includes('số học') || t.includes('phân số') || 
             t.includes('số nguyên') || t.includes('số hữu tỉ') || t.includes('số thực') || 
             t.includes('phương trình') || t.includes('hằng đẳng thức') || t.includes('đa thức') ||
             t.includes('căn') || t.includes('tính toán');
    }
    if (category === 'geometry') {
      return t.includes('hình học') || t.includes('hình') || t.includes('đoạn thẳng') || 
             t.includes('góc') || t.includes('tam giác') || t.includes('tứ giác') || 
             t.includes('đường tròn') || t.includes('pythagore') || t.includes('hệ thức lượng');
    }
    if (category === 'statistics') {
      return t.includes('thống kê') || t.includes('xác suất') || t.includes('biểu đồ');
    }
    return t === category.toLowerCase();
  };

  const filteredAssignments = useMemo(() => {
    return gradeAssignments
      .filter(a => {
        if (filterTopicCategory !== 'all' && !matchesTopicCategory(a.topic, filterTopicCategory)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = a.title.toLowerCase().includes(q);
          const matchTopic = a.topic.toLowerCase().includes(q);
          const matchCode = a.assignmentCode.toLowerCase().includes(q);
          if (!matchTitle && !matchTopic && !matchCode) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi');
        if (sortBy === 'questions') return b.questions.length - a.questions.length;
        if (sortBy === 'duration') return (b.durationMinutes || 0) - (a.durationMinutes || 0);
        return 0;
      });
  }, [gradeAssignments, filterTopicCategory, searchQuery, sortBy]);

  const handleStartExam = (asg: Assignment) => {
    navigate(`/join?code=${asg.assignmentCode}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <Link 
          to="/"
          className="inline-flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </Link>

        {/* Quick Switch to other grades */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {(['6', '7', '8', '9'] as GradeLevel[]).map((g) => (
            <button
              key={g}
              onClick={() => navigate(`/grade/${g}`)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                validGrade === g
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lớp {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grade Hero Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${gradeMeta.colorScheme.border} ${gradeMeta.colorScheme.lightBg} shadow-xs relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${gradeMeta.colorScheme.badgeBg} ${gradeMeta.colorScheme.badgeText}`}>
                {gradeMeta.badge}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Chương trình Toán THCS 2018
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {gradeMeta.title} – {gradeMeta.subtitle}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {gradeMeta.description}
            </p>

            {/* Quick Topic Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chủ đề chính:</span>
              {gradeMeta.sampleTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(`/teacher/create?grade=${validGrade}`)}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-xs text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm đề Lớp {validGrade}</span>
            </button>
            <button
              onClick={() => navigate('/join')}
              className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 ${gradeMeta.colorScheme.btnBg} font-bold rounded-xl shadow-md text-xs sm:text-sm transition-all cursor-pointer active:scale-95`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Vào phòng thi tự do</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative sm:col-span-6 lg:col-span-6">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm bài kiểm tra Lớp ${validGrade}, mã bài, chủ đề...`}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Topic Filter */}
          <div className="sm:col-span-4 lg:col-span-4">
            <select
              value={filterTopicCategory}
              onChange={(e) => setFilterTopicCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">📐 Tất cả phân môn Lớp {validGrade}</option>
              <option value="algebra">🔢 Đại số & Số học</option>
              <option value="geometry">📐 Hình học & Đo lường</option>
              <option value="statistics">📊 Thống kê & Xác suất</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2 lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="title">Tên A-Z</option>
              <option value="questions">Số câu</option>
              <option value="duration">Thời gian</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Lọc theo phân môn:</span>
            
            <button
              onClick={() => setFilterTopicCategory(filterTopicCategory === 'algebra' ? 'all' : 'algebra')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterTopicCategory === 'algebra'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calculator className="w-3 h-3" />
              <span>Đại số ({gradeAssignments.filter(a => matchesTopicCategory(a.topic, 'algebra')).length})</span>
            </button>

            <button
              onClick={() => setFilterTopicCategory(filterTopicCategory === 'geometry' ? 'all' : 'geometry')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterTopicCategory === 'geometry'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Shapes className="w-3 h-3" />
              <span>Hình học ({gradeAssignments.filter(a => matchesTopicCategory(a.topic, 'geometry')).length})</span>
            </button>
          </div>

          <div className="text-slate-500 dark:text-slate-400">
            Hiển thị <strong className="text-slate-800 dark:text-slate-100">{filteredAssignments.length}</strong> bài tập Lớp {validGrade}
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Chưa có bài tập nào phù hợp cho Lớp {validGrade}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Thầy cô có thể bấm "+ Thêm đề Lớp {validGrade}" để soạn câu hỏi hoặc tải tệp Word/Excel lên.
          </p>
          <button
            onClick={() => navigate(`/teacher/create?grade=${validGrade}`)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            + Soạn đề kiểm tra Lớp {validGrade}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((asg) => {
            const isGeometry = matchesTopicCategory(asg.topic, 'geometry');

            return (
              <div
                key={asg.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${gradeMeta.colorScheme.badgeBg} ${gradeMeta.colorScheme.badgeText}`}>
                        Lớp {asg.grade}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isGeometry 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                      }`}>
                        {isGeometry ? '📐 Hình học' : '🔢 Đại số'}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                      {asg.assignmentCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mt-2">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {asg.topic}
                  </p>

                  {/* Details stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                      <span><strong>{asg.questions.length}</strong> câu trắc nghiệm</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{asg.durationMinutes > 0 ? `${asg.durationMinutes} phút` : 'Tự do'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={() => handleStartExam(asg)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <span>LÀM BÀI NGAY</span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>

                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    <button
                      onClick={() => setPrintingAssignment(asg)}
                      className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      title="In đề thi / Xuất PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>In PDF</span>
                    </button>

                    <button
                      onClick={() => setSharingAssignment(asg)}
                      className="py-1.5 px-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      title="Lấy mã QR chia sẻ"
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lấy QR</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onTestAssignment) {
                          onTestAssignment(asg);
                        } else {
                          navigate(`/join?code=${asg.assignmentCode}`);
                        }
                      }}
                      className="py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      title="Làm thử chế độ giáo viên"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Làm thử</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Exam Modal */}
      {printingAssignment && (
        <PrintExamModal
          isOpen={!!printingAssignment}
          onClose={() => setPrintingAssignment(null)}
          assignment={printingAssignment}
        />
      )}

      {/* Share QR Modal */}
      {sharingAssignment && (
        <QRCodeModal
          isOpen={!!sharingAssignment}
          onClose={() => setSharingAssignment(null)}
          assignment={sharingAssignment}
        />
      )}
    </div>
  );
};
