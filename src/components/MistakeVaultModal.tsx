import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Search, 
  Filter, 
  Award, 
  Trash2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Check,
  Play,
  Flame,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMistakeVaultStore } from '../store/useMistakeVaultStore';
import { MistakeRecord, GradeLevel } from '../types';
import { MathDisplay } from './MathDisplay';
import { aiService } from '../services/aiService';
import { soundEffects } from '../utils/soundEffects';

interface MistakeVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MistakeVaultModal: React.FC<MistakeVaultModalProps> = ({ isOpen, onClose }) => {
  const {
    mistakes,
    recordPracticeAttempt,
    markAsMastered,
    saveAiHint,
    removeMistake,
    clearMasteredMistakes,
    clearAllMistakes
  } = useMistakeVaultStore();

  const [selectedGrade, setSelectedGrade] = useState<'all' | GradeLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'unmastered' | 'all' | 'mastered'>('unmastered');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive re-test states per mistake
  const [selectedOptionByMistake, setSelectedOptionByMistake] = useState<Record<string, string>>({});
  const [testResultByMistake, setTestResultByMistake] = useState<Record<string, { tested: boolean; isCorrect: boolean }>>({});
  const [loadingAiHint, setLoadingAiHint] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  // Mini Quiz Mode
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [quizIndex, setQuizIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Filter mistakes
  const filteredMistakes = mistakes.filter((m) => {
    if (selectedGrade !== 'all' && m.grade !== selectedGrade) return false;
    if (statusFilter === 'unmastered' && m.mastered) return false;
    if (statusFilter === 'mastered' && !m.mastered) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (m.question.question || '').toLowerCase();
      const matchTopic = (m.assignmentTitle || '').toLowerCase() + (m.question.topicHint || '').toLowerCase();
      if (!matchText.includes(q) && !matchTopic.includes(q)) return false;
    }
    return true;
  });

  const activeCount = mistakes.filter((m) => !m.mastered).length;
  const masteredCount = mistakes.filter((m) => m.mastered).length;

  // Trigger re-check answer
  const handleCheckAnswer = (mistake: MistakeRecord) => {
    const selected = selectedOptionByMistake[mistake.id];
    if (!selected) {
      alert('Vui lòng chọn một phương án trước khi kiểm tra.');
      return;
    }

    const isCorrect = selected.trim().toUpperCase() === mistake.question.correctAnswer.trim().toUpperCase();

    if (isCorrect) {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}
      recordPracticeAttempt(mistake.id, true);
      setTestResultByMistake((prev) => ({
        ...prev,
        [mistake.id]: { tested: true, isCorrect: true }
      }));
    } else {
      soundEffects.playFlag();
      recordPracticeAttempt(mistake.id, false);
      setTestResultByMistake((prev) => ({
        ...prev,
        [mistake.id]: { tested: true, isCorrect: false }
      }));
    }
  };

  // Request AI Hint
  const handleGetAiHint = async (mistake: MistakeRecord) => {
    if (mistake.aiHint) {
      // Toggle display
      setShowExplanation((prev) => ({
        ...prev,
        [mistake.id]: !prev[mistake.id]
      }));
      return;
    }

    setLoadingAiHint((prev) => ({ ...prev, [mistake.id]: true }));
    try {
      const hint = await aiService.explainAnswer({
        questionText: mistake.question.question,
        options: mistake.question.options,
        studentAnswer: mistake.studentAnswer,
        correctAnswer: mistake.question.correctAnswer,
        grade: mistake.grade
      });
      saveAiHint(mistake.id, hint);
      setShowExplanation((prev) => ({ ...prev, [mistake.id]: true }));
    } catch {
      alert('Không thể kết nối trợ lý AI lúc này. Bạn có thể xem lời giải chi tiết của giáo viên nhé!');
    } finally {
      setLoadingAiHint((prev) => ({ ...prev, [mistake.id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-8 py-5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-700 text-white flex items-center justify-between shadow-md select-none shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Sổ Tay Câu Sai (Mistake Vault)
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider">
                  AI Phân Tích
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                Tự động gom nhặt câu làm sai sau mỗi bài thi • Luyện tập lấp lỗ hổng kiến thức
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng sổ tay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATS & CONTROL BAR */}
        <div className="px-5 sm:px-8 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Quick Stats Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Cần khắc phục:</span>
              <span className="font-black text-rose-600 dark:text-rose-400">{activeCount} câu</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Đã nắm vững:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{masteredCount} câu</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {masteredCount > 0 && (
              <button
                onClick={clearMasteredMistakes}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Dọn dẹp các câu đã luyện tập thành thạo"
              >
                Dọn câu đã xong
              </button>
            )}

            {mistakes.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử trong Sổ tay câu sai?')) {
                    clearAllMistakes();
                  }
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-semibold px-2.5 py-1.5 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                title="Xóa hết câu sai"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* FILTERS & SEARCH ROW */}
        <div className="px-5 sm:px-8 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          {/* Grade filter tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedGrade === 'all'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Tất cả khối
            </button>
            {(['6', '7', '8', '9'] as GradeLevel[]).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('unmastered')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'unmastered'
                  ? 'bg-white dark:bg-rose-600 text-rose-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>🔴 Chưa sửa</span>
              <span className="font-mono text-[10px]">({activeCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'mastered'
                  ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>🟢 Đã nắm vững</span>
              <span className="font-mono text-[10px]">({masteredCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Tất cả ({mistakes.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo chuyên đề, từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* MAIN LIST CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredMistakes.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                {mistakes.length === 0
                  ? 'Sổ tay câu sai đang trống!'
                  : 'Không có câu hỏi nào khớp với bộ lọc'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                {mistakes.length === 0
                  ? 'Sau khi làm bài kiểm tra hoặc đề luyện tập, nếu có câu nào chưa đúng, hệ thống sẽ tự động lưu vào đây để bạn luyện lại.'
                  : 'Hãy thử chọn khối lớp khác hoặc chuyển sang xem các câu đã nắm vững.'}
              </p>
            </div>
          ) : (
            filteredMistakes.map((m, idx) => {
              const currentSelected = selectedOptionByMistake[m.id] || '';
              const testResult = testResultByMistake[m.id];
              const isAiLoading = loadingAiHint[m.id];
              const isExpanded = showExplanation[m.id];

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                    m.mastered
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Toán {m.grade}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                        {m.assignmentTitle}
                      </span>
                      {m.question.topicHint && (
                        <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
                          • {m.question.topicHint}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {m.mastered ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nắm vững</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Cần luyện lại</span>
                        </span>
                      )}

                      <button
                        onClick={() => removeMistake(m.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                        title="Xóa câu này khỏi sổ tay"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="py-3 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                    <MathDisplay content={m.question.question} />
                  </div>

                  {/* Previous Wrong Answer Reminder */}
                  <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>
                        Lần trước bạn chọn: <strong>{m.studentAnswer}</strong> (Chưa chính xác)
                      </span>
                    </div>
                    {m.practiceCount > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Đã thử: {m.practiceCount} lần
                      </span>
                    )}
                  </div>

                  {/* Interactive Options Practice */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                    {m.question.options.map((opt) => {
                      const isSelected = currentSelected === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            soundEffects.playClick();
                            setSelectedOptionByMistake((prev) => ({
                              ...prev,
                              [m.id]: opt.id
                            }));
                          }}
                          className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 ring-2 ring-indigo-500/50 text-indigo-900 dark:text-indigo-100'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <div className="text-xs sm:text-sm font-medium flex-1">
                            <MathDisplay content={opt.text} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Banner after re-checking */}
                  {testResult && testResult.tested && (
                    <div
                      className={`p-3 rounded-xl my-2 text-xs font-bold flex items-center space-x-2 animate-in zoom-in-95 duration-150 ${
                        testResult.isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300'
                      }`}
                    >
                      {testResult.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            🎉 Chính xác tuyệt vời! Bạn đã khắc phục thành công câu sai này và được ghi nhận là Đã Nắm Vững!
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            Đáp án vừa chọn vẫn chưa đúng. Bạn hãy bấm nút "Gợi ý bước giải từ AI" bên dưới để được hướng dẫn nhé!
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Card Bottom Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center space-x-2">
                      {/* Check Answer Button */}
                      <button
                        onClick={() => handleCheckAnswer(m)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Kiểm tra đáp án</span>
                      </button>

                      {/* AI Hint Button */}
                      <button
                        onClick={() => handleGetAiHint(m)}
                        disabled={isAiLoading}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>{isAiLoading ? 'AI đang phân tích...' : m.aiHint ? 'Xem lại gợi ý AI' : 'Gợi ý bước giải AI'}</span>
                      </button>
                    </div>

                    {/* Mark as Mastered button manually if student understands */}
                    <button
                      onClick={() => {
                        soundEffects.playSuccess();
                        markAsMastered(m.id);
                      }}
                      className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
                    >
                      {m.mastered ? '✓ Đã nắm vững' : 'Đánh dấu đã hiểu bài'}
                    </button>
                  </div>

                  {/* Expanded AI Explanation / Teacher Solution */}
                  {(isExpanded || m.aiHint) && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs text-slate-800 dark:text-slate-200">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                        <Lightbulb className="w-4 h-4" />
                        <span>Hướng dẫn tư duy từng bước từ Trợ Lý AI:</span>
                      </div>
                      
                      <div className="whitespace-pre-line leading-relaxed font-sans">
                        {m.aiHint || 'Đang cập nhật hướng dẫn chi tiết...'}
                      </div>

                      {m.question.explanation && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-slate-600 dark:text-slate-400">
                            Đáp án chuẩn của Thầy/Cô:
                          </span>{' '}
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {m.question.correctAnswer}
                          </span>
                          <div className="mt-1">
                            <MathDisplay content={m.question.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-8 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">🌟 Phương pháp học chủ động:</span>
            <span>Mỗi lần sửa đúng 1 câu sai là một lần nâng cao điểm số bài thi chính thức!</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng sổ tay
          </button>
        </div>

      </div>
    </div>
  );
};
