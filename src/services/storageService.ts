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
import { FirestoreService } from './firestoreService';

const STORAGE_KEYS = {
  CLASSES: 'toan_thcs_classes_v4',
  ASSIGNMENTS: 'toan_thcs_assignments_v4',
  SUBMISSIONS: 'toan_thcs_submissions_v4',
  TEACHER_PROFILE: 'toan_thcs_teacher_profile',
  INITIALIZED: 'toan_thcs_initialized_v4',
  DELETED_ASSIGNMENT_KEYS: 'toan_thcs_deleted_assignment_keys_v4'
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

  /**
   * Xóa toàn bộ dữ liệu mẫu (các đề kiểm tra, lớp học và kết quả nộp bài mẫu).
   * Các bài tập, đề kiểm tra hoặc lớp học do Thầy/Cô tự tạo sẽ được giữ lại an toàn.
   */
  /**
   * Lấy danh sách ID và Mã đề đã bị người dùng xóa vĩnh viễn
   */
  static getDeletedAssignmentKeys(): Set<string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_ASSIGNMENT_KEYS);
      if (!data) return new Set<string>();
      const list = JSON.parse(data);
      return new Set<string>(Array.isArray(list) ? list : []);
    } catch {
      return new Set<string>();
    }
  }

  /**
   * Đánh dấu ID hoặc Mã đề vào danh sách đã xóa để ngăn chặn sync kéo ngược lại từ Firestore
   */
  static markAssignmentAsDeleted(id?: string, code?: string): void {
    try {
      const set = this.getDeletedAssignmentKeys();
      if (id) {
        set.add(id);
      }
      if (code) {
        const raw = code.trim().toUpperCase();
        set.add(raw);
        set.add(raw.replace(/\s+/g, ''));
        set.add(raw.replace(/\s*-\s*/g, '-'));
      }
      localStorage.setItem(STORAGE_KEYS.DELETED_ASSIGNMENT_KEYS, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.warn('Lỗi ghi DELETED_ASSIGNMENT_KEYS:', e);
    }
  }

  /**
   * Gỡ bỏ đánh dấu xóa khi người dùng cố ý tạo mới hoặc lưu đề thi với mã đó
   */
  static unmarkAssignmentAsDeleted(id?: string, code?: string): void {
    try {
      const set = this.getDeletedAssignmentKeys();
      if (id) set.delete(id);
      if (code) {
        const raw = code.trim().toUpperCase();
        set.delete(raw);
        set.delete(raw.replace(/\s+/g, ''));
        set.delete(raw.replace(/\s*-\s*/g, '-'));
      }
      localStorage.setItem(STORAGE_KEYS.DELETED_ASSIGNMENT_KEYS, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.warn('Lỗi bỏ đánh dấu DELETED_ASSIGNMENT_KEYS:', e);
    }
  }

  /**
   * Xóa toàn bộ dữ liệu mẫu (các đề kiểm tra, lớp học và kết quả nộp bài mẫu).
   * Các bài tập, đề kiểm tra hoặc lớp học do Thầy/Cô tự tạo sẽ được giữ lại an toàn.
   */
  static clearDemoData(): { deletedAssignments: number; deletedClasses: number; deletedSubmissions: number } {
    this.initDemoData();

    // Tập hợp ID các đề mẫu gốc
    const sampleAssignmentIds = new Set(INITIAL_ALL_ASSIGNMENTS.map(a => a.id));
    const isSampleAssignment = (a: Assignment) =>
      sampleAssignmentIds.has(a.id) ||
      a.id.startsWith('asg_toan6_') ||
      a.id.startsWith('asg_toan7_') ||
      a.id.startsWith('asg_toan8_') ||
      a.id.startsWith('asg_toan9_') ||
      (a.assignmentCode && (
        a.assignmentCode.includes('EUJ9') ||
        a.assignmentCode.includes('Y973') ||
        a.assignmentCode.includes('K74Z') ||
        a.assignmentCode.includes('FLMH')
      ));

    // Tập hợp ID các lớp mẫu gốc
    const sampleClassIds = new Set(INITIAL_CLASSES.map(c => c.id));
    const isSampleClass = (c: ClassRoom) =>
      sampleClassIds.has(c.id) ||
      ['class_6a1', 'class_7a2', 'class_8a1', 'class_9a3'].includes(c.id);

    // Dữ liệu hiện tại
    const currentAssignments = this.getAssignments();
    const currentClasses = this.getClasses();
    const currentSubmissions = this.getSubmissions();

    // Đánh dấu các đề mẫu vào blacklist để không bị Firestore sync kéo lại
    currentAssignments.filter(isSampleAssignment).forEach(a => {
      this.markAssignmentAsDeleted(a.id, a.assignmentCode);
    });

    // Lọc bỏ toàn bộ dữ liệu mẫu
    const remainingAssignments = currentAssignments.filter(a => !isSampleAssignment(a));
    const remainingClasses = currentClasses.filter(c => !isSampleClass(c));
    const remainingSubmissions = currentSubmissions.filter(s => 
      !s.id.startsWith('sub_demo_') && !isSampleAssignment({ id: s.assignmentId } as any)
    );

    const deletedAssignments = currentAssignments.length - remainingAssignments.length;
    const deletedClasses = currentClasses.length - remainingClasses.length;
    const deletedSubmissions = currentSubmissions.length - remainingSubmissions.length;

    // Lưu lại vào LocalStorage
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(remainingClasses));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(remainingAssignments));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(remainingSubmissions));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    return {
      deletedAssignments,
      deletedClasses,
      deletedSubmissions
    };
  }

  /**
   * Xóa toàn bộ dữ liệu mẫu bất đồng bộ (xóa cả LocalStorage và dọn sạch trên Cloud Firestore)
   */
  static async clearDemoDataAsync(): Promise<{ deletedAssignments: number; deletedClasses: number; deletedSubmissions: number }> {
    const currentAssignments = this.getAssignments();
    const sampleAssignmentIds = new Set(INITIAL_ALL_ASSIGNMENTS.map(a => a.id));
    const isSampleAssignment = (a: Assignment) =>
      sampleAssignmentIds.has(a.id) ||
      a.id.startsWith('asg_toan6_') ||
      a.id.startsWith('asg_toan7_') ||
      a.id.startsWith('asg_toan8_') ||
      a.id.startsWith('asg_toan9_') ||
      (a.assignmentCode && (
        a.assignmentCode.includes('EUJ9') ||
        a.assignmentCode.includes('Y973') ||
        a.assignmentCode.includes('K74Z') ||
        a.assignmentCode.includes('FLMH')
      ));

    const sampleAssignments = currentAssignments.filter(isSampleAssignment);
    const result = this.clearDemoData();

    // Xóa ngầm trên Cloud Firestore cho từng đề mẫu
    for (const a of sampleAssignments) {
      try {
        await FirestoreService.deleteExam(a.id, a.assignmentCode);
      } catch (err) {
        console.warn('Lỗi khi xóa đề mẫu trên Firestore:', err);
      }
    }

    return result;
  }

  // --- CLASSES ---
  static getClasses(): ClassRoom[] {
    this.initDemoData();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data !== null ? JSON.parse(data) : INITIAL_CLASSES;
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
    const deletedKeys = this.getDeletedAssignmentKeys();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      const rawList: Assignment[] = data !== null ? JSON.parse(data) : INITIAL_ASSIGNMENTS;
      if (!Array.isArray(rawList)) return [];
      return rawList.filter(a => {
        const c = (a.assignmentCode || '').replace(/\s+/g, '').toUpperCase();
        return !deletedKeys.has(a.id) && !deletedKeys.has(c);
      });
    } catch {
      return [];
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
    this.unmarkAssignmentAsDeleted(assignment.id, assignment.assignmentCode);
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      assignments[index] = assignment;
    } else {
      assignments.unshift(assignment);
    }
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  /**
   * Xóa đề thi cục bộ và ghi vào danh sách đã xóa
   */
  static deleteAssignment(assignmentId: string, assignmentCode?: string): void {
    this.markAssignmentAsDeleted(assignmentId, assignmentCode);
    const deletedKeys = this.getDeletedAssignmentKeys();
    const assignments = this.getAssignments().filter(a => {
      const c = (a.assignmentCode || '').replace(/\s+/g, '').toUpperCase();
      return a.id !== assignmentId && !deletedKeys.has(a.id) && !deletedKeys.has(c);
    });
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  /**
   * Xóa đề thi đồng bộ cả trên LocalStorage và Cloud Firestore vĩnh viễn
   */
  static async deleteAssignmentAsync(assignmentId: string, assignmentCode?: string): Promise<void> {
    this.deleteAssignment(assignmentId, assignmentCode);
    try {
      await FirestoreService.deleteExam(assignmentId, assignmentCode);
    } catch (e) {
      console.warn('Lỗi khi xóa đề thi trên Firestore:', e);
    }
  }

  /**
   * Xóa tất cả các bài tập hiện có (cả Local và Cloud)
   */
  static async clearAllAssignmentsAsync(assignmentsToClear: Assignment[]): Promise<void> {
    for (const a of assignmentsToClear) {
      this.deleteAssignment(a.id, a.assignmentCode);
      try {
        await FirestoreService.deleteExam(a.id, a.assignmentCode);
      } catch {}
    }
  }

  // --- SUBMISSIONS ---
  static getSubmissions(): Submission[] {
    this.initDemoData();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return data !== null ? JSON.parse(data) : INITIAL_SUBMISSIONS;
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

  // ==========================================
  // MỚI: QUẢN LÝ CUỘC THI TRỰC TUYẾN (CONTESTS)
  // ==========================================
  static getContests(): import('../types').Contest[] {
    try {
      const data = localStorage.getItem('toan_thcs_contests_v4');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getContestById(id: string): import('../types').Contest | null {
    const list = this.getContests();
    return list.find(c => c.id === id || c.code.toUpperCase() === id.toUpperCase()) || null;
  }

  static getContestByCode(code: string): import('../types').Contest | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const list = this.getContests();
    return list.find(c => c.code.trim().toUpperCase() === clean || c.id === clean) || null;
  }

  static saveContest(contest: import('../types').Contest): void {
    const list = this.getContests();
    const idx = list.findIndex(c => c.id === contest.id || c.code.toUpperCase() === contest.code.toUpperCase());
    if (idx >= 0) {
      list[idx] = contest;
    } else {
      list.unshift(contest);
    }
    localStorage.setItem('toan_thcs_contests_v4', JSON.stringify(list));
  }

  static deleteContest(contestId: string): void {
    const list = this.getContests().filter(c => c.id !== contestId && c.code !== contestId);
    localStorage.setItem('toan_thcs_contests_v4', JSON.stringify(list));
  }

  static getContestSubmissions(contestId?: string): import('../types').ContestSubmission[] {
    try {
      const data = localStorage.getItem('toan_thcs_contest_submissions_v4');
      const list: import('../types').ContestSubmission[] = data ? JSON.parse(data) : [];
      if (contestId) {
        return list.filter(s => s.contestId === contestId || s.contestCode.toUpperCase() === contestId.toUpperCase());
      }
      return list;
    } catch {
      return [];
    }
  }

  static saveContestSubmission(submission: import('../types').ContestSubmission): void {
    const list = this.getContestSubmissions();
    const idx = list.findIndex(s => s.id === submission.id);
    if (idx >= 0) {
      list[idx] = submission;
    } else {
      list.unshift(submission);
    }
    localStorage.setItem('toan_thcs_contest_submissions_v4', JSON.stringify(list));
  }

  /**
   * Sinh mã cuộc thi ngẫu nhiên duy nhất, ví dụ: THI7-8K4P
   */
  static generateContestCode(grade: string): string {
    const randomChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return `THI${grade}-${rand}`;
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
