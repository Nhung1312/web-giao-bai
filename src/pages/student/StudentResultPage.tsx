import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Submission, Assignment } from '../../types';
import { MathDisplay } from '../../components/MathDisplay';
import { GradingService } from '../../services/gradingService';
import { aiService } from '../../services/aiService';
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
  AlertCircle
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

  useEffect(() => {
    // Fire celebratory confetti if good score
    if (submission.totalScore >= 5) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
    }
  }, [submission.totalScore]);

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

  const filteredAnswers = submission.answers.filter(ans => {
    if (filterType === 'correct') return ans.isCorrect;
    if (filterType === 'wrong') return !ans.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Score Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden mb-8">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-indigo-50/60 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-emerald-50/60 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-3 shadow-inner">
            <Trophy className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            🎉 HOÀN THÀNH BÀI LÀM
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bài tập: <strong>{assignment.title}</strong> • Lớp <strong>{submission.className}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Học sinh: <strong className="text-slate-800">{submission.studentName}</strong>
          </p>

          {/* Big Score Card */}
          <div className="my-6 inline-block">
            <div
              className={`px-8 py-4 rounded-3xl bg-gradient-to-r shadow-lg font-black ${getScoreBadgeColor(
                submission.totalScore
              )}`}
            >
              <div className="text-4xl sm:text-6xl tracking-tight">
                {submission.totalScore.toFixed(1)} <span className="text-2xl sm:text-3xl font-bold opacity-80">/ 10</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider uppercase mt-1 opacity-95">
                {getScoreRating(submission.totalScore)}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5">
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Số câu đúng</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-900">
                {submission.correctCount} <span className="text-xs font-normal text-emerald-700">/{submission.totalQuestions}</span>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3.5">
              <div className="flex items-center space-x-1.5 text-rose-700 text-xs font-bold mb-1">
                <XCircle className="w-4 h-4" />
                <span>Số câu sai</span>
              </div>
              <div className="text-xl font-extrabold text-rose-900">
                {submission.wrongCount} <span className="text-xs font-normal text-rose-700">/{submission.totalQuestions}</span>
              </div>
            </div>

            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5">
              <div className="flex items-center space-x-1.5 text-blue-700 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Thời gian làm</span>
              </div>
              <div className="text-sm font-extrabold text-blue-900 leading-tight">
                {GradingService.formatDuration(submission.timeSpentSeconds)}
              </div>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3.5">
              <div className="flex items-center space-x-1.5 text-indigo-700 text-xs font-bold mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Tỷ lệ chính xác</span>
              </div>
              <div className="text-xl font-extrabold text-indigo-900">
                {Math.round((submission.correctCount / submission.totalQuestions) * 100)}%
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={onRetake}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-colors border border-indigo-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện tập lại</span>
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

      {/* Answer Review Section */}
      {assignment.allowViewResult ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chi tiết bài làm & Đáp án đúng</h2>
              <p className="text-xs text-slate-500">
                Xem lại từng câu, kiểm tra đối chiếu đáp án và lời giải chi tiết.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tất cả ({submission.answers.length})
              </button>
              <button
                onClick={() => setFilterType('wrong')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filterType === 'wrong' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Câu sai ({submission.wrongCount})
              </button>
              <button
                onClick={() => setFilterType('correct')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filterType === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Câu đúng ({submission.correctCount})
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {filteredAnswers.map((ans, idx) => {
              const question = assignment.questions.find(q => q.id === ans.questionId);
              if (!question) return null;

              const isCorrect = ans.isCorrect;
              const hasAiExp = !!aiExplanations[question.id];
              const isLoadingAi = !!loadingAi[question.id];

              return (
                <div
                  key={question.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 transition-all ${
                    isCorrect ? 'border-emerald-200/80 bg-white' : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  {/* Header badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {question.order}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {isCorrect ? 'ĐÚNG (+ ' + ans.pointsEarned + 'đ)' : 'CHƯA CHÍNH XÁC (0đ)'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Sai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-base font-semibold text-slate-900 mb-4">
                    <MathDisplay text={question.question} />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {question.options.map(opt => {
                      const isStudentChoice = ans.selectedAnswer === opt.id;
                      const isCorrectChoice = question.correctAnswer === opt.id;

                      let optClass = 'border-slate-200 bg-slate-50 text-slate-700';
                      if (isCorrectChoice) {
                        optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                      } else if (isStudentChoice && !isCorrect) {
                        optClass = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center p-3 rounded-xl border text-xs sm:text-sm ${optClass}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs mr-2 shrink-0 ${
                              isCorrectChoice
                                ? 'bg-emerald-600 text-white'
                                : isStudentChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="flex-1">
                            <MathDisplay text={opt.text} />
                          </span>
                          {isStudentChoice && (
                            <span className="ml-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white shrink-0">
                              Bạn chọn
                            </span>
                          )}
                          {isCorrectChoice && (
                            <span className="ml-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-700 text-white shrink-0">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  {question.explanation && (
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs sm:text-sm text-indigo-950 mt-3">
                      <div className="font-bold text-indigo-800 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Lời giải chi tiết:
                      </div>
                      <MathDisplay text={question.explanation} />
                    </div>
                  )}

                  {/* AI Assistant Explanation Simulated Hook (Architecture ready for Gemini) */}
                  {!isCorrect && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
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
                          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {isLoadingAi ? 'Đang phân tích vì sao bạn sai...' : '💡 AI Giải thích vì sao em sai câu này'}
                          </span>
                        </button>
                      ) : (
                        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-xs text-slate-800 animate-in fade-in duration-150">
                          <div className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Phân tích sư phạm AI:
                          </div>
                          <div className="whitespace-pre-line leading-relaxed">
                            {aiExplanations[question.id]}
                          </div>
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
        <div className="p-6 bg-slate-100 rounded-2xl text-center text-sm text-slate-600 border border-slate-200">
          <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          Giáo viên chưa mở quyền xem đáp án chi tiết cho bài tập này. Điểm của bạn đã được ghi nhận vào hệ thống!
        </div>
      )}
    </div>
  );
};
