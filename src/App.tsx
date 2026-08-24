import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { StorageService } from './services/storageService';
import { FirestoreService } from './services/firestoreService';
import { Assignment, ClassRoom, Submission } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Navbar } from './components/Navbar';
import { StudentProgressBar } from './components/StudentProgressBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { QRCodeModal } from './components/QRCodeModal';
import { HomePage } from './pages/HomePage';
import { GradeAssignmentsPage } from './pages/GradeAssignmentsPage';
import { TeacherLayout } from './pages/teacher/TeacherLayout';
import { StudentJoinPage } from './pages/student/StudentJoinPage';
import { StudentExamPage } from './pages/student/StudentExamPage';
import { StudentResultPage } from './pages/student/StudentResultPage';
import { LoginPage } from './pages/LoginPage';
import { useLearningProgressStore } from './store/useLearningProgressStore';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Persistent storage state
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Student exam taking flow state
  const [examSession, setExamSession] = useState<{
    assignment?: Assignment;
    studentName?: string;
    classId?: string;
    className?: string;
    submission?: Submission;
  }>({});

  // Share modal state
  const [shareAssignment, setShareAssignment] = useState<Assignment | null>(null);

  // Initialize and load data on mount
  useEffect(() => {
    StorageService.initDemoData();
    refreshAllData();

    // Check URL Hash for legacy/direct assignment join e.g. #assignment=TOAN6A1-8K4P
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('assignment=')) {
        const codeMatch = hash.match(/assignment=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          const code = decodeURIComponent(codeMatch[1]).trim().toUpperCase();
          navigate(`/join?code=${code}`);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const refreshAllData = async () => {
    // 1. Instant local read
    const localClasses = StorageService.getClasses();
    const localAssignments = StorageService.getAssignments();
    const localSubmissions = StorageService.getSubmissions();

    setClasses(localClasses);
    setAssignments(localAssignments);
    setSubmissions(localSubmissions);

    // 2. Fetch latest from Cloud Firestore
    try {
      const cloudExams = await FirestoreService.getExams();
      if (cloudExams && cloudExams.length > 0) {
        const map = new Map<string, Assignment>();
        localAssignments.forEach(a => map.set(a.assignmentCode.toUpperCase(), a));
        cloudExams.forEach(a => map.set(a.assignmentCode.toUpperCase(), a));
        const merged = Array.from(map.values());
        setAssignments(merged);
      }
    } catch (e) {
      console.warn('Syncing exams from Firestore:', e);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu cho Lớp 6, 7, 8, 9?')) {
      StorageService.resetAllData();
      refreshAllData();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  const handleStartExam = (
    assignment: Assignment,
    studentName: string,
    classId: string,
    className: string
  ) => {
    setExamSession({
      assignment,
      studentName,
      classId,
      className
    });
    // Update student name in zustand store
    if (studentName && studentName !== 'Học sinh') {
      useLearningProgressStore.getState().setStudentName(studentName);
    }
    navigate('/exam');
  };

  const handleFinishExam = (submission: Submission) => {
    refreshAllData();
    if (examSession.assignment) {
      // Record progress into Zustand persistent store
      useLearningProgressStore.getState().recordSubmission(submission, examSession.assignment);
    }
    setExamSession(prev => ({
      ...prev,
      submission
    }));
    navigate('/result');
  };

  const handleRetakeExam = () => {
    if (examSession.assignment && examSession.studentName) {
      navigate('/exam');
    } else {
      navigate('/join');
    }
  };

  const handleTestAssignmentFromTeacher = (assignment: Assignment) => {
    setExamSession({
      assignment,
      studentName: 'Giáo viên (Làm thử)',
      classId: assignment.classId,
      className: assignment.className || 'Tất cả học sinh'
    });
    navigate('/exam');
  };

  // Check if we are inside an ongoing active exam (to hide progress bar during test for distraction-free)
  const isTakingExam = location.pathname === '/exam';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar onResetData={handleResetData} />

      {/* Top Zustand Learning Progress Bar (Sticky / Header Status Bar) */}
      {!isTakingExam && (
        <StudentProgressBar assignments={assignments} />
      )}

      {/* Main Page Routing */}
      <main className="flex-1 pb-20 md:pb-6">
        <Routes>
          {/* Home Page with 4 Grade Cards */}
          <Route 
            path="/" 
            element={<HomePage assignments={assignments} />} 
          />

          {/* Login Page */}
          <Route 
            path="/login" 
            element={<LoginPage />} 
          />

          {/* Specific Grade Assignments Page */}
          <Route
            path="/grade/:gradeId"
            element={
              <GradeAssignmentsPage
                assignments={assignments}
                classes={classes}
                onRefresh={refreshAllData}
                onTestAssignment={handleTestAssignmentFromTeacher}
              />
            }
          />

          {/* Student Join / Enter Code Page */}
          <Route
            path="/join"
            element={<StudentJoinPage onStartExam={handleStartExam} />}
          />

          {/* Student Active Exam Page */}
          <Route
            path="/exam"
            element={
              examSession.assignment ? (
                <StudentExamPage
                  assignment={examSession.assignment}
                  studentName={examSession.studentName || 'Học sinh'}
                  classId={examSession.classId || 'other'}
                  className={examSession.className || 'Tự do'}
                  onFinishExam={handleFinishExam}
                />
              ) : (
                <Navigate to="/join" replace />
              )
            }
          />

          {/* Student Result & Review Page */}
          <Route
            path="/result"
            element={
              examSession.submission && examSession.assignment ? (
                <StudentResultPage
                  submission={examSession.submission}
                  assignment={examSession.assignment}
                  onRetake={handleRetakeExam}
                  onGoHome={() => {
                    setExamSession({});
                    navigate('/');
                  }}
                />
              ) : (
                <Navigate to="/join" replace />
              )
            }
          />

          {/* Protected Teacher Portal */}
          <Route
            path="/teacher/*"
            element={
              <PrivateRoute>
                <TeacherLayout
                  classes={classes}
                  assignments={assignments}
                  submissions={submissions}
                  onRefreshData={refreshAllData}
                  onOpenShare={(asg) => setShareAssignment(asg)}
                  onTestAssignment={handleTestAssignmentFromTeacher}
                  onResetData={handleResetData}
                />
              </PrivateRoute>
            }
          />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* PWA Add to Home Screen Prompt Banner */}
      <PWAInstallBanner />

      {/* Mobile Native-Style Bottom Navigation Bar (Hidden during active test for focus) */}
      {!isTakingExam && (
        <MobileBottomNav 
          onOpenProgress={() => useLearningProgressStore.getState().setProgressModalOpen(true)} 
        />
      )}

      {/* QR Code & Share Modal */}
      {shareAssignment && (
        <QRCodeModal
          assignment={shareAssignment}
          isOpen={!!shareAssignment}
          onClose={() => setShareAssignment(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

