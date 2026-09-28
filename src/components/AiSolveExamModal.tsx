import React, { useState, useEffect } from 'react';
import { Question, Assignment, ExamTemplate } from '../types';
import { aiService } from '../services/aiService';
import { MathDisplay } from './MathDisplay';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Save, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';

interface AiSolveExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  grade?: string;
  topic?: string;
  questions: Question[];
  onApplyAnswers: (updatedQuestions: Question[]) => Promise<void> | void;
}

export const AiSolveExamModal: React.FC<AiSolveExamModalProps> = ({
  isOpen,
  onClose,
  examTitle,
  grade = '7',
  topic = 'Toán THCS',
  questions = [],
  onApplyAnswers
}) => {
  const [isSolving, setIsSolving] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [solvedMap, setSolvedMap] = useState<Record<string, { correctAnswer: string; explanation: string }>>({});
  const [userSelectedMap, setUserSelectedMap] = useState<Record<string, string>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'changed' | 'default_A'>('all');

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const initialMap: Record<string, string> = {};
      questions.forEach((q) => {
        initialMap[q.id] = (q.correctAnswer || 'A').toUpperCase();
      });
      setUserSelectedMap(initialMap);
      setSolvedMap({});
      setProgress({ current: 0, total: questions.length });
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  // Run AI solver
  const handleStartSolving = async () => {
    setIsSolving(true);
    setProgress({ current: 0, total: questions.length });

    try {
      const results = await aiService.solveExamQuestions({
        questions,
        grade,
        topic,
        onProgress: (current, total) => {
          setProgress({ current, total });
        }
      });

      const newSolvedMap: Record<string, { correctAnswer: string; explanation: string }> = {};
      const newUserMap = { ...userSelectedMap };

      results.forEach((res) => {
        newSolvedMap[res.questionId] = {
          correctAnswer: res.correctAnswer,
          explanation: res.explanation
        };
        // Auto select AI answer
        newUserMap[res.questionId] = res.correctAnswer;
      });

      setSolvedMap(newSolvedMap);
      setUserSelectedMap(newUserMap);
    } catch (err) {
      console.error('Lỗi khi AI giải đề:', err);
      alert('Có lỗi xảy ra trong quá trình giải đề. Vui lòng thử lại hoặc kiểm tra kết nối mạng/Gemini API Key.');
    } finally {
      setIsSolving(false);
    }
  };

  // Quick solve single question
  const handleSolveSingle = async (q: Question) => {
    try {
      const res = await aiService.solveSingleQuestion({
        question: q,
        grade,
        topic
      });
      setSolvedMap(prev => ({
        ...prev,
        [q.id]: {
          correctAnswer: res.correctAnswer,
          explanation: res.explanation
        }
      }));
      setUserSelectedMap(prev => ({
        ...prev,
        [q.id]: res.correctAnswer
      }));
    } catch (err) {
      alert('Không thể giải câu này lúc này.');
    }
  };

  // Quick paste parser (handles "1A 2B 3C" or "1:A, 2:B" or "ABCD...")
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;

    const text = quickPasteText.trim();
    const newUserMap = { ...userSelectedMap };

    // Format 1: "1A 2B 3C" or "1.A 2.B" or "Câu 1: A"
    const pairRegex = /(?:Câu\s*)?(\d+)[\s.:=_-]*([A-D])/gi;
    let match;
    let count = 0;
    while ((match = pairRegex.exec(text)) !== null) {
      const qNum = parseInt(match[1], 10);
      const ansLetter = match[2].toUpperCase();
      const targetQ = questions.find(q => q.order === qNum) || questions[qNum - 1];
      if (targetQ) {
        newUserMap[targetQ.id] = ansLetter;
        count++;
      }
    }

    // Format 2: Continuous string like "ABCDABCD..." if no numbered pairs found
    if (count === 0) {
      const cleanLetters = text.replace(/[^A-Da-d]/g, '').toUpperCase();
      if (cleanLetters.length > 0) {
        questions.forEach((q, idx) => {
          if (idx < cleanLetters.length) {
            newUserMap[q.id] = cleanLetters[idx];
            count++;
          }
        });
      }
    }

    if (count > 0) {
      setUserSelectedMap(newUserMap);
      setShowQuickPaste(false);
      setQuickPasteText('');
      alert(`Đã nhận diện và điền thành công đáp án cho ${count} câu hỏi!`);
    } else {
      alert('Không nhận diện được định dạng đáp án. Vui lòng nhập dạng: 1A 2B 3C... hoặc chuỗi ABCD...');
    }
  };

  // Select all AI answers
  const handleSelectAllAi = () => {
    const newUserMap = { ...userSelectedMap };
    Object.keys(solvedMap).forEach((qId) => {
      if (solvedMap[qId]) {
        newUserMap[qId] = solvedMap[qId].correctAnswer;
      }
    });
    setUserSelectedMap(newUserMap);
  };

  // Save changes
  const handleConfirmApply = async () => {
    setIsSaving(true);
    try {
      const updatedQuestions: Question[] = questions.map((q) => {
        const chosenAnswer = userSelectedMap[q.id] || q.correctAnswer || 'A';
        const aiInfo = solvedMap[q.id];
        return {
          ...q,
          correctAnswer: chosenAnswer,
          explanation: aiInfo?.explanation || q.explanation || ''
        };
      });

      await onApplyAnswers(updatedQuestions);
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu đáp án:', err);
      alert('Có lỗi khi lưu đáp án. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter questions for review
  const filteredQuestions = questions.filter((q) => {
    const currentVal = q.correctAnswer || 'A';
    const chosenVal = userSelectedMap[q.id] || currentVal;
    if (filterMode === 'changed') {
      return chosenVal !== currentVal;
    }
    if (filterMode === 'default_A') {
      return currentVal === 'A' && !q.explanation;
    }
    return true;
  });

  const solvedCount = Object.keys(solvedMap).length;
  const changedCount = questions.filter(q => (userSelectedMap[q.id] || q.correctAnswer) !== q.correctAnswer).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Trợ lý Khảo thí Toán THCS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                AI Tự Động Giải Đề & Tạo Bảng Đáp Án Chuẩn
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-1">
                Bài thi: <strong>{examTitle}</strong> • Khối {grade} • {questions.length} câu hỏi
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isSolving || isSaving}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Data Safety Notice */}
          <div className="mt-4 bg-white/10 border border-white/20 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>
              <strong>Bảo toàn dữ liệu 100%:</strong> Đề thi gốc và kết quả học sinh cũ không bị ảnh hưởng. Bảng đáp án chuẩn chỉ được cập nhật khi Thầy/Cô bấm <strong>"Xác nhận & Cập nhật"</strong>.
            </span>
          </div>
        </div>

        {/* TOOLBAR & CONTROLS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartSolving}
              disabled={isSolving}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang giải ({progress.current}/{progress.total})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{solvedCount > 0 ? 'AI Giải lại toàn bộ đề' : 'Bắt đầu AI Giải đề'}</span>
                </>
              )}
            </button>

            {solvedCount > 0 && (
              <button
                onClick={handleSelectAllAi}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Chọn tất cả đáp án AI
              </button>
            )}

            <button
              onClick={() => setShowQuickPaste(!showQuickPaste)}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl border border-indigo-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              {showQuickPaste ? 'Đóng ô dán đáp án' : 'Dán chuỗi đáp án có sẵn'}
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tất cả ({questions.length})
            </button>
            <button
              onClick={() => setFilterMode('changed')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'changed'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Đã đổi ({changedCount})
            </button>
          </div>
        </div>

        {/* QUICK PASTE PANEL */}
        {showQuickPaste && (
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 animate-in slide-in-from-top-2">
            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
              Dán bảng đáp án (Hỗ trợ: "1A 2B 3C..." hoặc "1.A 2.B" hoặc chuỗi "ABCDABCD...")
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
                placeholder="Ví dụ: 1A 2C 3B 4D 5A 6B..."
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                onClick={handleApplyQuickPaste}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}

        {/* MAIN QUESTION LIST TABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Không có câu hỏi nào trong danh mục này.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const currentOriginal = q.correctAnswer || 'A';
              const aiSol = solvedMap[q.id];
              const selectedAnswer = userSelectedMap[q.id] || currentOriginal;
              const isAiProvided = !!aiSol;
              const isDiff = selectedAnswer !== currentOriginal;
              const isExpanded = expandedExplanations[q.id];

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDiff
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Left: Question text & Options */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                          {q.order}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {q.type === 'multiple_choice' ? 'Trắc nghiệm (4 phương án)' : 'Câu hỏi tự luận/ngắn'}
                        </span>
                        {isDiff && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                            Đã đổi từ {currentOriginal} ➜ {selectedAnswer}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                        <MathDisplay math={q.question} />
                      </div>

                      {/* Options preview */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt) => {
                            const isChosen = selectedAnswer === opt.id;
                            const isAiChoice = aiSol?.correctAnswer === opt.id;

                            return (
                              <div
                                key={opt.id}
                                onClick={() => setUserSelectedMap(prev => ({ ...prev, [q.id]: opt.id }))}
                                className={`p-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all border ${
                                  isChosen
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isChosen
                                    ? 'bg-white text-indigo-600'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {opt.id}
                                </span>
                                <div className="truncate flex-1">
                                  <MathDisplay math={opt.text} />
                                </div>
                                {isAiChoice && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                                    isChosen ? 'bg-amber-300 text-slate-900' : 'bg-violet-100 text-violet-700'
                                  }`}>
                                    AI chọn
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Answer Selector & AI status */}
                    <div className="sm:w-56 shrink-0 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Đáp án áp dụng:
                        </span>
                        
                        {/* A B C D Radio selector buttons */}
                        <div className="grid grid-cols-4 gap-1">
                          {['A', 'B', 'C', 'D'].map((letter) => (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => setUserSelectedMap(prev => ({ ...prev, [q.id]: letter }))}
                              className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                selectedAnswer === letter
                                  ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Single Solve Button */}
                      <button
                        onClick={() => handleSolveSingle(q)}
                        className="w-full py-1.5 px-2 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 text-violet-700 dark:text-violet-300 text-[11px] font-bold rounded-lg border border-violet-200 dark:border-violet-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI giải riêng câu này</span>
                      </button>

                      {/* Toggle Explanation button */}
                      {(aiSol?.explanation || q.explanation) && (
                        <button
                          onClick={() => setExpandedExplanations(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="w-full text-center text-[10px] text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-0.5 font-semibold cursor-pointer"
                        >
                          <span>{isExpanded ? 'Thu gọn lời giải' : 'Xem lời giải AI'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Explanation Box */}
                  {isExpanded && (aiSol?.explanation || q.explanation) && (
                    <div className="mt-3 p-3 bg-violet-50/70 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-900 text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-in fade-in">
                      <div className="flex items-center space-x-1 font-bold text-violet-900 dark:text-violet-300">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Lời giải chi tiết chuẩn mực:</span>
                      </div>
                      <div className="leading-relaxed">
                        <MathDisplay math={aiSol?.explanation || q.explanation || ''} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Đã chọn đáp án cho <strong>{Object.keys(userSelectedMap).length}</strong>/{questions.length} câu • {changedCount > 0 ? `Đã thay đổi ${changedCount} đáp án` : 'Chưa có thay đổi'}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleConfirmApply}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Xác nhận & Cập nhật đáp án chuẩn</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
