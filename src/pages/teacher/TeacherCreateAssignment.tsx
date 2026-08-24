import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Assignment, ClassRoom, GradeLevel, Question, QuestionOption } from '../../types';
import { StorageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { FileUploadModal } from '../../components/FileUploadModal';
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  FileText, 
  X,
  AlertCircle,
  UploadCloud,
  FileSpreadsheet,
  FileType
} from 'lucide-react';

interface TeacherCreateAssignmentProps {
  classes: ClassRoom[];
  initialQuestions?: Question[];
  initialTitle?: string;
  initialGrade?: GradeLevel;
  onSaveSuccess: (savedAssignment: Assignment) => void;
  onCancel: () => void;
}

const DEFAULT_OPTIONS: QuestionOption[] = [
  { id: 'A', text: '' },
  { id: 'B', text: '' },
  { id: 'C', text: '' },
  { id: 'D', text: '' }
];

export const TeacherCreateAssignment: React.FC<TeacherCreateAssignmentProps> = ({
  classes,
  initialQuestions,
  initialTitle,
  initialGrade,
  onSaveSuccess,
  onCancel
}) => {
  const [searchParams] = useSearchParams();
  const paramGrade = searchParams.get('grade');
  const validParamGrade = (paramGrade === '6' || paramGrade === '7' || paramGrade === '8' || paramGrade === '9') ? (paramGrade as GradeLevel) : undefined;

  const [title, setTitle] = useState(initialTitle || '');
  const [grade, setGrade] = useState<GradeLevel>(validParamGrade || initialGrade || '7');
  const [topic, setTopic] = useState('Đại số & Hình học THCS');
  const [classId, setClassId] = useState<string>(classes[0]?.id || 'all');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [allowViewResult, setAllowViewResult] = useState<boolean>(true);

  // Question list state
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions;
    }
    return [
      {
        id: `q_${Date.now()}_1`,
        order: 1,
        question: 'Tập hợp các số hữu tỉ được kí hiệu là gì?',
        type: 'multiple_choice',
        options: [
          { id: 'A', text: 'N' },
          { id: 'B', text: 'Z' },
          { id: 'C', text: 'R' },
          { id: 'D', text: 'Q' }
        ],
        correctAnswer: 'D',
        points: 0.5,
        explanation: 'Kí hiệu tập hợp số hữu tỉ là Q.',
        topicHint: 'Khái niệm số hữu tỉ'
      }
    ];
  });

  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [showRawImportModal, setShowRawImportModal] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGenCount, setAiGenCount] = useState(5);
  const [importSuccessAlert, setImportSuccessAlert] = useState<string | null>(null);

  const handleAddQuestion = () => {
    const nextOrder = questions.length + 1;
    const newQ: Question = {
      id: `q_${Date.now()}_${nextOrder}`,
      order: nextOrder,
      question: '',
      type: 'multiple_choice',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ],
      correctAnswer: 'A',
      points: 1,
      explanation: '',
      topicHint: topic
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Bài tập cần ít nhất 1 câu hỏi.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(updated);
  };

  const handleUpdateQuestion = (idx: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optId: string, text: string) => {
    const q = questions[qIdx];
    const newOptions = q.options.map(opt => (opt.id === optId ? { ...opt, text } : opt));
    handleUpdateQuestion(qIdx, { options: newOptions });
  };

  // Handle File Upload Import
  const handleImportQuestionsFromFile = (importedQuestions: Question[]) => {
    if (!importedQuestions || importedQuestions.length === 0) return;

    // If teacher currently only has 1 default placeholder question, replace it
    const isSingleDefault =
      questions.length === 1 &&
      (questions[0].question.includes('Tập hợp các số hữu tỉ') ||
       questions[0].question.includes('Phân số nào sau đây lớn hơn 1') ||
       !questions[0].question.trim());

    let finalQuestions: Question[] = [];
    if (isSingleDefault) {
      finalQuestions = importedQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    } else {
      const startingOrder = questions.length + 1;
      const reIndexed = importedQuestions.map((q, i) => ({
        ...q,
        order: startingOrder + i
      }));
      finalQuestions = [...questions, ...reIndexed];
    }

    setQuestions(finalQuestions);
    setImportSuccessAlert(`Đã nhập thành công ${importedQuestions.length} câu hỏi từ tệp vào đề thi!`);
    setTimeout(() => setImportSuccessAlert(null), 4000);
  };

  // AI Generator Hook
  const handleAiGenerateQuestions = async () => {
    setIsAiGenerating(true);
    try {
      const generated = await aiService.generateQuestions({
        grade,
        topic,
        count: aiGenCount
      });
      const reIndexed = generated.map((g, i) => ({
        ...g,
        id: `q_ai_${Date.now()}_${i}`,
        order: questions.length + i + 1
      }));
      setQuestions([...questions, ...reIndexed]);
      setShowAiGenModal(false);
    } catch {
      alert('Lỗi tạo câu hỏi.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Raw text parser hook
  const handleImportFromText = async () => {
    if (!rawTextImport.trim()) return;
    const parsed = await aiService.parseQuestionsFromText(rawTextImport);
    if (parsed.length > 0) {
      const reIndexed = parsed.map((p, i) => ({
        ...p,
        order: questions.length + i + 1
      }));
      setQuestions([...questions, ...reIndexed]);
      setShowRawImportModal(false);
      setRawTextImport('');
    } else {
      alert('Không nhận diện được định dạng câu hỏi.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài tập.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Câu hỏi số ${i + 1} chưa nhập nội dung.`);
        return;
      }
      const hasEmptyOpt = q.options.some(o => !o.text.trim());
      if (hasEmptyOpt) {
        alert(`Câu hỏi số ${i + 1} còn phương án lựa chọn bị trống.`);
        return;
      }
    }

    const targetClass = classes.find(c => c.id === classId);
    const className = targetClass ? targetClass.name : 'Toàn khối';
    const assignmentCode = StorageService.generateAssignmentCode(grade, className);

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}`,
      title: title.trim(),
      grade,
      topic: topic.trim(),
      classId,
      className,
      questions,
      durationMinutes,
      deadline,
      allowViewResult,
      assignmentCode,
      createdAt: new Date().toISOString(),
      isPublished: true
    };

    StorageService.saveAssignment(newAssignment);
    onSaveSuccess(newAssignment);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tạo bài tập & Đề kiểm tra mới</h1>
          <p className="text-sm text-slate-500">
            Soạn câu hỏi trắc nghiệm Toán THCS, thiết lập đáp án đúng và thời gian làm bài.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>LƯU BÀI TẬP</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: General Assignment Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
              1
            </span>
            Thông tin chung bài tập
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên bài tập / Đề thi *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ôn tập chương 1 – Phân số và số thập phân"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lớp *</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value="6">Toán Lớp 6</option>
                <option value="7">Toán Lớp 7</option>
                <option value="8">Toán Lớp 8</option>
                <option value="9">Toán Lớp 9</option>
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề / Dạng bài</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Phân số, Hình học, Số nguyên..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            {/* Target Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giao cho lớp</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value="all">Tất cả các lớp (Toàn khối)</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    Lớp {cls.name} ({cls.students?.length || 0} học sinh)
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min={0}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                placeholder="0 = Không giới hạn"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Nhập 0 nếu không tính giờ</span>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hạn chót nộp bài</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            {/* Allow view result */}
            <div className="sm:col-span-2 flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="allowViewResult"
                checked={allowViewResult}
                onChange={(e) => setAllowViewResult(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="allowViewResult" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Cho phép học sinh xem điểm và lời giải chi tiết ngay sau khi nộp
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Question Builder & Tools */}
        <div className="space-y-4">
          {importSuccessAlert && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{importSuccessAlert}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                2
              </span>
              Ngân hàng câu hỏi ({questions.length} câu)
            </h2>

            {/* Quick Generator & Import Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFileUploadModal(true)}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tải lên file (Excel / Word / PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiGenModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Sinh câu hỏi gợi ý</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRawImportModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dán đề text</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-800">Câu hỏi số {qIdx + 1}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Points */}
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500 font-medium">Điểm:</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="10"
                        value={q.points}
                        onChange={(e) => handleUpdateQuestion(qIdx, { points: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                      />
                    </div>

                    {/* Delete Question */}
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung câu hỏi *
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                    placeholder="Nhập đề bài Toán. Ví dụ: Rút gọn phân số 18/24 về phân số tối giản..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* 4 Options Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Các lựa chọn & Đáp án đúng <span className="text-indigo-600">(Chọn nút tròn để đánh dấu đáp án đúng)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt) => {
                      const isCorrect = q.correctAnswer === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center p-2 rounded-2xl border-2 transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/50'
                              : 'border-slate-200 bg-slate-50/70'
                          }`}
                        >
                          {/* Radio choice */}
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { correctAnswer: opt.id })}
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center mr-2 shrink-0 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                            }`}
                            title="Chọn làm đáp án đúng"
                          >
                            {opt.id}
                          </button>

                          {/* Option Input */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleUpdateOption(qIdx, opt.id, e.target.value)}
                            placeholder={`Phương án ${opt.id}...`}
                            className="flex-1 bg-white px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation & Topic hint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Lời giải chi tiết (Hiện khi học sinh xem lại)
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                      placeholder="Giải thích từng bước giải bài..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Dạng bài / Kỹ năng
                    </label>
                    <input
                      type="text"
                      value={q.topicHint || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { topicHint: e.target.value })}
                      placeholder="Ví dụ: Rút gọn phân số, Cộng trừ cùng mẫu..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white hover:bg-slate-50 text-indigo-600 font-bold rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 shadow-xs transition-all active:scale-98"
            >
              <Plus className="w-5 h-5" />
              <span>+ THÊM CÂU HỎI TRẮC NGHIỆM</span>
            </button>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600">
            Tổng cộng: <strong className="text-indigo-600">{questions.length}</strong> câu hỏi • Tổng điểm:{' '}
            <strong className="text-slate-900">
              {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
            </strong>
          </div>
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>LƯU & TẠO MÃ BÀI TẬP</span>
          </button>
        </div>
      </form>

      {/* Modal: AI Question Generator */}
      {showAiGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-lg text-slate-900">Tạo câu hỏi gợi ý tự động</h3>
              </div>
              <button onClick={() => setShowAiGenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-xs text-slate-600">
                Hệ thống sẽ sinh bộ câu hỏi trắc nghiệm Toán THCS theo đúng Khối <strong>{grade}</strong> và chủ đề <strong>{topic}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng câu cần sinh</label>
                <select
                  value={aiGenCount}
                  onChange={(e) => setAiGenCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value={3}>3 câu hỏi</option>
                  <option value={5}>5 câu hỏi</option>
                  <option value={10}>10 câu hỏi</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50 text-purple-900 text-xs rounded-xl flex items-start space-x-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
                <span>
                  Module này được thiết kế theo cấu trúc mở sẵn sàng tích hợp trực tiếp Gemini API khi Thầy/Cô cần mở rộng về sau.
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowAiGenModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAiGenerateQuestions}
                disabled={isAiGenerating}
                className="px-5 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl shadow-sm"
              >
                {isAiGenerating ? 'Đang tạo câu...' : 'Thêm vào đề thi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Raw Text Import */}
      {showRawImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-lg text-slate-900">Dán câu hỏi từ Word / File Text</h3>
              <button onClick={() => setShowRawImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={rawTextImport}
                onChange={(e) => setRawTextImport(e.target.value)}
                placeholder={`Câu 1: Phân số nào bằng 3/4?\nA. 6/8\nB. 9/15\nC. 6/10\nD. 12/20\n\nCâu 2: Rút gọn 18/24...\nA. 3/4\nB. 2/3\n...`}
                rows={9}
                className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowRawImportModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportFromText}
                disabled={!rawTextImport.trim()}
                className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm"
              >
                Tách và nhập câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: File Upload (Excel, Word, PDF) with Category Filter (Trắc nghiệm / Tự luận) */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onImportQuestions={handleImportQuestionsFromFile}
      />
    </div>
  );
};
