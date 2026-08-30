import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Assignment, ClassRoom, GradeLevel, Question, QuestionOption } from '../../types';
import { StorageService } from '../../services/storageService';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import { FileUploadModal } from '../../components/FileUploadModal';
import { MathDisplay } from '../../components/MathDisplay';
import { isEssayQuestion, normalizeQuestion } from '../../utils/questionUtils';
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
  FileType,
  Loader2,
  FileBadge
} from 'lucide-react';

interface TeacherCreateAssignmentProps {
  classes: ClassRoom[];
  initialQuestions?: Question[];
  initialTitle?: string;
  initialGrade?: GradeLevel;
  initialMode?: 'text' | 'pdf'; // MỚI: Thêm prop nhận diện chế độ
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
  initialMode, // MỚI: Nhận prop từ TeacherLayout
  onSaveSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
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

  // --- TAB MODE SWITCHER ---
  // Khởi tạo tab dựa trên tham số truyền vào
  const [examMode, setExamMode] = useState<'text' | 'pdf'>(initialMode || 'text');

  // Lắng nghe nếu initialMode thay đổi thì ép chuyển tab ngay lập tức
  useEffect(() => {
    if (initialMode) {
      setExamMode(initialMode);
    }
  }, [initialMode]);

  // --- STATE DÀNH RIÊNG CHO CHẾ ĐỘ PDF ---
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [pdfNumQuestions, setPdfNumQuestions] = useState<number>(40);
  const [pdfAnswers, setPdfAnswers] = useState<Record<number, string>>({});

  // --- STATE CHẾ ĐỘ TEXT CŨ ---
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

  // --- LOGIC XỬ LÝ TEXT MODE ---
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
      points: 0.5,
      explanation: '',
      topicHint: topic
    };
    setQuestions([...questions, newQ]);
  };

  const handleAddEssayQuestion = () => {
    const nextOrder = questions.length + 1;
    const newQ: Question = {
      id: `q_essay_${Date.now()}_${nextOrder}`,
      order: nextOrder,
      question: '',
      type: 'essay',
      options: [],
      correctAnswer: '',
      points: 1.0,
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
    const targetQ = { ...updated[idx], ...updates };
    
    // Nếu đổi sang tự luận, làm sạch options
    if (updates.type === 'essay') {
      targetQ.options = [];
      targetQ.correctAnswer = '';
    } else if (updates.type === 'multiple_choice' && (!targetQ.options || targetQ.options.length === 0)) {
      targetQ.options = [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ];
      targetQ.correctAnswer = 'A';
    }

    updated[idx] = targetQ;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optId: string, text: string) => {
    const q = questions[qIdx];
    const newOptions = (q.options || []).map(opt => (opt.id === optId ? { ...opt, text } : opt));
    handleUpdateQuestion(qIdx, { options: newOptions });
  };

  const handleImportQuestionsFromFile = (importedQuestions: Question[]) => {
    if (!importedQuestions || importedQuestions.length === 0) return;
    const normalized = importedQuestions.map(q => normalizeQuestion(q));
    const isSingleDefault =
      questions.length === 1 &&
      (questions[0].question.includes('Tập hợp các số hữu tỉ') ||
       questions[0].question.includes('Phân số nào sau đây lớn hơn 1') ||
       !questions[0].question.trim());

    let finalQuestions: Question[] = [];
    if (isSingleDefault) {
      finalQuestions = normalized.map((q, i) => ({ ...q, order: i + 1 }));
    } else {
      const startingOrder = questions.length + 1;
      const reIndexed = normalized.map((q, i) => ({
        ...q,
        order: startingOrder + i
      }));
      finalQuestions = [...questions, ...reIndexed];
    }
    setQuestions(finalQuestions);
    setImportSuccessAlert(`Đã nhập thành công ${importedQuestions.length} câu hỏi từ tệp vào đề thi!`);
    setTimeout(() => setImportSuccessAlert(null), 4000);
  };

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

  // --- LOGIC XỬ LÝ PDF MODE ---
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfPreviewUrl(URL.createObjectURL(file));
    } else {
      alert('Vui lòng tải lên file định dạng PDF hợp lệ.');
    }
  };

  const handleSelectPdfAnswer = (qIndex: number, option: string) => {
    setPdfAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  // --- LƯU BÀI TẬP (GỘP CHUNG 2 CHẾ ĐỘ) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài tập.');
      return;
    }

    let finalQuestions: Question[] = [];
    let finalType: 'text' | 'pdf' = 'text';
    let finalPdfUrl: string | undefined = undefined;

    // VALIDATE VÀ BUILD DỮ LIỆU CHẾ ĐỘ TEXT
    if (examMode === 'text') {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) {
          alert(`Câu hỏi số ${i + 1} chưa nhập nội dung.`);
          return;
        }
        if (!isEssayQuestion(q) && q.type === 'multiple_choice') {
          const hasEmptyOpt = q.options.some(o => !o.text.trim());
          if (hasEmptyOpt) {
            alert(`Câu hỏi số ${i + 1} còn phương án lựa chọn bị trống.`);
            return;
          }
        }
      }
      finalQuestions = questions.map(q => normalizeQuestion(q));
      finalType = 'text';
    } 
    // VALIDATE VÀ BUILD DỮ LIỆU CHẾ ĐỘ PDF
    else {
      if (!pdfFile && !pdfPreviewUrl) {
        alert('Vui lòng tải lên file PDF đề thi.');
        return;
      }
      if (Object.keys(pdfAnswers).length === 0) {
        if (!window.confirm('Bạn chưa thiết lập bảng đáp án nào. Vẫn tiếp tục lưu?')) return;
      }
      
      finalType = 'pdf';
      
      // Chú ý: Ở hệ thống thực tế, bạn sẽ cần thay hàm tạo URL Local này 
      // bằng hàm upload file PDF lên Firebase Storage và lấy link tải về.
      finalPdfUrl = pdfPreviewUrl; 
      
      // Tự động sinh mảng questions "ảo" để hệ thống chấm điểm dựa vào bảng đáp án
      const pointPerQuestion = Number((10 / pdfNumQuestions).toFixed(2));
      finalQuestions = Array.from({ length: pdfNumQuestions }).map((_, i) => ({
        id: `q_pdf_${Date.now()}_${i + 1}`,
        order: i + 1,
        question: `Câu ${i + 1}`,
        type: 'multiple_choice',
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' }
        ],
        correctAnswer: pdfAnswers[i + 1] || 'A', // Lấy đáp án giáo viên đã tick
        points: pointPerQuestion,
        explanation: '',
        topicHint: topic
      }));
    }

    setIsSaving(true);

    try {
      const targetClass = classes.find(c => c.id === classId);
      const className = targetClass ? targetClass.name : 'Toàn khối';
      const assignmentCode = StorageService.generateAssignmentCode(grade, className);

      const newAssignment: any = {
        id: `asg_${Date.now()}`,
        title: title.trim(),
        grade,
        topic: topic.trim(),
        classId,
        className,
        questions: finalQuestions,
        durationMinutes,
        deadline,
        allowViewResult,
        assignmentCode,
        createdAt: new Date().toISOString(),
        isPublished: true,
        type: finalType, // Ép cờ type = pdf hoặc text
        pdfUrl: finalPdfUrl
      };

      // 1. Save to Cloud Firestore
      try {
        await FirestoreService.saveExam(newAssignment as Assignment, user || undefined);
      } catch (firestoreErr) {
        console.warn('Lưu Firestore thất bại, lưu dự phòng LocalStorage:', firestoreErr);
      }

      // 2. Save to Local Cache
      StorageService.saveAssignment(newAssignment as Assignment);

      setIsSaving(false);
      onSaveSuccess(newAssignment as Assignment);
    } catch (err) {
      console.error('Lỗi khi lưu đề thi:', err);
      setIsSaving(false);
      alert('Có lỗi xảy ra khi lưu đề thi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tạo bài tập & Đề kiểm tra mới</h1>
          <p className="text-sm text-slate-500">
            Soạn đề thi linh hoạt qua việc nhập từng câu hoặc tải file PDF.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG LƯU...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>LƯU BÀI TẬP</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
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

        {/* --- CÔNG TẮC CHUYỂN CHẾ ĐỘ TEXT / PDF --- */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setExamMode('text')}
            className={`flex items-center justify-center space-x-2 flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              examMode === 'text' 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Chế độ nhập câu hỏi</span>
          </button>
          <button
            type="button"
            onClick={() => setExamMode('pdf')}
            className={`flex items-center justify-center space-x-2 flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              examMode === 'pdf' 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileBadge className="w-4 h-4" />
            <span>Chế độ Tải đề PDF</span>
          </button>
        </div>

        {/* ==========================================
            HIỂN THỊ DỰA TRÊN CHẾ ĐỘ ĐƯỢC CHỌN 
            ========================================== */}
        
        {examMode === 'text' ? (
          /* SECTION 2: CHẾ ĐỘ TEXT TRUYỀN THỐNG */
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFileUploadModal(true)}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tải lên file (Excel / Word / PDF bóc tách)</span>
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
                  {/* Question Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-800">Câu hỏi số {qIdx + 1}</span>
                      
                      {/* Type selector */}
                      <select
                        value={isEssayQuestion(q) ? 'essay' : 'multiple_choice'}
                        onChange={(e) => handleUpdateQuestion(qIdx, { type: e.target.value as 'multiple_choice' | 'essay' })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          isEssayQuestion(q)
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        <option value="multiple_choice">🎯 Trắc nghiệm (A, B, C, D)</option>
                        <option value="essay">✍️ Tự luận (Học sinh giải/chụp ảnh)</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-3">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Nội dung câu hỏi *
                      </label>
                      <span className="text-[11px] text-indigo-600 font-semibold">
                        {'Hỗ trợ LaTeX: $...$ (inline) hoặc $$...$$ (block)'}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                      placeholder={isEssayQuestion(q) ? "Nhập đề bài tự luận Toán (ví dụ: a) Rút gọn biểu thức A; b) Tìm x để A > 0...)" : "Nhập đề bài Toán..."}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    {q.question.trim() && (
                      <div className="mt-2 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-sm">
                        <div className="text-[10px] uppercase font-black tracking-wider text-indigo-700 mb-1">
                          Xem trước hiển thị:
                        </div>
                        <MathDisplay text={q.question} />
                      </div>
                    )}
                  </div>

                  {/* Options for Multiple Choice */}
                  {!isEssayQuestion(q) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Các lựa chọn & Đáp án đúng <span className="text-indigo-600">(Chọn nút tròn để làm đáp án)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(q.options && q.options.length > 0 ? q.options : [
                          { id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }
                        ]).map((opt) => {
                          const isCorrect = q.correctAnswer === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center p-2 rounded-2xl border-2 transition-all ${
                                isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/70'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(qIdx, { correctAnswer: opt.id })}
                                className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center mr-2 shrink-0 transition-colors ${
                                  isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {opt.id}
                              </button>
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
                  )}

                  {/* Rubric / Criteria for Essay */}
                  {isEssayQuestion(q) && (
                    <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
                      <label className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Tiêu chí chấm điểm / Thang điểm chi tiết (Rubric để AI chấm):</span>
                      </label>
                      <textarea
                        rows={2}
                        value={q.rubric || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, { rubric: e.target.value })}
                        placeholder="Ví dụ: - Rút gọn đúng mẫu số: +0.5đ; - Biến đổi đúng tử: +0.5đ; - Kết luận: +0.5đ"
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Lời giải chi tiết / Hướng dẫn giải</label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                        placeholder="Hướng dẫn giải từng bước..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dạng bài / Kỹ năng</label>
                      <input
                        type="text"
                        value={q.topicHint || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, { topicHint: e.target.value })}
                        placeholder="Ví dụ: Hình học không gian, Rút gọn biểu thức..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 text-indigo-600 font-bold rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 shadow-xs transition-all active:scale-98 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ THÊM CÂU TRẮC NGHIỆM</span>
              </button>

              <button
                type="button"
                onClick={handleAddEssayQuestion}
                className="inline-flex items-center space-x-2 px-5 py-3 bg-white hover:bg-purple-50 text-purple-700 font-bold rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 shadow-xs transition-all active:scale-98 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ THÊM CÂU TỰ LUẬN</span>
              </button>
            </div>
          </div>
        ) : (
          /* SECTION 2: CHẾ ĐỘ PDF */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 mb-6">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                2
              </span>
              Tải Đề PDF & Bảng đáp án kỹ thuật số
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Khu vực Upload PDF */}
              <div className="flex flex-col h-[550px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">1. Tải lên file PDF gốc</h3>
                </div>
                
                {pdfPreviewUrl ? (
                  <div className="flex-1 border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-100 relative group">
                    <iframe src={`${pdfPreviewUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
                    <button 
                      type="button"
                      onClick={() => { setPdfFile(null); setPdfPreviewUrl(''); }}
                      className="absolute top-3 right-3 bg-white/90 p-2 rounded-lg text-rose-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                      title="Xóa và chọn file khác"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 text-indigo-500">
                      <FileBadge className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 mb-1">Click để tải lên file Đề thi</span>
                    <span className="text-xs text-slate-500">Chỉ hỗ trợ định dạng .PDF</span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handlePdfUpload}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Khu vực Grid Đáp án */}
              <div className="flex flex-col h-[550px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">2. Thiết lập bảng đáp án</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Số câu:</label>
                    <input 
                      type="number" 
                      value={pdfNumQuestions} 
                      onChange={(e) => setPdfNumQuestions(Number(e.target.value))}
                      className="w-16 border-2 border-slate-200 rounded-lg p-1.5 text-center text-sm font-bold focus:border-indigo-500 focus:outline-none" 
                      min={1} max={100}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 border-2 border-slate-200 rounded-2xl bg-slate-50 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: pdfNumQuestions }).map((_, i) => {
                      const qNum = i + 1;
                      return (
                        <div key={qNum} className="flex flex-col bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                          <span className="text-[11px] font-black text-slate-400 mb-1.5">Câu {qNum}</span>
                          <div className="flex justify-between gap-1">
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectPdfAnswer(qNum, opt)}
                                className={`flex-1 aspect-square max-h-8 rounded-lg text-xs font-black transition-all ${
                                  pdfAnswers[qNum] === opt 
                                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 text-right mt-3">
                  Đã cấu hình: <strong className="text-indigo-600">{Object.keys(pdfAnswers).length}</strong> / {pdfNumQuestions} câu
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600">
            {examMode === 'text' ? (
              <>
                Tổng cộng: <strong className="text-indigo-600">{questions.length}</strong> câu hỏi • Tổng điểm:{' '}
                <strong className="text-slate-900">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                </strong>
              </>
            ) : (
              <>
                Đề PDF: <strong className="text-indigo-600">{pdfNumQuestions}</strong> câu • Điểm chia đều:{' '}
                <strong className="text-slate-900">10 điểm</strong>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG LƯU BÀI TẬP...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>LƯU & TẠO MÃ BÀI TẬP</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* --- CÁC MODAL HỖ TRỢ CHẾ ĐỘ TEXT --- */}
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

      {/* Modal: File Upload (Excel, Word, PDF bóc tách) */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onImportQuestions={handleImportQuestionsFromFile}
      />
    </div>
  );
};
