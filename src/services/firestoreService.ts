import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from '../firebase';
import { Assignment, Submission, ClassRoom, ExamTemplate } from '../types';

export const EXAMS_COLLECTION = 'exams';
export const RESULTS_COLLECTION = 'results';
export const CLASSES_COLLECTION = 'classes';
export const EXAM_TEMPLATES_COLLECTION = 'exam_templates'; // MỚI: Collection cho Kho Đề

export class FirestoreService {
  /**
   * 1. Lưu đề thi mới hoặc cập nhật đề thi vào Firestore collection "exams"
   */
  static async saveExam(
    assignment: Assignment, 
    teacherUser?: { uid: string; email?: string | null; displayName?: string | null }
  ): Promise<void> {
    try {
      const examDocRef = doc(db, EXAMS_COLLECTION, assignment.id);
       
      const payload: any = {
        ...assignment,
        assignmentCode: assignment.assignmentCode.toUpperCase().trim(),
        updatedAt: new Date().toISOString()
      };

      if (teacherUser) {
        payload.teacherId = teacherUser.uid;
        payload.teacherEmail = teacherUser.email || '';
        payload.teacherName = teacherUser.displayName || 'Giáo viên';
      }

      await setDoc(examDocRef, payload, { merge: true });
      console.log(`[Firestore] Đã lưu đề thi ${assignment.id} (${assignment.assignmentCode}) lên Cloud Firestore.`);
    } catch (error) {
      console.error('[Firestore Error] Không thể lưu đề thi lên Firestore:', error);
      throw error;
    }
  }

  /**
   * 2. Tìm kiếm đề thi theo "Mã đề" (assignmentCode) trên Firestore
   */
  static async getExamByCode(code: string): Promise<Assignment | null> {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
     
    try {
      const q = query(
        collection(db, EXAMS_COLLECTION),
        where('assignmentCode', '==', cleanCode)
      );

      const querySnapshot = await getDocs(q);
       
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data() as Assignment;
        return {
          ...docData,
          id: querySnapshot.docs[0].id
        };
      }

      const docRef = doc(db, EXAMS_COLLECTION, cleanCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          ...(docSnap.data() as Assignment),
          id: docSnap.id
        };
      }

      return null;
    } catch (error) {
      console.error('[Firestore Error] Lỗi tìm đề theo mã:', error);
      return null;
    }
  }

  /**
   * Lấy chi tiết đề thi theo ID
   */
  static async getExamById(id: string): Promise<Assignment | null> {
    try {
      const docRef = doc(db, EXAMS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          ...(docSnap.data() as Assignment),
          id: docSnap.id
        };
      }
      return null;
    } catch (error) {
      console.error('[Firestore Error] Lỗi lấy đề thi theo ID:', error);
      return null;
    }
  }

  /**
   * 3. Lưu kết quả nộp bài của học sinh vào Firestore collection "results"
   */
  static async saveResult(submission: Submission): Promise<void> {
    try {
      const resultDocRef = doc(db, RESULTS_COLLECTION, submission.id);
       
      const payload = {
        ...submission,
        createdAt: new Date().toISOString()
      };

      await setDoc(resultDocRef, payload, { merge: true });
      console.log(`[Firestore] Đã lưu kết quả bài nộp của học sinh ${submission.studentName} (${submission.totalScore}đ) lên Cloud Firestore.`);
    } catch (error) {
      console.error('[Firestore Error] Không thể lưu kết quả nộp bài lên Firestore:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đề thi của giáo viên hoặc toàn bộ đề trên Firestore
   */
  static async getExams(teacherId?: string): Promise<Assignment[]> {
    try {
      let q;
      if (teacherId) {
        q = query(
          collection(db, EXAMS_COLLECTION),
          where('teacherId', '==', teacherId)
        );
      } else {
        q = query(collection(db, EXAMS_COLLECTION));
      }

      const querySnapshot = await getDocs(q);
      const exams: Assignment[] = [];
      querySnapshot.forEach((docSnap) => {
        exams.push({
          ...(docSnap.data() as Assignment),
          id: docSnap.id
        });
      });
      return exams;
    } catch (error) {
      console.error('[Firestore Error] Lỗi tải danh sách đề thi:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách kết quả bài làm theo assignmentId từ Firestore
   */
  static async getResultsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, RESULTS_COLLECTION),
        where('assignmentId', '==', assignmentId)
      );
      const querySnapshot = await getDocs(q);
      const results: Submission[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push({
          ...(docSnap.data() as Submission),
          id: docSnap.id
        });
      });
      return results;
    } catch (error) {
      console.error('[Firestore Error] Lỗi tải danh sách kết quả bài thi:', error);
      return [];
    }
  }

  /**
   * Xóa đề thi triệt để trên Firestore (hỗ trợ cả assignmentId và assignmentCode)
   */
  static async deleteExam(assignmentId: string, assignmentCode?: string): Promise<void> {
    try {
      if (assignmentId) {
        try {
          await deleteDoc(doc(db, EXAMS_COLLECTION, assignmentId));
        } catch (err) {
          console.warn(`[Firestore] Lỗi xóa doc theo id ${assignmentId}:`, err);
        }
      }

      if (assignmentCode) {
        const rawCode = assignmentCode.trim().toUpperCase();
        const noSpaceCode = rawCode.replace(/\s+/g, '');
        const withDashCode = rawCode.replace(/\s*-\s*/g, '-');

        const codesToTry = Array.from(new Set([rawCode, noSpaceCode, withDashCode]));

        for (const code of codesToTry) {
          try {
            await deleteDoc(doc(db, EXAMS_COLLECTION, code));
          } catch {}

          try {
            const q = query(
              collection(db, EXAMS_COLLECTION),
              where('assignmentCode', '==', code)
            );
            const snap = await getDocs(q);
            for (const d of snap.docs) {
              await deleteDoc(d.ref);
            }
          } catch {}
        }
      }

      console.log(`[Firestore] Đã xóa đề thi ${assignmentId} (${assignmentCode || ''}) trên Cloud Firestore.`);
    } catch (error) {
      console.error('[Firestore Error] Lỗi xóa đề thi trên Firestore:', error);
      throw error;
    }
  }

  // ==========================================
  // CÁC HÀM MỚI CHO KHO ĐỀ (EXAM TEMPLATES)
  // ==========================================

  /**
   * Lưu một đề mẫu vào Kho Đề (exam_templates)
   */
  static async saveExamTemplate(
    template: ExamTemplate,
    teacherUser?: { uid: string; email?: string | null; displayName?: string | null }
  ): Promise<void> {
    try {
      const templateDocRef = doc(db, EXAM_TEMPLATES_COLLECTION, template.id);
      
      const payload: any = {
        ...template,
        updatedAt: new Date().toISOString()
      };

      if (teacherUser) {
        payload.teacherId = teacherUser.uid;
        payload.teacherEmail = teacherUser.email || '';
        payload.teacherName = teacherUser.displayName || 'Giáo viên';
      }

      await setDoc(templateDocRef, payload, { merge: true });
      console.log(`[Firestore] Đã lưu đề mẫu ${template.id} (${template.title}) vào Kho Đề.`);
    } catch (error) {
      console.error('[Firestore Error] Không thể lưu đề mẫu vào Kho Đề:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách toàn bộ đề mẫu trong Kho Đề (hỗ trợ lọc theo giáo viên)
   */
  static async getExamTemplates(teacherId?: string): Promise<ExamTemplate[]> {
    try {
      let q;
      if (teacherId) {
        q = query(
          collection(db, EXAM_TEMPLATES_COLLECTION),
          where('teacherId', '==', teacherId)
        );
      } else {
        q = query(collection(db, EXAM_TEMPLATES_COLLECTION));
      }

      const querySnapshot = await getDocs(q);
      const templates: ExamTemplate[] = [];
      querySnapshot.forEach((docSnap) => {
        templates.push({
          ...(docSnap.data() as ExamTemplate),
          id: docSnap.id
        });
      });
      return templates;
    } catch (error) {
      console.error('[Firestore Error] Lỗi tải danh sách Kho Đề:', error);
      return [];
    }
  }

  /**
   * Xóa một đề mẫu khỏi Kho Đề
   */
  static async deleteExamTemplate(templateId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, EXAM_TEMPLATES_COLLECTION, templateId));
      console.log(`[Firestore] Đã xóa đề mẫu ${templateId} khỏi Kho Đề.`);
    } catch (error) {
      console.error('[Firestore Error] Lỗi xóa đề mẫu khỏi Kho Đề:', error);
      throw error;
    }
  }
}
