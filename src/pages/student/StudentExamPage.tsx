import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Assignment, Submission, ViolationEvent } from '../../types';
import { MathDisplay } from '../../components/MathDisplay';
import { GradingService } from '../../services/gradingService';
import { StorageService } from '../../services/storageService';
import { FirestoreService } from '../../services/firestoreService';
import { useTheme } from '../../context/ThemeContext';
import { shuffleAssignmentQuestionsAndOptions, formatViolationTime } from '../../utils/antiCheatUtils';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  Check,
  RotateCcw,
  Sparkles,
  Bookmark,
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Shuffle,
  Lock,
  EyeOff,
  Info,
  LayoutGrid,
  ListOrdered
} from 'lucide-react';

interface StudentExamPageProps {
  assignment: Assignment;
  studentName: string;
  classId: string;
  className: string;
  onFinishExam: (submission: Submission) => void;
}

interface ExamDraft {
  answers: Record<string, string>;
  flaggedQuestionIds: string[];
  timeLeft: number;
  currentIndex: number;
  startedAt: string;
  lastSavedAt: string;
  shuffledAssignment?: Assignment;
  tabSwitchCount?: number;
  violationEvents?: ViolationEvent[];
}

export const StudentExamPage: React.FC<StudentExamPageProps> = ({
  assignment,
  studentName,
  classId,
  className,
  onFinishExam
}) => {
  const { isDark, toggleTheme } = useTheme();
  const draftStorageKey = `toan_thcs_draft_${assignment.id}_${encodeURIComponent(studentName)}`;

  // Chỉ bật chế độ 2 cột khi đề thi được đánh dấu chính xác là loại 'pdf'
  const isPdfMode = (assignment as any).type === 'pdf';

  // 1. Restore draft if available from LocalStorage
  const [initialLoadedDraft] = useState<ExamDraft | null>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        return JSON.parse(saved) as ExamDraft;
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
    return null;
  });

  // 2. SHUFFLE SYSTEM: Ensure questions & options are randomized per student/session
  const [currentAssignment, setCurrentAssignment] = useState<Assignment>(() => {
    if (initialLoadedDraft?.shuffledAssignment && initialLoadedDraft.shuffledAssignment.questions?.length > 0) {
      return initialLoadedDraft.shuffledAssignment;
    }
    return shuffleAssignmentQuestionsAndOptions(assignment);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    return initialLoadedDraft?.currentIndex ?? 0;
  });

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    return initialLoadedDraft?.answers ?? {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>(() => {
    return initialLoadedDraft?.flaggedQuestionIds ?? [];
  });

  const [startedAt] = useState<string>(() => {
    return initialLoadedDraft?.startedAt ?? new Date().toISOString();
  });

  // Anti-cheat violation tracking state
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(() => {
    return initialLoadedDraft?.tabSwitchCount ?? 0;
  });

  const [violationEvents, setViolationEvents] = useState<ViolationEvent[]>(() => {
    return initialLoadedDraft?.violationEvents ?? [];
  });

  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [latestViolation, setLatestViolation] = useState<{ reason: string; count: number; time: string } | null>(null);
  const [antiCheatToast, setAntiCheatToast] = useState<{ message: string; id: number } | null>(null);
  const [showAntiCheatPolicyModal, setShowAntiCheatPolicyModal] = useState<boolean>(false);

  // Total timer in seconds
  const totalSeconds = assignment.durationMinutes > 0 ? assignment.durationMinutes * 60 : 0;
  
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (initialLoadedDraft && typeof initialLoadedDraft.timeLeft === 'number') {
      return Math.max(5, initialLoadedDraft.timeLeft);
    }
    return totalSeconds;
  });

  // UI enhancement states
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [fontSizeScale, setFontSizeScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string>('Vừa xong');
  const [showDraftToast, setShowDraftToast] = useState<boolean>(!!initialLoadedDraft);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false);
  const [filterNavTab, setFilterNavTab] = useState<'all' | 'unanswered' | 'flagged'>('all');

  const questions = currentAssignment.questions || [];
  const currentQ = questions[currentIndex] || questions[0];

  const triggerAntiCheatToast = useCallback((msg: string) => {
    setAntiCheatToast({ message: msg, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!antiCheatToast) return;
    const timer = setTimeout(() => {
      setAntiCheatToast(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [antiCheatToast]);

  const saveProgressToLocalStorage = useCallback(() => {
    try {
      const draft: ExamDraft = {
        answers,
        flaggedQuestionIds: flaggedQuestions,
        timeLeft,
        currentIndex,
        startedAt,
        lastSavedAt: new Date().toISOString(),
        shuffledAssignment: currentAssignment,
        tabSwitchCount,
        violationEvents
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLastAutoSavedTime(timeStr);
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }, [answers, flaggedQuestions, timeLeft, currentIndex, startedAt, currentAssignment, tabSwitchCount, violationEvents, draftStorageKey]);

  useEffect(() => {
    saveProgressToLocalStorage();
  }, [answers, flaggedQuestions, currentIndex, tabSwitchCount, saveProgressToLocalStorage]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveProgressToLocalStorage();
    }, 4000);
    return () => clearInterval(saveInterval);
  }, [saveProgressToLocalStorage]);

  // ANTI-CHEAT FEATURE 1: TAB SWITCH
  useEffect(() => {
    let isAway = false;
    let awayStartTime = 0;

    const handleViolationTrigger = (type: 'tab_switch' | 'window_blur', desc: string) => {
      const isoNow = new Date().toISOString();
      const event: ViolationEvent = {
        timestamp: isoNow,
        type,
        description: desc
      };

      setViolationEvents(prev => [...prev, event]);
      setTabSwitchCount(prev => {
        const next = prev + 1;
        setLatestViolation({
          reason: desc,
          count: next,
          time: formatViolationTime(isoNow)
        });
        setShowViolationModal(true);
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isAway = true;
        awayStartTime = Date.now();
      } else {
        if (isAway) {
          isAway = false;
          const awayDuration = Math.round((Date.now() - awayStartTime) / 1000);
          handleViolationTrigger(
            'tab_switch',
            `Rời khỏi tab bài thi (Chuyển tab hoặc thu nhỏ trình duyệt)${awayDuration > 0 ? ` trong ~${awayDuration}s` : ''}`
          );
        }
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        isAway = true;
        awayStartTime = Date.now();
      }
    };

    const handleWindowFocus = () => {
      if (isAway && !document.hidden) {
        isAway = false;
        const awayDuration = Math.round((Date.now() - awayStartTime) / 1000);
        if (awayDuration >= 1) {
          handleViolationTrigger(
            'window_blur',
            `Mất tiêu điểm cửa sổ thi (nhấp ứng dụng khác hoặc cửa sổ bên ngoài)${awayDuration > 0 ? ` trong ~${awayDuration}s` : ''}`
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // ANTI-CHEAT FEATURE 2: DISABLE SHORTCUTS
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerAntiCheatToast('🔒 Chuột phải (Right-Click) đã bị vô hiệu hóa trong phòng thi!');
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerAntiCheatToast('🚫 Vô hiệu hóa chức năng Sao chép (Copy text) để đảm bảo tính trung thực!');
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (['input', 'textarea'].includes((target?.tagName || '').toLowerCase())) {
        return;
      }
      e.preventDefault();
      return false;
    };

    const handleKeyDownAntiCheat = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (
        e.key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
        (isCtrlOrMeta && ['u', 'p', 's'].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCheatToast('🚫 Phím tắt kiểm tra mã nguồn / in ấn bị chặn trong phòng thi!');
        return false;
      }

      if (isCtrlOrMeta && ['c', 'x', 'a'].includes(key)) {
        const target = document.activeElement as HTMLElement;
        if (['input', 'textarea'].includes((target?.tagName || '').toLowerCase())) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCheatToast('🚫 Vô hiệu hóa phím tắt Sao chép / Chọn toàn bộ (Ctrl+C / Ctrl+A)!');
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('keydown', handleKeyDownAntiCheat, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('keydown', handleKeyDownAntiCheat, { capture: true });
    };
  }, [triggerAntiCheatToast]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bài thi đang diễn ra. Tiến trình đã được lưu tạm, bạn có chắc chắn muốn rời đi?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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

  const handleSelectOption = (qId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionId
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) {
        return;
      }

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (['1', 'a', 'A'].includes(e.key)) {
        if (currentQ) handleSelectOption(currentQ.id, currentQ.options?.[0]?.id || 'A');
      } else if (['2', 'b', 'B'].includes(e.key)) {
        if (currentQ) handleSelectOption(currentQ.id, currentQ.options?.[1]?.id || 'B');
      } else if (['3', 'c', 'C'].includes(e.key)) {
        if (currentQ) handleSelectOption(currentQ.id, currentQ.options?.[2]?.id || 'C');
      } else if (['4', 'd', 'D'].includes(e.key)) {
        if (currentQ) handleSelectOption(currentQ.id, currentQ.options?.[3]?.id || 'D');
      } else if (['f', 'F'].includes(e.key)) {
        toggleFlagCurrentQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ, questions.length]);

  const toggleFlagCurrentQuestion = () => {
    if (!currentQ) return;
    setFlaggedQuestions(prev => {
      if (prev.includes(currentQ.id)) {
        return prev.filter(id => id !== currentQ.id);
      } else {
        return [...prev, currentQ.id];
      }
    });
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

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFocusMode(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFocusMode(false);
      }
    } catch (e) {
      setIsFocusMode(prev => !prev);
    }
  };

  const handleResetExamProgress = () => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {}
    
    const freshShuffled = shuffleAssignmentQuestionsAndOptions(assignment);
    setCurrentAssignment(freshShuffled);
    setAnswers({});
    setFlaggedQuestions([]);
    setCurrentIndex(0);
    setTimeLeft(totalSeconds);
    setTabSwitchCount(0);
    setViolationEvents([]);
    setShowResetConfirmModal(false);
    triggerAntiCheatToast('🔀 Đã làm mới đề thi và xáo trộn lại thứ tự câu hỏi!');
  };

  const handleForceAutoSubmit = () => {
    submitExam();
  };

  const submitExam = () => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {}

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const submittedAt = new Date().toISOString();
    const submission = GradingService.gradeSubmission({
      assignment: currentAssignment,
      studentAnswers: answers,
      studentName,
      classId,
      className,
      startedAt,
      submittedAt,
      tabSwitchCount,
      violationEvents,
      isShuffled: true
    });

    FirestoreService.saveResult(submission).catch((err) => {
      console.warn('Lỗi lưu kết quả bài thi lên Firestore:', err);
    });

    StorageService.saveSubmission(submission);
    onFinishExam(submission);
  };

  // Metrics
  const answeredCount = questions.filter(q => !!answers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedQuestions.length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100) || 0;

  // Timer format
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeCritical = totalSeconds > 0 && timeLeft <= 120;
  const isTimeWarning = totalSeconds > 0 && timeLeft <= 300 && timeLeft > 120;

  const getFontSizeClass = () => {
    if (fontSizeScale === 'large') return 'text-lg sm:text-2xl leading-relaxed';
    if (fontSizeScale === 'xlarge') return 'text-xl sm:text-3xl leading-loose';
    return 'text-base sm:text-xl leading-relaxed';
  };

  const isCurrentFlagged = currentQ ? flaggedQuestions.includes(currentQ.id) : false;

  // Cấu hình CSS Root linh hoạt để KHÓA CUỘN TRANG với chế độ PDF
  const rootContainerClasses = isPdfMode
    ? `h-screen overflow-hidden flex flex-col select-none transition-all ${
        isFocusMode
          ? 'fixed inset-0 z-50 bg-slate-950 text-slate-100'
          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
      }`
    : `min-h-screen flex flex-col justify-between select-none transition-all ${
        isFocusMode
          ? 'fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto'
          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-10'
      }`;

  return (
    <div className={rootContainerClasses} style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      
      {/* FLOATING ANTI-CHEAT WARNING TOAST */}
      {antiCheatToast && (
        <div className="fixed top-16 sm:top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-top-4 duration-200">
          <div className="bg-slate-900/95 text-white py-2.5 px-4 rounded-2xl shadow-2xl border border-rose-500/50 backdrop-blur-md flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <div className="w-8 h-8 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 leading-tight text-rose-200">
              {antiCheatToast.message}
            </div>
            <button
              onClick={() => setAntiCheatToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-save Draft Restore Toast */}
      {showDraftToast && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm bg-indigo-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-700 flex items-start space-x-3 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-emerald-300 mb-0.5">
              Đã khôi phục tiến trình làm bài!
            </p>
            <p className="text-slate-300">
              Nạp lại {answeredCount} câu đã làm, đề thi đã được xáo trộn chuẩn xác.
            </p>
          </div>
          <button
            onClick={() => setShowDraftToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP BAR / FOCUS HEADER */}
      <header
        className={`shrink-0 z-30 transition-colors border-b px-4 py-2.5 ${
          isFocusMode
            ? 'bg-slate-950/95 border-slate-800 backdrop-blur-md'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Title & Anti-Cheat Badge */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase ${
                    isFocusMode
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                  }`}
                >
                  Lớp {className}
                </span>
                <h1
                  className={`text-xs sm:text-base font-extrabold truncate ${
                    isFocusMode ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {currentAssignment.title}
                </h1>
              </div>

              {/* Anti-cheat status & Shuffled pill badge */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-[11px]">
                {/* Anti-cheat Monitor Pill */}
                <button
                  type="button"
                  onClick={() => setShowAntiCheatPolicyModal(true)}
                  title="Nhấp xem chính sách giám sát thi an toàn"
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    tabSwitchCount === 0
                      ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-400 animate-pulse'
                  }`}
                >
                  {tabSwitchCount === 0 ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Giám sát thi: 0 vi phạm</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>⚠️ Đã ghi nhận {tabSwitchCount} vi phạm</span>
                    </>
                  )}
                </button>

                {/* Shuffled badge */}
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[10px]">
                  <Shuffle className="w-2.5 h-2.5" />
                  <span>Đề ngẫu nhiên</span>
                </span>

                <span className="hidden sm:inline text-slate-400">•</span>
                <span className="hidden sm:inline truncate text-slate-500 dark:text-slate-400">
                  Thí sinh: <strong>{studentName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Timer & Submit */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Font scaling tool (chỉ hiện khi là đề text) */}
            {!isPdfMode && (
              <div
                className={`hidden lg:flex items-center rounded-xl p-0.5 border ${
                  isFocusMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <button
                  onClick={() => setFontSizeScale('normal')}
                  title="Cỡ chữ chuẩn"
                  className={`px-2 py-1 text-xs font-bold rounded-lg ${
                    fontSizeScale === 'normal'
                      ? isFocusMode
                        ? 'bg-slate-800 text-white'
                        : 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSizeScale('large')}
                  title="Cỡ chữ lớn"
                  className={`px-2 py-1 text-xs font-bold rounded-lg ${
                    fontSizeScale === 'large'
                      ? isFocusMode
                        ? 'bg-slate-800 text-white'
                        : 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  A+
                </button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Chuyển sang chế độ Sáng' : 'Bật chế độ Tối'}
              className={`p-2 rounded-xl text-xs border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            </button>

            {/* Focus Mode Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFocusMode ? 'Thoát chế độ tập trung' : 'Bật chế độ tập trung toàn màn hình'}
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                isFocusMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thoát</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Tập trung</span>
                </>
              )}
            </button>

            {/* Timer Counter */}
            {totalSeconds > 0 ? (
              <div
                className={`flex items-center space-x-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-base font-black border transition-colors shadow-xs ${
                  isTimeCritical
                    ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                    : isTimeWarning
                    ? 'bg-amber-500 border-amber-400 text-white'
                    : isFocusMode
                    ? 'bg-slate-900 border-slate-700 text-emerald-400'
                    : 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  {minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center text-xs text-slate-400 font-medium px-2 py-1 rounded-lg border border-slate-700">
                Tự do
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>


      {/* ========================================================================= */}
      {/* PHẦN RẼ NHÁNH GIAO DIỆN CHÍNH (MAIN CONTENT) */}
      {/* ========================================================================= */}
      {isPdfMode ? (
        
        // --- 1. GIAO DIỆN ĐỀ PDF (CHIA 2 CỘT) ---
        // SỬ DỤNG min-h-0 CHO FLEX-1 ĐỂ TRÁNH TRÀN CHIỀU CAO VÀ KÍCH HOẠT CUỘN ĐỘC LẬP
        <main className="w-full flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto border-x border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-h-0">
          
          {/* CỘT TRÁI (65%): Trình xem đề thi PDF */}
          <div className="w-full lg:w-[65%] h-1/2 lg:h-full relative border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-300 dark:bg-slate-950">
            <iframe 
              src={`${assignment.pdfUrl}#toolbar=0`} 
              className="w-full h-full border-none"
              title="Đề thi PDF"
            />
          </div>

          {/* CỘT PHẢI (35%): Phiếu điền đáp án Digital */}
          <div className="w-full lg:w-[35%] flex flex-col h-1/2 lg:h-full bg-white dark:bg-slate-900">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center shrink-0">
              <h2 className="font-extrabold text-slate-800 dark:text-slate-100">Phiếu Trả Lời Trắc Nghiệm</h2>
              <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-4 h-4" />
                Đã làm: {answeredCount}/{questions.length}
              </div>
            </div>
            
            {/* VÙNG CUỘN ĐỘC LẬP BÊN PHẢI */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {questions.map((q, index) => {
                  const qNum = index + 1;
                  const isCurrent = currentIndex === index;
                  
                  return (
                    <div 
                      key={q.id} 
                      onClick={() => setCurrentIndex(index)}
                      className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md ring-1 ring-indigo-500' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-500 dark:text-slate-400 text-sm">Câu {qNum}</span>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 justify-between">
                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                          const optId = (q.options && q.options[optIdx]) ? q.options[optIdx].id : letter;
                          const isSelected = answers[q.id] === optId;
                          
                          return (
                            <button
                              key={letter}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleSelectOption(q.id, optId);
                                setCurrentIndex(index);
                              }}
                              className={`flex-1 aspect-square max-h-10 rounded-xl text-sm font-extrabold border transition-all active:scale-90 ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900' 
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anti-cheat banner dưới cùng cột phải */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-500" /> Chế độ chống gian lận đang bật
              </span>
            </div>
          </div>
        </main>

      ) : (

        // --- 2. GIAO DIỆN ĐỀ TEXT (GIỮ NGUYÊN) ---
        <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: MAIN QUESTION CARD (lg:col-span-8 xl:col-span-9) */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              <div
                className={`rounded-3xl p-5 sm:p-8 shadow-xl border transition-all ${
                  isFocusMode
                    ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-indigo-950/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-slate-200/60 dark:shadow-none text-slate-900 dark:text-white'
                }`}
              >
                {/* Question Card Header */}
                <div
                  className={`flex items-center justify-between pb-4 border-b mb-6 ${
                    isFocusMode ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-md">
                      {currentIndex + 1}
                    </span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Câu {currentIndex + 1} / {questions.length}
                      </span>
                      <span className="text-xs text-indigo-500 font-semibold block">
                        {currentQ.points} điểm {currentQ.topicHint ? `• ${currentQ.topicHint}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Flag / Bookmark button */}
                  <button
                    type="button"
                    onClick={toggleFlagCurrentQuestion}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      isCurrentFlagged
                        ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
                        : isFocusMode
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-white' : ''}`} />
                    <span>{isCurrentFlagged ? 'Đã gắn cờ' : 'Gắn cờ câu này'}</span>
                  </button>
                </div>

                {/* Question Body Text */}
                <div 
                  className={`font-semibold mb-8 select-none ${getFontSizeClass()}`}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  <MathDisplay text={currentQ.question} />
                </div>

                {/* Options Grid (Randomized order A, B, C, D) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    
                    let optStyle = '';
                    if (isSelected) {
                      optStyle = isFocusMode
                        ? 'border-indigo-500 bg-indigo-950/60 shadow-lg ring-2 ring-indigo-500 text-white'
                        : 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-md ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200';
                    } else {
                      optStyle = isFocusMode
                        ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900 text-slate-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`flex items-center p-3.5 sm:p-5 rounded-2xl border-2 text-left transition-all relative cursor-pointer active:scale-[0.99] select-none ${optStyle}`}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      >
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm mr-3 shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md'
                              : isFocusMode
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          {opt.id}
                        </div>

                        <div className="flex-1 font-medium text-sm sm:text-base select-none">
                          <MathDisplay text={opt.text} />
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center ml-2 shrink-0 shadow-sm animate-in zoom-in-50">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Card Navigation */}
                <div
                  className={`flex items-center justify-between mt-8 pt-6 border-t ${
                    isFocusMode ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`flex items-center space-x-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      currentIndex === 0
                        ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500'
                        : isFocusMode
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 active:scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>CÂU TRƯỚC</span>
                  </button>

                  <div className="text-xs font-bold text-slate-400 hidden sm:block">
                    Tiến độ: <strong className="text-indigo-500 font-extrabold">{answeredCount}</strong>/{questions.length} câu ({progressPercent}%)
                  </div>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center space-x-1.5 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <span>CÂU TIẾP THEO</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="flex items-center space-x-1.5 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <Flag className="w-4 h-4" />
                      <span>NỘP BÀI THI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Anti-cheat and Reset shortcuts banner under question card */}
              <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs transition-colors ${
                isFocusMode
                  ? 'bg-slate-950 border-slate-800 text-slate-400'
                  : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Chế độ phòng thi an toàn: Khóa chuột phải &amp; copy text. Chuyển tab được ghi nhận.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="text-rose-500 hover:text-rose-600 hover:underline font-bold shrink-0 cursor-pointer"
                >
                  Làm lại từ đầu
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY QUESTION NAVIGATION GRID */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-20">
              <div
                className={`rounded-3xl p-4 sm:p-5 shadow-lg border transition-all ${
                  isFocusMode
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-slate-200/50 dark:shadow-none text-slate-900 dark:text-white'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                        Bảng câu hỏi
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Nhấp để chuyển câu nhanh
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs border border-indigo-100 dark:border-indigo-900">
                    {answeredCount}/{questions.length}
                  </span>
                </div>

                {/* Mini Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Status Color Legend */}
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-3.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span> Đã làm
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Gắn cờ
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></span> Chưa làm
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm border-2 border-indigo-500 ring-1 ring-indigo-400"></span> Đang xem
                  </span>
                </div>

                {/* Question Number Grid */}
                <div className="grid grid-cols-5 gap-1.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5 custom-scrollbar">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isFlagged = flaggedQuestions.includes(q.id);
                    const isCurrent = idx === currentIndex;

                    let btnClass = isFocusMode
                      ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700';

                    if (isAnswered) {
                      btnClass = 'bg-indigo-600 text-white font-black shadow-xs hover:bg-indigo-700';
                    }

                    if (isFlagged && !isAnswered) {
                      btnClass = 'bg-amber-500 text-white font-black shadow-xs ring-1 ring-amber-300 hover:bg-amber-600';
                    }

                    if (isCurrent) {
                      btnClass += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 font-black scale-105 border-2 border-indigo-600';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        title={`Câu ${idx + 1}: ${isAnswered ? 'Đã làm' : 'Chưa làm'}${isFlagged ? ' (Đã gắn cờ)' : ''}`}
                        className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative active:scale-95 ${btnClass}`}
                      >
                        <span>{idx + 1}</span>

                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center bg-amber-400 text-slate-950 rounded-full shadow-xs border border-white dark:border-slate-900">
                            <Flag className="w-1.5 h-1.5 fill-current" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Sidebar Quick Action: Submit Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>NỘP BÀI THI ({answeredCount}/{questions.length})</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* NÚT VÀ MENU ĐIỀU HƯỚNG TRÊN MOBILE (CHỈ HIỂN THỊ KHI LÀ ĐỀ TEXT)          */}
      {/* ========================================================================= */}
      {!isPdfMode && (
        <div className="lg:hidden fixed bottom-5 right-4 z-40">
          <button
            type="button"
            onClick={() => setShowMobileNav(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl border border-indigo-400/40 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="font-extrabold text-xs">Câu {currentIndex + 1}/{questions.length}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
              {answeredCount}/{questions.length}
            </span>
            {flaggedCount > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                <Flag className="w-2.5 h-2.5 fill-current" />
                {flaggedCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* MOBILE QUESTION NAVIGATION DRAWER */}
      {showMobileNav && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-xs p-0 sm:p-4 lg:hidden animate-in fade-in duration-150"
          onClick={() => setShowMobileNav(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Bảng điều hướng câu hỏi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chọn câu hỏi để chuyển đến ngay
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mb-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterNavTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
                  filterNavTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tất cả ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterNavTab('unanswered')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
                  filterNavTab === 'unanswered'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Chưa làm ({unansweredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterNavTab('flagged')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${
                  filterNavTab === 'flagged'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Gắn cờ ({flaggedCount})
              </button>
            </div>

            {/* Mobile Question Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 overflow-y-auto py-2 px-1 max-h-[45vh] custom-scrollbar">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = flaggedQuestions.includes(q.id);
                const isCurrent = idx === currentIndex;

                if (filterNavTab === 'unanswered' && isAnswered) return null;
                if (filterNavTab === 'flagged' && !isFlagged) return null;

                let btnClass = isFocusMode
                  ? 'bg-slate-900 text-slate-300 border border-slate-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

                if (isAnswered) {
                  btnClass = 'bg-indigo-600 text-white font-black shadow-xs';
                }
                if (isFlagged && !isAnswered) {
                  btnClass = 'bg-amber-500 text-white font-black shadow-xs ring-1 ring-amber-300';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 font-black scale-105 border-2 border-indigo-600';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobileNav(false);
                    }}
                    className={`h-11 rounded-2xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative active:scale-95 ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center bg-amber-400 text-slate-950 rounded-full shadow-xs border border-white dark:border-slate-900">
                        <Flag className="w-2 h-2 fill-current" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions inside drawer */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Đóng bảng
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileNav(false);
                  setShowSubmitModal(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CÁC MODAL (CẢNH BÁO, XÁC NHẬN) - CHUNG CHO CẢ PDF VÀ TEXT                 */}
      {/* ========================================================================= */}
      
      {showViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-500 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-300 dark:border-rose-800 shadow-inner">
              <ShieldAlert className="w-9 h-9 animate-bounce" />
            </div>

            <div className="inline-block px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-xs rounded-full border border-rose-300 mb-2 uppercase tracking-wider">
              ⚠️ Cảnh báo giám sát thi cử
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
              Phát hiện rời màn hình làm bài!
            </h3>

            <div className="my-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-left text-xs sm:text-sm space-y-2">
              <div className="flex items-center justify-between text-rose-900 dark:text-rose-200 font-extrabold">
                <span>Số lần vi phạm đã ghi nhận:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-sm font-black">
                  Lần {tabSwitchCount}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-xs">
                <strong>Chi tiết:</strong> {latestViolation?.reason || 'Học sinh chuyển tab trình duyệt hoặc thu nhỏ cửa sổ trong khi làm bài.'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                Thời gian ghi nhận: {latestViolation?.time || 'Vừa xong'}
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-left text-xs text-amber-900 dark:text-amber-200 mb-6">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300 mb-0.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                Quy định phòng thi trực tuyến:
              </p>
              <p className="text-[11px] leading-relaxed">
                Hệ thống tự động ghi nhật ký mọi thao tác chuyển tab, mở ứng dụng khác hoặc copy text. Toàn bộ lịch sử vi phạm sẽ được gửi trực tiếp đến giáo viên trong bảng kết quả chấm thi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowViolationModal(false)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              Tôi cam kết tiếp tục làm bài nghiêm túc
            </button>
          </div>
        </div>
      )}

      {showAntiCheatPolicyModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAntiCheatPolicyModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base">Hệ thống Giám sát Thi cử (Anti-Cheat)</h3>
              </div>
              <button
                onClick={() => setShowAntiCheatPolicyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-slate-600 dark:text-slate-300">
              <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <Shuffle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Trộn ngẫu nhiên (Shuffle)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Thứ tự câu hỏi và thứ tự các đáp án A, B, C, D được xáo trộn ngẫu nhiên riêng cho từng học sinh để chống chép bài.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <EyeOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Giám sát rời màn hình</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hệ thống tự động phát hiện và đếm số lần chuyển tab hoặc thu nhỏ trình duyệt để báo cáo giáo viên.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Khóa chuột phải & Copy text</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Vô hiệu hóa chuột phải, bôi đen và phím tắt Ctrl+C, Ctrl+V, F12 nhằm đảm bảo phòng thi bảo mật.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAntiCheatPolicyModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
              {unansweredCount > 0 ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              )}
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {unansweredCount > 0 ? 'Xác nhận nộp bài thi' : 'Sẵn sàng nộp bài!'}
            </h3>

            {unansweredCount > 0 ? (
              <div className="my-4 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl text-left text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  Bạn còn <span className="underline font-black text-rose-600">{unansweredCount} câu chưa làm</span>!
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Các câu chưa làm sẽ được tính là 0 điểm. Bạn có muốn quay lại kiểm tra không?
                </p>
              </div>
            ) : (
              <p className="my-4 text-sm text-slate-600 dark:text-slate-300">
                Bạn đã hoàn thành đầy đủ <strong className="text-emerald-600 dark:text-emerald-400">{questions.length}/{questions.length}</strong> câu hỏi. Hệ thống sẽ tự động chấm điểm và hiển thị kết quả chi tiết!
              </p>
            )}

            {tabSwitchCount > 0 && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-left text-xs text-rose-800 dark:text-rose-300">
                ⚠️ Ghi nhận <strong>{tabSwitchCount} lần rời màn hình</strong> sẽ được gửi kèm bài làm đến giáo viên.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tiếp tục làm
              </button>
              <button
                type="button"
                onClick={submitExam}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Làm lại từ đầu?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Thao tác này sẽ xóa toàn bộ đáp án, xáo trộn lại đề thi mới và đặt lại thời gian.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetExamProgress}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Xóa & Trộn lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
