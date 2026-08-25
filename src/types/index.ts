/**
 * Data Models for TOÁN THCS – Giao bài & Luyện tập
 */

export type GradeLevel = '6' | '7' | '8' | '9';

export interface Student {
  id: string;
  name: string;
  classId: string;
  code?: string; // Student ID e.g. "HS01"
  gender?: 'Nam' | 'Nữ';
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "6A1", "7A2"
  grade: GradeLevel;
  academicYear: string;
  students: Student[];
  createdAt: string;
}

export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false';

export interface QuestionOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  id: string;
  order: number;
  question: string; // Content, can contain math notation
  type: QuestionType;
  options: QuestionOption[]; // e.g. [{id: 'A', text: '1/2'}, {id: 'B', text: '5/4'}, ...]
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' (or text for short_answer)
  points: number; // Điểm câu hỏi (mặc định e.g. 0.5 điểm hoặc 1 điểm)
  explanation?: string; // Lời giải chi tiết
  topicHint?: string; // e.g. "Quy đồng mẫu số", "Rút gọn phân số"
}

// ==========================================
// MỚI: BẢNG DỮ LIỆU KHO ĐỀ (EXAM TEMPLATE)
// ==========================================
export interface ExamTemplate {
  id: string;
  title: string;
  grade: GradeLevel;
  topic: string;
  questions: Question[];
  pdfUrl?: string; // Đường dẫn file PDF gốc trên Firebase Storage (để sau này làm màn hình chia đôi)
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// CẬP NHẬT: BÀI TẬP ĐÃ GIAO (ASSIGNMENT)
// ==========================================
export interface Assignment {
  id: string;
  title: string;
  grade: GradeLevel;
  topic: string;
  classId: string; // Target class ID (or 'all')
  className?: string; // cached name
  templateId?: string; // MỚI: ID của đề mẫu trong Kho Đề (nếu bài tập này được tạo từ Kho)
  pdfUrl?: string; // MỚI: Đường dẫn file PDF gốc để hiển thị cho học sinh xem đề
  questions: Question[];
  durationMinutes: number; // 0 = unlimited, >0 = minutes limit
  deadline: string; // ISO date string or YYYY-MM-DD
  allowViewResult: boolean; // Whether students can view score and answers immediately after submitting
  assignmentCode: string; // e.g. "TOAN6A1-8K4P"
  createdAt: string;
  isPublished: boolean;
}

export interface ViolationEvent {
  timestamp: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'context_menu' | 'copy_attempt';
  description: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedAnswer: string; // 'A', 'B', 'C', 'D' or text
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  classId: string;
  className: string;
  studentName: string;
  studentId?: string;
  answers: StudentAnswer[];
  totalScore: number; // e.g. 8.5
  maxScore: number; // e.g. 10.0
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number; // Thời gian làm bài
  startedAt: string;
  submittedAt: string;
  // Anti-cheat monitoring fields
  tabSwitchCount?: number;
  violationEvents?: ViolationEvent[];
  isShuffled?: boolean;
}

export interface QuestionAnalysis {
  questionId: string;
  order: number;
  questionText: string;
  correctAnswer: string;
  totalResponses: number;
  correctCount: number;
  wrongCount: number;
  accuracyRate: number; // 0 to 100%
  optionDistribution: Record<string, number>; // { 'A': 10, 'B': 2, 'C': 18, 'D': 1 }
  topicHint?: string;
}

export interface AssignmentStats {
  assignmentId: string;
  totalAssigned: number;
  submittedCount: number;
  unsubmittedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  questionAnalyses: QuestionAnalysis[];
  mostMissedQuestions: QuestionAnalysis[];
}
