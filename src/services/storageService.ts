/**
 * Storage Service for TOÁN THCS
 * Quản lý lưu trữ dữ liệu lớp học, bài tập, câu hỏi, kết quả học sinh.
 * Lưu trữ trong LocalStorage với dữ liệu mẫu hoàn chỉnh, dễ dàng chuyển sang Firebase/Supabase.
 */

import { ClassRoom, Assignment, Submission, Question } from '../types';

const STORAGE_KEYS = {
  CLASSES: 'toan_thcs_classes',
  ASSIGNMENTS: 'toan_thcs_assignments',
  SUBMISSIONS: 'toan_thcs_submissions',
  TEACHER_PROFILE: 'toan_thcs_teacher_profile',
  INITIALIZED: 'toan_thcs_initialized_v2'
};

// 20 câu hỏi mẫu chất lượng cao cho Toán 6 - Phân số
const SAMPLE_QUESTIONS_TOAN6: Question[] = [
  {
    id: 'q1',
    order: 1,
    question: 'Phân số nào sau đây lớn hơn 1?',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '1/2' },
      { id: 'B', text: '2/3' },
      { id: 'C', text: '5/4' },
      { id: 'D', text: '3/5' }
    ],
    correctAnswer: 'C',
    points: 0.5,
    explanation: 'Phân số lớn hơn 1 khi tử số lớn hơn mẫu số (với tử và mẫu dương). Ở đây 5 > 4 nên 5/4 > 1.',
    topicHint: 'So sánh phân số'
  },
  {
    id: 'q2',
    order: 2,
    question: 'Phân số đối của phân số -3/7 là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '3/7' },
      { id: 'B', text: '-7/3' },
      { id: 'C', text: '7/3' },
      { id: 'D', text: '-3/-7' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: 'Số đối của phân số a/b là -a/b. Do đó số đối của -3/7 là -(-3/7) = 3/7.',
    topicHint: 'Số đối của phân số'
  },
  {
    id: 'q3',
    order: 3,
    question: 'Rút gọn phân số 24/36 về phân số tối giản ta được:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '12/18' },
      { id: 'B', text: '6/9' },
      { id: 'C', text: '2/3' },
      { id: 'D', text: '4/6' }
    ],
    correctAnswer: 'C',
    points: 0.5,
    explanation: 'ƯCLN(24, 36) = 12. Chia cả tử và mẫu cho 12: 24:12 / 36:12 = 2/3.',
    topicHint: 'Rút gọn phân số'
  },
  {
    id: 'q4',
    order: 4,
    question: 'Kết quả của phép tính: 2/5 + 3/5 là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '5/10' },
      { id: 'B', text: '1' },
      { id: 'C', text: '6/25' },
      { id: 'D', text: '5/25' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Cộng hai phân số cùng mẫu: (2 + 3)/5 = 5/5 = 1.',
    topicHint: 'Cộng phân số cùng mẫu'
  },
  {
    id: 'q5',
    order: 5,
    question: 'Kết quả của phép tính: 1/4 + 2/3 là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '3/7' },
      { id: 'B', text: '11/12' },
      { id: 'C', text: '3/12' },
      { id: 'D', text: '5/12' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Quy đồng mẫu số chung là 12: 1/4 = 3/12, 2/3 = 8/12 => 3/12 + 8/12 = 11/12.',
    topicHint: 'Cộng phân số khác mẫu'
  },
  {
    id: 'q6',
    order: 6,
    question: 'Phân số nghịch đảo của phân số -5/8 là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '5/8' },
      { id: 'B', text: '-8/5' },
      { id: 'C', text: '8/5' },
      { id: 'D', text: '1' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Phân số nghịch đảo của a/b (a, b khác 0) là b/a. Nghịch đảo của -5/8 là 8/(-5) = -8/5.',
    topicHint: 'Phân số nghịch đảo'
  },
  {
    id: 'q7',
    order: 7,
    question: 'Thực hiện phép nhân: (3/7) × (14/9) được kết quả tối giản là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '42/63' },
      { id: 'B', text: '2/3' },
      { id: 'C', text: '3/2' },
      { id: 'D', text: '6/9' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: '(3 × 14) / (7 × 9) = (3 × 2 × 7) / (7 × 3 × 3) = 2/3.',
    topicHint: 'Nhân phân số'
  },
  {
    id: 'q8',
    order: 8,
    question: 'Thực hiện phép chia: (4/5) : (2/15) được kết quả là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '6' },
      { id: 'B', text: '8/75' },
      { id: 'C', text: '2/3' },
      { id: 'D', text: '3/2' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: '(4/5) : (2/15) = (4/5) × (15/2) = (4 × 15) / (5 × 2) = 60 / 10 = 6.',
    topicHint: 'Chia phân số'
  },
  {
    id: 'q9',
    order: 9,
    question: 'Tìm x biết: x - 1/3 = 1/2',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: 'x = 1/6' },
      { id: 'B', text: 'x = 5/6' },
      { id: 'C', text: 'x = 2/5' },
      { id: 'D', text: 'x = -1/6' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'x = 1/2 + 1/3 = 3/6 + 2/6 = 5/6.',
    topicHint: 'Tìm x với phép cộng trừ phân số'
  },
  {
    id: 'q10',
    order: 10,
    question: 'Hỗn số 3 2/5 được viết dưới dạng phân số là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '17/5' },
      { id: 'B', text: '11/5' },
      { id: 'C', text: '6/5' },
      { id: 'D', text: '15/5' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: '3 2/5 = (3 × 5 + 2) / 5 = (15 + 2) / 5 = 17/5.',
    topicHint: 'Chuyển đổi hỗn số'
  },
  {
    id: 'q11',
    order: 11,
    question: 'Tìm 3/4 của 60:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '40' },
      { id: 'B', text: '45' },
      { id: 'C', text: '80' },
      { id: 'D', text: '50' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Muốn tìm m/n của số b ta tính b × (m/n) = 60 × (3/4) = (60 × 3) / 4 = 180 / 4 = 45.',
    topicHint: 'Giá trị phân số của một số'
  },
  {
    id: 'q12',
    order: 12,
    question: 'Tìm một số biết 2/5 của nó bằng 20:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '8' },
      { id: 'B', text: '50' },
      { id: 'C', text: '40' },
      { id: 'D', text: '25' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Số cần tìm là: 20 : (2/5) = 20 × (5/2) = 50.',
    topicHint: 'Tìm một số biết giá trị phân số'
  },
  {
    id: 'q13',
    order: 13,
    question: 'Phân số nào sau đây là phân số thập phân?',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '3/10' },
      { id: 'B', text: '5/7' },
      { id: 'C', text: '12/25' },
      { id: 'D', text: '1/3' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: 'Phân số thập phân là phân số mà mẫu là lũy thừa của 10 (như 10, 100, 1000,...). Ở đây 3/10 có mẫu là 10.',
    topicHint: 'Phân số thập phân'
  },
  {
    id: 'q14',
    order: 14,
    question: 'Viết số thập phân 0.75 dưới dạng phân số tối giản:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '75/100' },
      { id: 'B', text: '3/4' },
      { id: 'C', text: '15/20' },
      { id: 'D', text: '7/10' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: '0.75 = 75/100 = (75:25)/(100:25) = 3/4.',
    topicHint: 'Chuyển đổi số thập phân sang phân số'
  },
  {
    id: 'q15',
    order: 15,
    question: 'Sắp xếp các phân số sau theo thứ tự tăng dần: 1/2; -3/4; 0; 5/4',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '-3/4 < 0 < 1/2 < 5/4' },
      { id: 'B', text: '0 < -3/4 < 1/2 < 5/4' },
      { id: 'C', text: '-3/4 < 1/2 < 0 < 5/4' },
      { id: 'D', text: '5/4 < 1/2 < 0 < -3/4' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: 'Số âm luôn nhỏ hơn 0, số dương luôn lớn hơn 0. Ở đây -3/4 < 0 < 1/2 (0.5) < 5/4 (1.25).',
    topicHint: 'So sánh và sắp xếp phân số'
  },
  {
    id: 'q16',
    order: 16,
    question: 'Kết quả của phép tính: (-2/3)^2 là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '-4/9' },
      { id: 'B', text: '4/9' },
      { id: 'C', text: '-4/6' },
      { id: 'D', text: '4/6' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Lũy thừa bậc chẵn của số âm luôn là số dương: (-2/3)^2 = (-2)^2 / 3^2 = 4/9.',
    topicHint: 'Lũy thừa của phân số'
  },
  {
    id: 'q17',
    order: 17,
    question: 'Tính giá trị biểu thức: A = (1/2 - 1/3) × 6',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '1/6' },
      { id: 'D', text: '3' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: '1/2 - 1/3 = 3/6 - 2/6 = 1/6. Sau đó: (1/6) × 6 = 1.',
    topicHint: 'Thứ tự thực hiện phép tính'
  },
  {
    id: 'q18',
    order: 18,
    question: 'Một lớp học có 40 học sinh, trong đó có 3/5 là học sinh nữ. Hỏi lớp có bao nhiêu học sinh nam?',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '24 học sinh' },
      { id: 'B', text: '16 học sinh' },
      { id: 'C', text: '15 học sinh' },
      { id: 'D', text: '20 học sinh' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Số học sinh nữ: 40 × 3/5 = 24 học sinh. Số học sinh nam: 40 - 24 = 16 học sinh (hoặc 40 × (1 - 3/5) = 16).',
    topicHint: 'Giải toán có lời văn về phân số'
  },
  {
    id: 'q19',
    order: 19,
    question: 'Phân số a/b bằng phân số c/d khi và chỉ khi:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: 'a × c = b × d' },
      { id: 'B', text: 'a × d = b × c' },
      { id: 'C', text: 'a + d = b + c' },
      { id: 'D', text: 'a - d = b - c' }
    ],
    correctAnswer: 'B',
    points: 0.5,
    explanation: 'Theo định nghĩa hai phân số bằng nhau: a/b = c/d khi a.d = b.c (tích chéo bằng nhau).',
    topicHint: 'Định nghĩa hai phân số bằng nhau'
  },
  {
    id: 'q20',
    order: 20,
    question: 'Kết quả của phép tính: (3/8) × (4/9) + (3/8) × (5/9) là:',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: '3/8' },
      { id: 'B', text: '1' },
      { id: 'C', text: '9/72' },
      { id: 'D', text: '27/72' }
    ],
    correctAnswer: 'A',
    points: 0.5,
    explanation: 'Áp dụng tính chất phân phối: (3/8) × (4/9 + 5/9) = (3/8) × (9/9) = (3/8) × 1 = 3/8.',
    topicHint: 'Tính chất phân phối của phép nhân'
  }
];

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
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg_toan6_phanso',
    title: 'Toán 6 – Phân số cơ bản',
    grade: '6',
    topic: 'Phân số & Các phép tính',
    classId: 'class_6a1',
    className: '6A1',
    questions: SAMPLE_QUESTIONS_TOAN6,
    durationMinutes: 30,
    deadline: '2026-08-30T23:59:59',
    allowViewResult: true,
    assignmentCode: 'TOAN6A1-8K4P',
    createdAt: '2026-08-20T08:00:00Z',
    isPublished: true
  },
  {
    id: 'asg_toan6_nguyento',
    title: 'Toán 6 – Số nguyên tố & Hợp số',
    grade: '6',
    topic: 'Số học & Ước bội',
    classId: 'class_6a1',
    className: '6A1',
    questions: SAMPLE_QUESTIONS_TOAN6.slice(0, 10).map((q, idx) => ({
      ...q,
      id: `q_nt_${idx + 1}`,
      order: idx + 1,
      question: idx === 0 ? 'Số nguyên tố nhỏ nhất là số nào?' : q.question,
      options: idx === 0 ? [
        { id: 'A', text: '0' },
        { id: 'B', text: '1' },
        { id: 'C', text: '2' },
        { id: 'D', text: '3' }
      ] : q.options,
      correctAnswer: idx === 0 ? 'C' : q.correctAnswer
    })),
    durationMinutes: 15,
    deadline: '2026-08-31T23:59:59',
    allowViewResult: true,
    assignmentCode: 'TOAN6A1-NT9X',
    createdAt: '2026-08-21T09:30:00Z',
    isPublished: true
  }
];

// Tạo 7 bài nộp mẫu cho bài TOAN6A1-8K4P để giáo viên ngay lập tức thấy thống kê, biểu đồ phân tích và danh sách chưa nộp
export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_demo_1',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Nguyễn Văn An',
    studentId: 'st_1',
    totalScore: 9.5,
    maxScore: 10,
    correctCount: 19,
    wrongCount: 1,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 754, // 12m 34s
    startedAt: '2026-08-22T08:00:00Z',
    submittedAt: '2026-08-22T08:12:34Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: idx === 6 ? 'A' : q.correctAnswer, // sai câu 7
      isCorrect: idx !== 6,
      pointsEarned: idx === 6 ? 0 : q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_2',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Trần Thị Bình',
    studentId: 'st_2',
    totalScore: 8.5,
    maxScore: 10,
    correctCount: 17,
    wrongCount: 3,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 980,
    startedAt: '2026-08-22T08:30:00Z',
    submittedAt: '2026-08-22T08:46:20Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: [6, 11, 14].includes(idx) ? 'A' : q.correctAnswer,
      isCorrect: ![6, 11, 14].includes(idx),
      pointsEarned: [6, 11, 14].includes(idx) ? 0 : q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_3',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Lê Hoàng Cường',
    studentId: 'st_3',
    totalScore: 7.0,
    maxScore: 10,
    correctCount: 14,
    wrongCount: 6,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 1120,
    startedAt: '2026-08-22T09:00:00Z',
    submittedAt: '2026-08-22T09:18:40Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: [4, 6, 8, 11, 14, 17].includes(idx) ? 'A' : q.correctAnswer,
      isCorrect: ![4, 6, 8, 11, 14, 17].includes(idx),
      pointsEarned: [4, 6, 8, 11, 14, 17].includes(idx) ? 0 : q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_4',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Đỗ Ngọc Hân',
    studentId: 'st_5',
    totalScore: 10.0,
    maxScore: 10,
    correctCount: 20,
    wrongCount: 0,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 615,
    startedAt: '2026-08-22T10:00:00Z',
    submittedAt: '2026-08-22T10:10:15Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map(q => ({
      questionId: q.id,
      selectedAnswer: q.correctAnswer,
      isCorrect: true,
      pointsEarned: q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_5',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Vũ Gia Huy',
    studentId: 'st_6',
    totalScore: 6.5,
    maxScore: 10,
    correctCount: 13,
    wrongCount: 7,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 1240,
    startedAt: '2026-08-22T10:30:00Z',
    submittedAt: '2026-08-22T10:50:40Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: [2, 4, 6, 8, 11, 14, 19].includes(idx) ? 'B' : q.correctAnswer,
      isCorrect: ![2, 4, 6, 8, 11, 14, 19].includes(idx),
      pointsEarned: [2, 4, 6, 8, 11, 14, 19].includes(idx) ? 0 : q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_6',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Hoàng Mai Linh',
    studentId: 'st_7',
    totalScore: 9.0,
    maxScore: 10,
    correctCount: 18,
    wrongCount: 2,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 840,
    startedAt: '2026-08-22T14:00:00Z',
    submittedAt: '2026-08-22T14:14:00Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: [6, 11].includes(idx) ? 'D' : q.correctAnswer,
      isCorrect: ![6, 11].includes(idx),
      pointsEarned: [6, 11].includes(idx) ? 0 : q.points,
      maxPoints: q.points
    }))
  },
  {
    id: 'sub_demo_7',
    assignmentId: 'asg_toan6_phanso',
    assignmentTitle: 'Toán 6 – Phân số cơ bản',
    classId: 'class_6a1',
    className: '6A1',
    studentName: 'Bùi Quốc Nam',
    studentId: 'st_8',
    totalScore: 7.5,
    maxScore: 10,
    correctCount: 15,
    wrongCount: 5,
    unansweredCount: 0,
    totalQuestions: 20,
    timeSpentSeconds: 1050,
    startedAt: '2026-08-22T15:00:00Z',
    submittedAt: '2026-08-22T15:17:30Z',
    answers: SAMPLE_QUESTIONS_TOAN6.map((q, idx) => ({
      questionId: q.id,
      selectedAnswer: [1, 6, 9, 11, 14].includes(idx) ? 'C' : q.correctAnswer,
      isCorrect: ![1, 6, 9, 11, 14].includes(idx),
      pointsEarned: [1, 6, 9, 11, 14].includes(idx) ? 0 : q.points,
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
