import React, { useState } from 'react';
import { Submission, Assignment, Question } from '../../types';
import { GradingService } from '../../services/gradingService';
import { aiService } from '../../services/aiService';
import { MathDisplay } from '../../components/MathDisplay';
import { ImageLightboxModal } from '../../components/ImageLightboxModal';
import { isEssayQuestion, getQuestionTypeLabel } from '../../utils/questionUtils';
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCheck2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  BookOpen, 
  Lightbulb, 
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  Shuffle,
  Camera,
  Image as ImageIcon,
  Eye,
  Award,
  Check,
  X
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
  const [filterType, setFilterType] = useState<'all' | 'wrong' | 'correct'>('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // AI Explanations & Grading
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [aiGradingFeedback, setAiGradingFeedback] = useState<Record<string, { score: number; feedback: string }>>({});
  const [loadingAiGrading, setLoadingAiGrading] = useState<Record<string, boolean>>({});

  // Lightbox modal state
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const toggleExpand = (questionId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [questionId]: prev[questionId] === undefined ? false : !prev[questionId]
    }));
  };

  const handleRequestAiExplanation = async (question: Question, studentAnswer: string) => {
    setLoadingAi(prev => ({ ...prev, [question.id]: true }));
    try {
      const exp = await aiService.explainAnswer({
        questionText: question.question,
        options: question.options,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        grade: assignment.grade
      });
      setAiExplanations(prev => ({ ...prev, [question.id]: exp }));
    } catch {
      alert('Không thể tải hướng dẫn của AI lúc này. Bạn hãy xem lời giải chuẩn bên dưới nhé!');
    } finally {
      setLoadingAi(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const handleGradeWithAI = async (question: Question, studentSolutionText?: string, images?: string[]) => {
    setLoadingAiGrading(prev => ({ ...prev, [question.id]: true }));
    try {
      const res = await aiService.gradeEssay({
        questionText: question.question,
        studentAnswerText: studentSolutionText || '',
        essayImages: images || [],
        maxPoints: question.points,
        correctAnswerCriteria: question.correctAnswer,
        rubric: question.rubric,
        grade: assignment.grade,
        topicHint: question.topicHint
      });
      setAiGradingFeedback(prev => ({
        ...prev,
        [question.id]: { score: res.score, feedback: res.feedback }
      }));
    } catch {
      alert('Chấm bài bằng AI không thành công. Bạn hãy thử lại sau.');
    } finally {
      setLoadingAiGrading(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered list of answers
  const filteredAnswers = submission.answers.filter(ans => {
    if (filterType === 'correct') return ans.isCorrect;
    if (filterType === 'wrong') return !ans.isCorrect;
    return true;
  });

  // Calculate score rating banner
  const score = submission.totalScore;
  let ratingColor = 'from-indigo-600 to-purple-600';
  let ratingTitle = 'Làm bài khá tốt!';
  let ratingMessage = 'Hãy xem kỹ các câu sai để rút kinh nghiệm cho lần thi tiếp theo nhé.';

  if (score >= 9.0) {
    ratingColor = 'from-emerald-500 to-teal-600';
    ratingTitle = 'Xuất sắc! Điểm số rất cao 🎉';
    ratingMessage = 'Bạn nắm kiến thức toán học rất vững chắc. Tiếp tục phát huy nhé!';
  } else if (score >= 7.0) {
    ratingColor = 'from-blue-600 to-indigo-600';
    ratingTitle = 'Khá giỏi! Đạt yêu cầu tốt 👏';
    ratingMessage = 'Chỉ còn vài điểm cần cải thiện, bạn đọc thêm phần giải thích chi tiết bên dưới nhé.';
  } else if (score < 5.0) {
    ratingColor = 'from-rose-500 to-amber-600';
    ratingTitle = 'Cần nỗ lực thêm nhé! 💪';
    ratingMessage = 'Đừng nản lòng! Hãy đọc kỹ lời giải từng bước của AI và luyện tập lại đề này.';
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* HERO SCORE SUMMARY CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${ratingColor}`} />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 font-black mb-4 shadow-inner border border-indigo-100">
            <Trophy className="w-10 h-10" />
          </div>

          <span className="inline-block bg-slate-100 text-slate-700 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider mb-2">
            Kết Quả Bài Làm • Lớp {submission.className}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {submission.studentName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Bài kiểm tra: <strong>{submission.assignmentTitle}</strong>
          </p>

          {/* Big Score Display */}
          <div className="my-6">
            <div className="inline-flex items-baseline space-x-2 bg-gradient-to-br from-indigo-50 to-purple-50 px-8 py-4 rounded-3xl border-2 border-indigo-100 shadow-sm">
              <span className="text-5xl sm:text-6xl font-black text-indigo-600 tracking-tight">
                {score.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-slate-400">/ 10</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 mt-3">{ratingTitle}</h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">{ratingMessage}</p>
          </div>

          {/* 4 Stat Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
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
                      Hệ thống đã lưu lại nhật ký chuyển tab và gửi báo cáo chi tiết đến giáo viên.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={onRetake}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-colors border border-indigo-200 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện tập lại đề này</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors border border-slate-300 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In phiếu điểm</span>
            </button>
            <button
              onClick={onGoHome}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Về trang chủ</span>
            </button>
          </div>
        </div>

        {/* DETAILED ANSWER REVIEW */}
        {assignment.allowViewResult ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>Xem lại bài làm & Lời giải chi tiết</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra đối chiếu đáp án, bài làm tự luận và hướng dẫn giải từng bước.
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

                const currentAiGrading = aiGradingFeedback[question.id] || (ans.aiGraded ? { score: ans.aiScore || 0, feedback: ans.aiFeedback || '' } : null);
                const isLoadingGrading = !!loadingAiGrading[question.id];
                const images = ans.essayImages || [];

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
                            Câu {question.order} • {getQuestionTypeLabel(question)}
                          </span>
                          <span
                            className={`text-xs font-bold ml-2 ${
                              isCorrect ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isCorrect ? `Đúng (+${ans.pointsEarned} điểm)` : `Chưa đúng (+${ans.pointsEarned}/${ans.maxPoints} điểm)`}
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

                    {/* 1. If multiple choice: display options */}
                    {!isEssayQuestion(question) && question.options && question.options.length > 0 && (
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
                    )}

                    {/* 2. If student typed solution: display it */}
                    {ans.studentSolutionText && (
                      <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                        <div className="font-bold text-slate-700">📝 Lời giải của học sinh:</div>
                        <div className="font-mono text-slate-800 whitespace-pre-line pl-1">{ans.studentSolutionText}</div>
                      </div>
                    )}

                    {/* 3. If student uploaded essay photos: display gallery */}
                    {images.length > 0 && (
                      <div className="mb-4 p-3.5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                        <div className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-purple-600" />
                          <span>Ảnh chụp bài làm tự luận ({images.length} ảnh):</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {images.map((img, iIdx) => (
                            <div key={iIdx} className="relative group rounded-xl overflow-hidden border border-purple-300 bg-white aspect-4/3 shadow-xs">
                              <img
                                src={img}
                                alt={`Ảnh ${iIdx + 1}`}
                                onClick={() => setLightboxImageUrl(img)}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white text-[11px] font-bold flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Xem lớn
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. AI Essay Grading Feedback Card */}
                    {currentAiGrading && (
                      <div className="mb-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                        <div className="flex items-center justify-between font-extrabold text-indigo-900 border-b border-indigo-200/60 pb-2">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span>Trợ lý Gemini AI chấm bài tự luận:</span>
                          </span>
                          <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs">
                            Đạt {currentAiGrading.score}/{question.points} điểm
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line text-indigo-900">
                          {currentAiGrading.feedback}
                        </p>
                      </div>
                    )}

                    {/* Button on-demand AI Grading if essay question has solution but not graded */}
                    {question.type === 'essay' && !currentAiGrading && (
                      <div className="mb-4">
                        <button
                          onClick={() => handleGradeWithAI(question, ans.studentSolutionText, images)}
                          disabled={isLoadingGrading}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isLoadingGrading ? 'animate-spin' : ''}`} />
                          <span>{isLoadingGrading ? 'AI đang chấm bài...' : 'Nhờ AI chấm bài tự luận này'}</span>
                        </button>
                      </div>
                    )}

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
                                onClick={() => handleRequestAiExplanation(question, ans.selectedAnswer)}
                                disabled={isLoadingAi}
                                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors border border-purple-200 cursor-pointer disabled:opacity-50"
                              >
                                <Sparkles className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                                <span>{isLoadingAi ? 'AI đang phân tích bẫy sai...' : '✨ Hỏi Gia Sư AI: Tại sao em làm sai câu này?'}</span>
                              </button>
                            ) : (
                              <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 text-xs sm:text-sm text-purple-950 space-y-2 animate-in fade-in">
                                <div className="flex items-center space-x-2 text-purple-900 font-extrabold">
                                  <GraduationCap className="w-4 h-4 text-purple-600" />
                                  <span>Lời khuyên từ Trợ lý AI:</span>
                                </div>
                                <div className="leading-relaxed whitespace-pre-line pl-1 text-purple-900">
                                  {aiExplanations[question.id]}
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
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center text-xs text-amber-800">
            Giáo viên đã tắt chế độ xem đáp án chi tiết cho bài kiểm tra này.
          </div>
        )}
      </div>

      {/* LIGHTBOX VIEWER */}
      <ImageLightboxModal
        isOpen={Boolean(lightboxImageUrl)}
        imageUrl={lightboxImageUrl}
        onClose={() => setLightboxImageUrl(null)}
        title="Xem ảnh bài làm tự luận"
      />
    </div>
  );
};
