/**
 * Storage Service for TOÁN THCS
 * Quản lý lưu trữ dữ liệu lớp học, bài tập, câu hỏi, kết quả học sinh.
 * Dữ liệu mẫu được chia thành 4 thư mục riêng biệt cho Khối 6, 7, 8, 9 trong /src/data.
 */

import { ClassRoom, Assignment, Submission } from '../types';
import { 
  INITIAL_ALL_ASSIGNMENTS,
  GRADE6_ASSIGNMENTS,
  GRADE7_ASSIGNMENTS,
  GRADE8_ASSIGNMENTS,
  GRADE9_ASSIGNMENTS
} from '../data';

const STORAGE_KEYS = {
  CLASSES: 'toan_thcs_classes_v4',
  ASSIGNMENTS: 'toan_thcs_assignments_v4',
  SUBMISSIONS: 'toan_thcs_submissions_v4',
  TEACHER_PROFILE: 'toan_thcs_teacher_profile',
  INITIALIZED: 'toan_thcs_initialized_v4'
};

export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class_6a1',
    name: '6A1',
    grade: '6',
    academicYear: '2026-2027',
    createdAt: '2026-08-01T08:00:00Z',
    students: [
      { id: 'st_1', name: 'Nguyễn Văn An', classId: 'class_6a1', code: 'HS01', gender: 'Nam' },
      { id: 'st_2', name: 'Trần Thị Bình', classId: 'class_6a1', code: 'HS02', gender: 'Nữ' },
      { id: 'st_3', name: 'Lê Hoàng Cường', classId: 'class_6a1', code: 'HS03', gender: 'Nam' },
      { id: 'st_4', name: 'Phạm Minh Đức', classId: 'class_6a1', code: 'HS04', gender: 'Nam' },
      { id: 'st_5', name: 'Đỗ Ngọc Hân', classId: 'class_6a1', code: 'HS05', gender: 'Nữ' },
      { id: 'st_6', name: 'Vũ Gia Huy', classId: 'class_6a1', code: 'HS06', gender: 'Nam' },
      { id: 'st_7', name: 'Hoàng Mai Linh', classId: 'class_6a1', code: 'HS07', gender: 'Nữ' },
      { id: 'st_8', name: 'Bùi Quốc Nam', classId: 'class_6a1', code: 'HS08', gender: 'Nam' },
      { id: 'st_9', name: 'Đặng Quỳnh Như', classId: 'class_6a1', code: 'HS09', gender: 'Nữ' },
      { id: 'st_10', name: 'Trương Phúc Thịnh', classId: 'class_6a1', code: 'HS10', gender: 'Nam' }
    ]
  },
  {
    id: 'class_7a2',
    name: '7A2',
    grade: '7',
    academicYear: '2026-2027',
    createdAt: '2026-08-01T08:00:00Z',
    students: [
      { id: 'st_71', name: 'Nguyễn Tiến Đạt', classId: 'class_7a2', code: 'HS01', gender: 'Nam' },
      { id: 'st_72', name: 'Lâm Khánh Chi', classId: 'class_7a2', code: 'HS02', gender: 'Nữ' },
      { id: 'st_73', name: 'Võ Minh Quân', classId: 'class_7a2', code: 'HS03', gender: 'Nam' }
    ]
  },
  {
    id: 'class_8a1',
    name: '8A1',
    grade: '8',
    academicYear: '2026-2027',
    createdAt: '2026-08-01T08:00:00Z',
    students: [
      { id: 'st_81', name: 'Hà Bảo Ngọc', classId: 'class_8a1', code: 'HS01', gender: 'Nữ' },
      { id: 'st_82', name: 'Phan Tuấn Kiệt', classId: 'class_8a1', code: 'HS02', gender: 'Nam' }
    ]
  },
  {
    id: 'class_9a3',
    name: '9A3',
    grade: '9',
    academicYear: '2026-2027',
    createdAt: '2026-08-01T08:00:00Z',
    students: [
      { id: 'st_91', name: 'Trần Đăng Khoa', classId: 'class_9a3', code: 'HS01', gender: 'Nam' },
      { id: 'st_92', name: 'Lê Thuỳ Trang', classId: 'class_9a3', code: 'HS02', gender: 'Nữ' }
    ]
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = INITIAL_ALL_ASSIGNMENTS;

// Sample demo submissions
const sampleG6Questions = GRADE6_ASSIGNMENTS[0]?.questions || [];
export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_demo_1',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số & Các phép tính',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Nguyễn Văn An',
    studentId: 'st_1',
    totalScore: 9.5,
    maxScore: 10,
    correctCount: sampleG6Questions.length > 0 ? sampleG6Questions.length - 1 : 11,
    wrongCount: 1,
    unansweredCount: 0,
    totalQuestions: sampleG6Questions.length || 12,
    timeSpentSeconds: 754,
    startedAt: '2026-08-22T08:00:00Z',
    submittedAt: '2026-08-22T08:12:34Z',
    answers: sampleG6Questions.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: idx === 6 ? 'A' : q.correctAnswer,
      isCorrect: idx !== 6,
      pointsEarned: idx === 6 ? 0 : q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_2',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số & Các phép tính',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Đỗ Ngọc Hân',
    studentId: 'st_5',
    totalScore: 10.0,
    maxScore: 10,
    correctCount: sampleG6Questions.length || 12,
    wrongCount: 0,
    unansweredCount: 0,
    totalQuestions: sampleG6Questions.length || 12,
    timeSpentSeconds: 615,
    startedAt: '2026-08-22T10:00:00Z',
    submittedAt: '2026-08-22T10:10:15Z',
    answers: sampleG6Questions.map(q => ({
      questionId: q.id,
      selectedAnswer: q.correctAnswer,
      isCorrect: true,
      pointsEarned: q.points,
      maxPoints: q.points
    }))
  }
];

export class StorageService {
  /**
   * Khởi tạo dữ liệu mẫu nếu chưa có
   */
  static initDemoData(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  /**
   * Reset toàn bộ dữ liệu về mẫu ban đầu
   */
  static resetAllData(): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // --- CLASSES ---
  static getClasses(): ClassRoom[] {
    this.initDemoData();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data ? JSON.parse(data) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  }

  static getClassById(classId: string): ClassRoom | undefined {
    return this.getClasses().find(c => c.id === classId);
  }

  static saveClass(classRoom: ClassRoom): void {
    const classes = this.getClasses();
    const index = classes.findIndex(c => c.id === classRoom.id);
    if (index >= 0) {
      classes[index] = classRoom;
    } else {
      classes.unshift(classRoom);
    }
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  static deleteClass(classId: string): void {
    const classes = this.getClasses().filter(c => c.id !== classId);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  // --- ASSIGNMENTS ---
  static getAssignments(): Assignment[] {
    this.initDemoData();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      return data ? JSON.parse(data) : INITIAL_ASSIGNMENTS;
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  }

  static getAssignmentsByGrade(grade: string): Assignment[] {
    return this.getAssignments().filter(a => a.grade === grade);
  }

  static getAssignmentById(id: string): Assignment | undefined {
    return this.getAssignments().find(a => a.id === id);
  }

  static getAssignmentByCode(code: string): Assignment | undefined {
    if (!code) return undefined;
    const cleanCode = code.trim().toUpperCase();
    return this.getAssignments().find(a => a.assignmentCode.toUpperCase() === cleanCode);
  }

  static saveAssignment(assignment: Assignment): void {
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      assignments[index] = assignment;
    } else {
      assignments.unshift(assignment);
    }
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  static deleteAssignment(assignmentId: string): void {
    const assignments = this.getAssignments().filter(a => a.id !== assignmentId);
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  // --- SUBMISSIONS ---
  static getSubmissions(): Submission[] {
    this.initDemoData();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  }

  static getSubmissionsByAssignment(assignmentId: string): Submission[] {
    return this.getSubmissions().filter(s => s.assignmentId === assignmentId);
  }

  static saveSubmission(submission: Submission): void {
    const submissions = this.getSubmissions();
    submissions.unshift(submission);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  /**
   * Tạo mã bài tập ngẫu nhiên duy nhất, ví dụ: TOAN6A1-8K4P
   */
  static generateAssignmentCode(grade: string, className: string): string {
    const cleanClass = (className || `K${grade}`).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return `TOAN${cleanClass}-${rand}`;
  }
}
