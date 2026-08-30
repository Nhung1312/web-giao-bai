import { Question, QuestionOption } from '../types';

/**
 * Các từ khóa và cụm từ đặc trưng của câu hỏi Tự luận / Chứng minh / Tính toán hình học & đại số THCS
 */
const ESSAY_MATH_KEYWORDS = [
  'chứng minh',
  'chứng minh rằng',
  'chứng tỏ',
  'chứng tỏ rằng',
  'cmr',
  'rút gọn',
  'rút gọn biểu thức',
  'tính giá trị',
  'tính giá trị của biểu thức',
  'giải phương trình',
  'giải hệ phương trình',
  'giải bất phương trình',
  'tìm x',
  'tìm y',
  'tìm m',
  'tìm giá trị lớn nhất',
  'tìm giá trị nhỏ nhất',
  'gtln',
  'gtnn',
  'vẽ hình',
  'vẽ đồ thị',
  'lập bảng xét dấu',
  'lập bảng biến thiên',
  'chứng minh 3 điểm thẳng hàng',
  'chứng minh tứ giác nội tiếp',
  'chứng minh tam giác đồng dạng',
  'chứng minh tam giác bằng nhau',
  'tính độ dài',
  'tính diện tích',
  'tính chu vi',
  'tính số đo góc',
  'bài toán:',
  'bài toán thực tế'
];

/**
 * Kiểm tra xem một câu hỏi có phải là CÂU HỎI TỰ LUẬN hay không
 * 
 * Logic kiểm tra chặt chẽ:
 * 1. Nếu type là 'essay', 'short_answer' hoặc category là 'tu_luan' -> Tự luận
 * 2. Nếu không có mảng options hoặc mảng options có ít hơn 2 phần tử -> Tự luận
 * 3. Nếu các đáp án A, B, C, D đều trống (hoặc chỉ là placeholder như "Phương án A", "Đáp án A") -> Tự luận
 * 4. Nếu đề bài chứa các ý tự luận (a), b), c)...) hoặc từ khóa chứng minh/rút gọn/tính toán mà không có 4 lựa chọn A, B, C, D thực tế -> Tự luận
 */
export function isEssayQuestion(q: Question | any): boolean {
  if (!q) return false;

  // 1. Kiểm tra thuộc tính type / category được chỉ định trực tiếp
  if (q.type === 'essay' || q.type === 'short_answer' || q.category === 'tu_luan') {
    return true;
  }

  const rawQuestionText = (q.question || q.questionText || q.content || '').toLowerCase();
  const options: QuestionOption[] = Array.isArray(q.options) ? q.options : [];

  // 2. Đếm số lượng đáp án có nội dung thực tế (không rỗng và không phải nhãn mặc định)
  const validNonEmptyOptions = options.filter(opt => {
    if (!opt || typeof opt.text !== 'string') return false;
    const trimmed = opt.text.trim();
    if (!trimmed) return false;
    // Bỏ qua nếu text chỉ là placeholder tự sinh như "Phương án A", "Đáp án A", "Option A", ...
    if (/^(phương án|đáp án|lựa chọn|option)\s*[a-d]$/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  // Nếu số lượng đáp án thực tế ít hơn 2 -> Chắc chắn là câu hỏi Tự luận (không thể bấm chọn trắc nghiệm)
  if (validNonEmptyOptions.length < 2) {
    return true;
  }

  // 3. Kiểm tra cấu trúc câu hỏi có chứa các ý a), b), c) hoặc 1), 2), 3) đặc trưng của tự luận
  const hasSubParts = /(?:^|\n|\s)(?:[a-d]\)|[1-4]\))\s+[^\n]+/i.test(rawQuestionText);
  
  // 4. Kiểm tra các từ khóa tự luận đặc thù môn Toán
  const hasEssayKeywords = ESSAY_MATH_KEYWORDS.some(kw => rawQuestionText.includes(kw));

  // Nếu có ý tự luận hoặc từ khóa chứng minh/rút gọn VÀ số lượng đáp án không đủ 4 phương án đầy đủ
  if ((hasSubParts || hasEssayKeywords) && validNonEmptyOptions.length < 4) {
    return true;
  }

  return false;
}

/**
 * Lấy nhãn hiển thị cho loại câu hỏi
 */
export function getQuestionTypeLabel(q: Question | any): 'Tự luận' | 'Trắc nghiệm' {
  return isEssayQuestion(q) ? 'Tự luận' : 'Trắc nghiệm';
}

/**
 * Chuẩn hóa một câu hỏi để đảm bảo thuộc tính type đồng bộ chính xác với nội dung
 */
export function normalizeQuestion(q: Question): Question {
  const isEssay = isEssayQuestion(q);
  if (isEssay) {
    return {
      ...q,
      type: 'essay',
      options: (q.options || []).filter(o => o.text && o.text.trim().length > 0)
    };
  }
  return {
    ...q,
    type: 'multiple_choice'
  };
}

/**
 * Chuẩn hóa danh sách câu hỏi trong một đề bài
 */
export function normalizeQuestions(questions: Question[]): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.map(normalizeQuestion);
}
