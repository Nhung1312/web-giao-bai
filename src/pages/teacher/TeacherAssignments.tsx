import React, { useState, useMemo } from 'react';
import { Assignment, ClassRoom, Question, Submission } from '../../types';
import { StorageService } from '../../services/storageService';
import { FileUploadModal } from '../../components/FileUploadModal';
import { PrintExamModal } from '../../components/PrintExamModal';
import { 
  BookOpen, 
  Plus, 
  Share2, 
  BarChart3, 
  Trash2, 
  Clock, 
  Play, 
  Search, 
  CheckCircle2,
  Copy,
  Check,
  UploadCloud,
  Printer,
  Filter,
  X,
  ArrowUpDown,
  Layers,
  Shapes,
  Calculator,
  PieChart,
  Tag
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
  const [filterTopicCategory, setFilterTopicCategory] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'questions' | 'duration'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [printingAssignment, setPrintingAssignment] = useState<Assignment | null>(null);

  const handleImportQuestions = (questions: Question[]) => {
    onNavigate('create', {
      initialQuestions: questions,
      initialTitle: 'Đề kiểm tra nhập từ tệp'
    });
  };

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

  // Extract distinct topics dynamically
  const uniqueTopics = useMemo(() => {
    const topicsSet = new Set<string>();
    assignments.forEach(a => {
      if (a.topic && a.topic.trim()) {
        topicsSet.add(a.topic.trim());
      }
    });
    return Array.from(topicsSet);
  }, [assignments]);

  // Topic classification helper
  const matchesTopicCategory = (topic: string, category: string): boolean => {
    if (category === 'all') return true;
    const t = (topic || '').toLowerCase();
    if (category === 'algebra') {
      // Đại số & Số học
      return t.includes('đại số') || t.includes('số học') || t.includes('phân số') || 
             t.includes('số nguyên') || t.includes('số hữu tỉ') || t.includes('số thực') || 
             t.includes('phương trình') || t.includes('hệ phương trình') || t.includes('bất đẳng thức') ||
             t.includes('hằng đẳng thức') || t.includes('đa thức') || t.includes('đơn thức') || t.includes('tính toán');
    }
    if (category === 'geometry') {
      // Hình học & Đo lường
      return t.includes('hình học') || t.includes('hình') || t.includes('đoạn thẳng') || 
             t.includes('góc') || t.includes('tam giác') || t.includes('tứ giác') || 
             t.includes('đường tròn') || t.includes('pythagore') || t.includes('diện tích') || t.includes('chu vi') || t.includes('không gian');
    }
    if (category === 'statistics') {
      // Thống kê & Xác suất
      return t.includes('thống kê') || t.includes('xác suất') || t.includes('biểu đồ') || t.includes('số liệu') || t.includes('tần số');
    }
    // Specific custom topic match
    return t === category.toLowerCase();
  };

  const hasActiveFilters = filterGrade !== 'all' || filterTopicCategory !== 'all' || filterClass !== 'all' || searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setFilterGrade('all');
    setFilterTopicCategory('all');
    setFilterClass('all');
    setSearchQuery('');
  };

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(a => {
        if (filterGrade !== 'all' && a.grade !== filterGrade) return false;
        if (filterClass !== 'all' && a.classId !== filterClass) return false;
        if (filterTopicCategory !== 'all' && !matchesTopicCategory(a.topic, filterTopicCategory)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = a.title.toLowerCase().includes(q);
          const matchTopic = a.topic.toLowerCase().includes(q);
          const matchCode = a.assignmentCode.toLowerCase().includes(q);
          const matchGrade = `khối ${a.grade}`.includes(q) || `lớp ${a.grade}`.includes(q);
          if (!matchTitle && !matchTopic && !matchCode && !matchGrade) return false;
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
  }, [assignments, filterGrade, filterClass, filterTopicCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Quản lý bài tập & Đề thi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tạo mã bài tập, quản lý ngân hàng câu hỏi, lọc theo lớp học và chủ đề Đại số / Hình học.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFileUploadModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-xs text-sm transition-all active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Tải lên file (Excel/Word/PDF)</span>
          </button>
          <button
            onClick={() => onNavigate('create')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo bài mới</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bài, chủ đề, mã bài..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grade Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">🎓 Tất cả các lớp</option>
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
            </select>
          </div>

          {/* Topic / Subject Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterTopicCategory}
              onChange={(e) => setFilterTopicCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">📐 Tất cả chủ đề Toán</option>
              <optgroup label="Phân môn chính">
                <option value="algebra">🔢 Đại số & Số học</option>
                <option value="geometry">📐 Hình học & Đo lường</option>
                <option value="statistics">📊 Thống kê & Xác suất</option>
              </optgroup>
              {uniqueTopics.length > 0 && (
                <optgroup label="Chủ đề cụ thể đã tạo">
                  {uniqueTopics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Class Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">🏫 Tất cả lớp học</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>Lớp {cls.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-1">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              title="Sắp xếp danh sách"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="title">Tên A-Z</option>
              <option value="questions">Nhiều câu</option>
              <option value="duration">Thời gian</option>
            </select>
          </div>
        </div>

        {/* Quick Topic Pills & Active Filters State */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Lọc nhanh:</span>
            
            {/* Quick buttons */}
            <button
              onClick={() => setFilterTopicCategory(filterTopicCategory === 'algebra' ? 'all' : 'algebra')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterTopicCategory === 'algebra'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calculator className="w-3 h-3" />
              <span>Đại số</span>
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
              <span>Hình học</span>
            </button>

            <button
              onClick={() => setFilterTopicCategory(filterTopicCategory === 'statistics' ? 'all' : 'statistics')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterTopicCategory === 'statistics'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <PieChart className="w-3 h-3" />
              <span>Xác suất & Thống kê</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
            <span>
              Hiển thị <strong className="text-slate-800 dark:text-slate-100">{filteredAssignments.length}</strong> / {assignments.length} bài
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assignments Cards List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Không tìm thấy bài tập nào phù hợp</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters 
              ? 'Thử thay đổi từ khóa tìm kiếm, khối lớp hoặc chủ đề để hiển thị kết quả.'
              : 'Bấm "+ Tạo bài mới" để soạn bộ câu hỏi Toán THCS và giao cho học sinh.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((asg) => {
            const asgSubs = submissions.filter(s => s.assignmentId === asg.id);
            const targetClass = classes.find(c => c.id === asg.classId);
            const classStudentCount = targetClass ? (targetClass.students?.length || 0) : 10;

            // Determine topic badge color
            const isGeometry = matchesTopicCategory(asg.topic, 'geometry');
            const isStatistics = matchesTopicCategory(asg.topic, 'statistics');

            return (
              <div
                key={asg.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Lớp {asg.grade}
                      </span>
                      <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {asg.className ? `Lớp ${asg.className}` : 'Tất cả học sinh'}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isGeometry 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : isStatistics
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}>
                        {isGeometry ? '📐 Hình học' : isStatistics ? '📊 Thống kê' : '🔢 Đại số'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(asg.id, asg.title)}
                      className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 mt-1">{asg.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{asg.topic}</p>

                  {/* Code chip */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Mã bài tập</span>
                      <span className="font-mono font-extrabold text-indigo-900 dark:text-indigo-300 text-base">
                        {asg.assignmentCode}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(asg.assignmentCode)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-600 border border-indigo-200 dark:border-slate-600 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedCode === asg.assignmentCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400">Đã chép</span>
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
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asg.questions.length} câu</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asg.durationMinutes > 0 ? `${asg.durationMinutes} phút` : 'Tự do'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {asgSubs.length}/{classStudentCount} đã nộp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-4 gap-1.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setPrintingAssignment(asg)}
                    className="flex items-center justify-center space-x-1 py-2 px-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                    title="In đề thi / Xuất PDF chuẩn Bộ GD&ĐT"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In đề</span>
                  </button>

                  <button
                    onClick={() => onOpenShare(asg)}
                    className="flex items-center justify-center space-x-1 py-2 px-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold rounded-xl transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                    title="Lấy mã QR và liên kết"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Lấy QR</span>
                  </button>

                  <button
                    onClick={() => onTestAssignment(asg)}
                    className="flex items-center justify-center space-x-1 py-2 px-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                    title="Làm thử"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Làm thử</span>
                  </button>

                  <button
                    onClick={() => onNavigate('results', { assignmentId: asg.id })}
                    className="flex items-center justify-center space-x-1 py-2 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                    title="Xem bảng xếp hạng và phân tích kết quả"
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

      {/* File Upload Modal for Teacher */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onImportQuestions={handleImportQuestions}
      />

      {/* Print Exam Modal */}
      {printingAssignment && (
        <PrintExamModal
          isOpen={!!printingAssignment}
          onClose={() => setPrintingAssignment(null)}
          assignment={printingAssignment}
        />
      )}
    </div>
  );
};
