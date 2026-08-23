import React, { useState, useEffect, useRef } from 'react';
import { Assignment, Submission } from '../../types';
import { MathDisplay } from '../../components/MathDisplay';
import { GradingService } from '../../services/gradingService';
import { StorageService } from '../../services/storageService';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  X
} from 'lucide-react';

interface StudentExamPageProps {
  assignment: Assignment;
  studentName: string;
  classId: string;
  className: string;
  onFinishExam: (submission: Submission) => void;
}

export const StudentExamPage: React.FC<StudentExamPageProps> = ({
  assignment,
  studentName,
  classId,
  className,
  onFinishExam
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt] = useState<string>(() => new Date().toISOString());
  
  // Timer calculation
  const totalSeconds = assignment.durationMinutes > 0 ? assignment.durationMinutes * 60 : 0;
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const questions = assignment.questions || [];
  const currentQ = questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (totalSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleForceAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [totalSeconds]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionId
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleForceAutoSubmit = () => {
    submitExam();
  };

  const submitExam = () => {
    const submittedAt = new Date().toISOString();
    const submission = GradingService.gradeSubmission({
      assignment,
      studentAnswers: answers,
      studentName,
      classId,
      className,
      startedAt,
      submittedAt
    });

    // Save to storage
    StorageService.saveSubmission(submission);
    onFinishExam(submission);
  };

  // Stats for unanswered check
  const answeredCount = questions.filter(q => !!answers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;

  // Format timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeCritical = totalSeconds > 0 && timeLeft <= 120; // < 2 mins

  if (!currentQ) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Bài tập chưa có câu hỏi nào.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-between pb-8">
      {/* Top Sticky Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Title & Info */}
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md shrink-0">
                Lớp {className}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                {assignment.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              Học sinh: <strong className="text-slate-700">{studentName}</strong>
            </p>
          </div>

          {/* Question Index & Timer & Submit Button */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Timer */}
            {totalSeconds > 0 ? (
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
                  isTimeCritical
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg">
                Không giới hạn giờ
              </div>
            )}

            {/* Quick Submit Top Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Card Area */}
      <div className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200/80">
          {/* Question Header & Order */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm shadow-xs">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Câu {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {currentQ.points} điểm {currentQ.topicHint ? `• ${currentQ.topicHint}` : ''}
            </div>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-xl font-semibold text-slate-900 leading-relaxed mb-8">
            <MathDisplay text={currentQ.question} />
          </div>

          {/* Options Grid (Mobile-friendly large buttons) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`flex items-center p-4 rounded-2xl border-2 text-left transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80'
                  }`}
                >
                  {/* Option Badge A, B, C, D */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm mr-3.5 shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {opt.id}
                  </div>

                  {/* Option Text */}
                  <div className="flex-1 text-base font-medium text-slate-800">
                    <MathDisplay text={opt.text} />
                  </div>

                  {/* Radio check icon */}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center ml-2 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                currentIndex === 0
                  ? 'opacity-40 text-slate-400 cursor-not-allowed bg-slate-100'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>CÂU TRƯỚC</span>
            </button>

            <span className="text-xs font-semibold text-slate-400">
              Đã làm: <strong className="text-indigo-600 font-bold">{answeredCount}</strong>/{questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
              >
                <span>CÂU TIẾP THEO</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95"
              >
                <Flag className="w-4 h-4" />
                <span>NỘP BÀI THI</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Palette (Bảng số câu hỏi) */}
        <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách câu hỏi
            </span>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Đã làm ({answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Chưa làm ({unansweredCount})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;

              let btnClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200';
              if (isAnswered) {
                btnClass = 'bg-indigo-600 text-white font-bold shadow-xs';
              }
              if (isCurrent) {
                btnClass += ' ring-2 ring-indigo-400 ring-offset-2 scale-105';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              {unansweredCount > 0 ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {unansweredCount > 0 ? 'Xác nhận nộp bài' : 'Sẵn sàng nộp bài!'}
            </h3>

            {unansweredCount > 0 ? (
              <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-sm text-amber-900">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  Bạn còn <span className="underline font-bold text-rose-600">{unansweredCount} câu chưa trả lời</span>!
                </p>
                <p className="text-xs text-amber-700">
                  Các câu chưa làm sẽ được tính là 0 điểm. Bạn có muốn quay lại hoàn thành không?
                </p>
              </div>
            ) : (
              <p className="my-4 text-sm text-slate-600">
                Bạn đã trả lời đầy đủ <strong className="text-emerald-700">{questions.length}/{questions.length}</strong> câu hỏi. Nhấn nộp bài để hệ thống tự động chấm điểm!
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Tiếp tục làm
              </button>
              <button
                type="button"
                onClick={submitExam}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition-all active:scale-95"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
