import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { Assignment, ClassRoom, Submission } from './types';
import { Navbar } from './components/Navbar';
import { QRCodeModal } from './components/QRCodeModal';
import { HomePage } from './pages/HomePage';
import { TeacherLayout } from './pages/teacher/TeacherLayout';
import { StudentJoinPage } from './pages/student/StudentJoinPage';
import { StudentExamPage } from './pages/student/StudentExamPage';
import { StudentResultPage } from './pages/student/StudentResultPage';

export default function App() {
  // App view state
  const [currentRole, setCurrentRole] = useState<'home' | 'teacher' | 'student'>('home');
  const [studentExamState, setStudentExamState] = useState<{
    status: 'join' | 'taking' | 'result';
    activeAssignment?: Assignment;
    studentName?: string;
    classId?: string;
    className?: string;
    submission?: Submission;
    initialCode?: string;
  }>({ status: 'join' });

  // Persistent storage state
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Share modal state
  const [shareAssignment, setShareAssignment] = useState<Assignment | null>(null);

  // Initialize data on mount
  useEffect(() => {
    StorageService.initDemoData();
    refreshAllData();

    // Check URL Hash for direct assignment join: #assignment=TOAN6A1-8K4P
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('assignment=')) {
        const codeMatch = hash.match(/assignment=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          const code = decodeURIComponent(codeMatch[1]).trim().toUpperCase();
          setCurrentRole('student');
          setStudentExamState({
            status: 'join',
            initialCode: code
          });
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const refreshAllData = () => {
    setClasses(StorageService.getClasses());
    setAssignments(StorageService.getAssignments());
    setSubmissions(StorageService.getSubmissions());
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu? (Lớp 6A1, 20 câu phân số, bài nộp thử nghiệm)')) {
      StorageService.resetAllData();
      refreshAllData();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  const handleSelectRole = (role: 'home' | 'teacher' | 'student') => {
    setCurrentRole(role);
    if (role === 'student') {
      setStudentExamState(prev => ({ ...prev, status: 'join' }));
    }
  };

  const handleEnterCodeFromHome = (code: string) => {
    setCurrentRole('student');
    setStudentExamState({
      status: 'join',
      initialCode: code
    });
  };

  const handleStartExam = (
    assignment: Assignment,
    studentName: string,
    classId: string,
    className: string
  ) => {
    setStudentExamState({
      status: 'taking',
      activeAssignment: assignment,
      studentName,
      classId,
      className
    });
  };

  const handleFinishExam = (submission: Submission) => {
    refreshAllData();
    setStudentExamState(prev => ({
      ...prev,
      status: 'result',
      submission
    }));
  };

  const handleRetakeExam = () => {
    if (studentExamState.activeAssignment && studentExamState.studentName) {
      setStudentExamState(prev => ({
        ...prev,
        status: 'taking'
      }));
    } else {
      setStudentExamState({ status: 'join' });
    }
  };

  const handleTestAssignmentFromTeacher = (assignment: Assignment) => {
    setCurrentRole('student');
    setStudentExamState({
      status: 'taking',
      activeAssignment: assignment,
      studentName: 'Giáo viên (Chế độ làm thử)',
      classId: assignment.classId,
      className: assignment.className || 'Toàn khối'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        onResetData={handleResetData}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {currentRole === 'home' && (
          <HomePage
            assignments={assignments}
            onSelectRole={handleSelectRole}
            onEnterCode={handleEnterCodeFromHome}
          />
        )}

        {currentRole === 'teacher' && (
          <TeacherLayout
            classes={classes}
            assignments={assignments}
            submissions={submissions}
            onRefreshData={refreshAllData}
            onOpenShare={(asg) => setShareAssignment(asg)}
            onTestAssignment={handleTestAssignmentFromTeacher}
            onResetData={handleResetData}
          />
        )}

        {currentRole === 'student' && (
          <div>
            {studentExamState.status === 'join' && (
              <StudentJoinPage
                initialCode={studentExamState.initialCode}
                onStartExam={handleStartExam}
              />
            )}

            {studentExamState.status === 'taking' && studentExamState.activeAssignment && (
              <StudentExamPage
                assignment={studentExamState.activeAssignment}
                studentName={studentExamState.studentName || 'Học sinh'}
                classId={studentExamState.classId || 'other'}
                className={studentExamState.className || 'Tự do'}
                onFinishExam={handleFinishExam}
              />
            )}

            {studentExamState.status === 'result' &&
              studentExamState.submission &&
              studentExamState.activeAssignment && (
                <StudentResultPage
                  submission={studentExamState.submission}
                  assignment={studentExamState.activeAssignment}
                  onRetake={handleRetakeExam}
                  onGoHome={() => {
                    setCurrentRole('home');
                    setStudentExamState({ status: 'join' });
                  }}
                />
              )}
          </div>
        )}
      </div>

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
