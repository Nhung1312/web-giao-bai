import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Submission, Assignment } from '../../types';
import { MathDisplay } from '../../components/MathDisplay';
import { GradingService } from '../../services/gradingService';
import { aiService } from '../../services/aiService';
import { useLearningProgressStore } from '../../store/useLearningProgressStore';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Home, 
  Sparkles, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Share2,
  Printer,
  FileCheck2,
  Lightbulb,
  Check,
  X,
  Flame,
  Award,
  ShieldCheck,
  ShieldAlert,
  Shuffle,
  Lock,
  EyeOff
} from 'lucide-react';

interface StudentResultPageProps {
  submission: Submission;
  assignment: Assignment;
  onRetake: () => void;
  onGoHome: () => void;
}

export const StudentResultPage: React.FC<StudentResultPageProps> = ({
  submission,
  assignment,
  onRetake,
  onGoHome
}) => {
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<'all' | 'wrong' | 'correct'>('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fire celebratory confetti if good score
    if (submission.totalScore >= 5) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
    }

    // Default expand all wrong questions so student can learn immediately
    const initialExpanded: Record<string, boolean> = {};
    submission.answers.forEach(a => {
      if (!a.isCorrect) {
        initialExpanded[a.questionId] = true;
      }
    });
    setExpandedCards(initialExpanded);
  }, [submission]);

  const toggleExpand = (qId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleRequestAiExplanation = async (questionId: string, qText: string, opts: any[], correct: string, studentAns: string) => {
    if (aiExplanations[questionId] || loadingAi[questionId]) return;

    setLoadingAi(prev => ({ ...prev, [questionId]: true }));
    try {
      const explanation = await aiService.explainAnswer({
        questionText: qText,
        options: opts,
        correctAnswer: correct,
        studentAnswer: studentAns,
        grade: assignment.grade
      });
      setAiExplanations(prev => ({ ...prev, [questionId]: explanation }));
    } catch {
      setAiExplanations(prev => ({ ...prev, [questionId]: 'Không thể tải phân tích lúc này.' }));
    } finally {
      setLoadingAi(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8.5) return 'from-emerald-500 to-teal-600 text-white';
    if (score >= 6.5) return 'from-blue-600 to-indigo-600 text-white';
    if (score >= 5.0) return 'from-amber-500 to-orange-500 text-white';
    return 'from-rose-500 to-red-600 text-white';
  };

  const getScoreRating = (score: number) => {
    if (score >= 9.0) return 'Xuất sắc 🌟';
    if (score >= 8.0) return 'Giỏi 👍';
    if (score >= 6.5) return 'Khá 👏';
    if (score >= 5.0) return 'Trung bình ✍️';
    return 'Cần cố gắng thêm 📖';
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredAnswers = submission.answers.filter(ans => {
    if (filterType === 'correct') return ans.isCorrect;
    if (filterType === 'wrong') return !ans.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Score Hero Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden mb-8">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-50/70 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-50/70 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-3 shadow-inner">
            <Trophy className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            🎉 KẾT QUẢ BÀI THI
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Đề kiểm tra: <strong>{assignment.title}</strong> • Lớp <strong>{submission.className}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Thí sinh: <strong className="text-slate-800">{submission.studentName}</strong> • Hoàn thành lúc: {new Date(submission.submittedAt).toLocaleTimeString('vi-VN')}
          </p>

          {/* Big Score Card */}
          <div className="my-6 inline-block">
            <div
              className={`px-10 py-5 rounded-3xl bg-gradient-to-r shadow-xl font-black ${getScoreBadgeColor(
                submission.totalScore
              )}`}
            >
              <div className="text-5xl sm:text-7xl tracking-tight">
                {submission.totalScore.toFixed(1)}{' '}
                <span className="text-2xl sm:text-3xl font-bold opacity-80">/ 10</span>
              </div>
              <div className="text-xs sm:text-sm font-black tracking-widest uppercase mt-1 opacity-95">
                {getScoreRating(submission.totalScore)}
              </div>
            </div>
          </div>

          {/* Zustand Persistent Progress Notification */}
          <div className="mb-6 max-w-xl mx-auto bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <Trophy className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  + {submission.totalScore.toFixed(1)} điểm đã được cộng vào tiến trình học tập!
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lưu trữ tự động trong bộ nhớ thiết bị (LocalStorage).
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs">
                <span>✓ Đã ghi nhận</span>
              </span>
            </div>
          </div>

          {/* Key Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl mx-auto text-left">
            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-black uppercase mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Số câu đúng</span>
              </div>
              <div className="text-2xl font-black text-emerald-900">
                {submission.correctCount}{' '}
                <span className="text-xs font-normal text-emerald-700">/{submission.totalQuestions}</span>
              </div>
            </div>

            <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center space-x-1.5 text-rose-700 text-xs font-black uppercase mb-1">
                <XCircle className="w-4 h-4" />
                <span>Số câu sai</span>
              </div>
              <div className="text-2xl font-black text-rose-900">
                {submission.wrongCount}{' '}
                <span className="text-xs font-normal text-rose-700">/{submission.totalQuestions}</span>
              </div>
            </div>

            <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center space-x-1.5 text-blue-700 text-xs font-black uppercase mb-1">
                <Clock className="w-4 h-4" />
                <span>Thời gian</span>
              </div>
              <div className="text-base font-black text-blue-900 leading-snug">
                {GradingService.formatDuration(submission.timeSpentSeconds)}
              </div>
            </div>

            <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center space-x-1.5 text-indigo-700 text-xs font-black uppercase mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Độ chính xác</span>
              </div>
              <div className="text-2xl font-black text-indigo-900">
                {Math.round((submission.correctCount / submission.totalQuestions) * 100)}%
              </div>
            </div>
          </div>

          {/* Anti-Cheat & Monitoring Verification Card */}
          <div className="mt-6 max-w-2xl mx-auto text-left">
            {(submission.tabSwitchCount ?? 0) === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-emerald-900 flex items-center gap-1.5">
                      <span>Giám sát thi cử: Trung thực tuyệt đối</span>
                      <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        0 vi phạm
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Không phát hiện hành vi chuyển tab hay rời màn hình trong suốt quá trình làm bài.
                    </p>
                  </div>
                </div>
                {submission.isShuffled && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                    <Shuffle className="w-3 h-3" />
                    <span>Đề đã trộn</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-amber-900">
                        Biên bản giám sát: Đã ghi nhận {submission.tabSwitchCount} lần rời màn hình
                      </h4>
                      <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-extrabold">
                        {submission.tabSwitchCount} vi phạm
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1">
                      Hệ thống đã lưu lại nhật ký chuyển tab / thu nhỏ cửa sổ và gửi báo cáo chi tiết đến giáo viên.
                    </p>

                    {submission.violationEvents && submission.violationEvents.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-amber-200/80 pt-2.5 text-[11px]">
                        <span className="font-bold text-amber-900 block">Lịch sử sự kiện:</span>
                        {submission.violationEvents.map((evt, vIdx) => (
                          <div key={vIdx} className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg text-slate-700">
                            <span className="truncate mr-2">• {evt.description}</span>
                            <span className="font-mono text-slate-500 text-[10px] shrink-0">
                              {new Date(evt.timestamp).toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={onRetake}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-colors border border-indigo-200 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện tập lại đề này</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors border border-slate-300 shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In phiếu điểm</span>
            </button>
            <button
              onClick={onGoHome}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Về trang chủ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Answer Review & Detailed Step-by-Step Solutions */}
      {assignment.allowViewResult ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Xem lại bài làm & Lời giải chi tiết</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra đối chiếu đáp án, đọc hướng dẫn giải từng bước và khắc phục các bẫy thường gặp.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0 gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({submission.answers.length})
              </button>
              <button
                onClick={() => setFilterType('wrong')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterType === 'wrong'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                🔴 Câu sai ({submission.wrongCount})
              </button>
              <button
                onClick={() => setFilterType('correct')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  filterType === 'correct'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                🟢 Câu đúng ({submission.correctCount})
              </button>
            </div>
          </div>

          {/* List of Questions with Full Explanations */}
          <div className="space-y-4">
            {filteredAnswers.map((ans) => {
              const question = assignment.questions.find(q => q.id === ans.questionId);
              if (!question) return null;

              const isCorrect = ans.isCorrect;
              const hasAiExp = !!aiExplanations[question.id];
              const isLoadingAi = !!loadingAi[question.id];
              const isExpanded = expandedCards[question.id] !== false; // expanded by default

              return (
                <div
                  key={question.id}
                  className={`bg-white rounded-3xl p-6 sm:p-7 shadow-sm border-2 transition-all ${
                    isCorrect ? 'border-emerald-200 bg-white' : 'border-rose-300 bg-rose-50/15'
                  }`}
                >
                  {/* Top Question Status Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black shadow-xs ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {question.order}
                      </span>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Câu {question.order}
                        </span>
                        <span
                          className={`text-xs font-bold ml-2 ${
                            isCorrect ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isCorrect ? `Đúng (+${ans.pointsEarned} điểm)` : 'Chưa đúng (0 điểm)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 text-xs font-extrabold px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Làm đúng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 text-xs font-extrabold px-3 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Cần ôn lại
                        </span>
                      )}

                      <button
                        onClick={() => toggleExpand(question.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Thu gọn' : 'Mở rộng lời giải'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed">
                    <MathDisplay text={question.question} />
                  </div>

                  {/* Multiple Choice Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {question.options.map((opt) => {
                      const isStudentChoice = ans.selectedAnswer === opt.id;
                      const isCorrectChoice = question.correctAnswer === opt.id;

                      let optContainerClass = 'border-slate-200 bg-slate-50/70 text-slate-700';
                      let badgeClass = 'bg-slate-200 text-slate-700';

                      if (isCorrectChoice) {
                        optContainerClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-400/40';
                        badgeClass = 'bg-emerald-600 text-white';
                      } else if (isStudentChoice && !isCorrect) {
                        optContainerClass = 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-400/30';
                        badgeClass = 'bg-rose-600 text-white';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center p-3.5 rounded-2xl border-2 text-xs sm:text-sm transition-all ${optContainerClass}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs mr-3 shrink-0 ${badgeClass}`}
                          >
                            {opt.id}
                          </span>

                          <span className="flex-1">
                            <MathDisplay text={opt.text} />
                          </span>

                          {/* Student selected tag */}
                          {isStudentChoice && (
                            <span
                              className={`ml-2 text-[10px] uppercase font-black px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
                                isCorrect
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Bạn chọn
                            </span>
                          )}

                          {/* Correct tag */}
                          {isCorrectChoice && !isStudentChoice && (
                            <span className="ml-2 text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step-by-Step Mathematical Explanation */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2">
                      {question.explanation && (
                        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs sm:text-sm text-indigo-950 shadow-xs">
                          <div className="font-extrabold text-indigo-900 mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider">
                            <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Lời giải chi tiết từng bước:</span>
                          </div>
                          <div className="leading-relaxed whitespace-pre-line pl-1">
                            <MathDisplay text={question.explanation} />
                          </div>
                        </div>
                      )}

                      {/* AI Tutor Pedagogical Guidance */}
                      {!isCorrect && (
                        <div className="pt-2">
                          {!hasAiExp ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRequestAiExplanation(
                                  question.id,
                                  question.question,
                                  question.options,
                                  question.correctAnswer,
                                  ans.selectedAnswer
                                )
                              }
                              disabled={isLoadingAi}
                              className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-300 transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <span>
                                {isLoadingAi
                                  ? 'Đang phân tích vì sao em sai...'
                                  : '💡 Gia Sư AI: Hướng dẫn bước giải & khắc phục lỗi sai'}
                              </span>
                            </button>
                          ) : (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl text-xs sm:text-sm text-slate-800 shadow-sm animate-in fade-in duration-200">
                              <div className="font-black text-purple-900 mb-2 flex items-center gap-1.5 uppercase text-xs tracking-wider">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span>Phân tích & Hướng dẫn sư phạm AI:</span>
                              </div>
                              <div className="whitespace-pre-line leading-relaxed pl-1 text-slate-700">
                                <MathDisplay text={aiExplanations[question.id]} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-100 rounded-3xl text-center text-sm text-slate-600 border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            Chế độ bảo mật đề thi
          </h3>
          <p className="text-slate-500 max-w-md mx-auto text-xs sm:text-sm">
            Giáo viên chưa mở quyền xem lại đáp án và lời giải chi tiết cho bài tập này. Điểm của bạn đã được lưu tự động vào sổ điểm của lớp!
          </p>
        </div>
      )}
    </div>
  );
};
