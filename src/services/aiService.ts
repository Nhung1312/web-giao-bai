/**
 * AI Service Interface & Extensible Architecture
 * 
 * PHIÊN BẢN HIỆN TẠI:
 * - Không yêu cầu API key và không gọi trực tiếp Gemini API bên ngoài.
 * - Sử dụng Mock & Rule-based engine để minh họa trải nghiệm người dùng đầy đủ.
 * 
 * KHẢ NĂNG MỞ RỘNG TƯƠNG LAI:
 * - Khi tích hợp Gemini API thật, chỉ cần tạo `GeminiBackendAIService` implements `IAIService`
 *   và gọi qua backend endpoint `/api/ai/*` (bảo mật API key ở server).
 */

import { Question, QuestionAnalysis, Submission } from '../types';

export interface GenerateQuestionsParams {
  grade: '6' | '7' | '8' | '9';
  topic: string;
  count: number;
  difficulty?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' | 'Hỗn hợp';
}

export interface ExplainAnswerParams {
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  studentAnswer: string;
  grade: string;
}

export interface AnalyzeClassWeaknessParams {
  assignmentTitle: string;
  grade: string;
  totalStudents: number;
  questionAnalyses: QuestionAnalysis[];
  submissions: Submission[];
}

export interface IAIService {
  /**
   * Tự động sinh câu hỏi Toán THCS theo chủ đề và khối lớp
   */
  generateQuestions(params: GenerateQuestionsParams): Promise<Question[]>;

  /**
   * Sinh lời giải thích chi tiết khi học sinh làm sai
   */
  explainAnswer(params: ExplainAnswerParams): Promise<string>;

  /**
   * Tạo các câu hỏi tương tự dựa trên 1 câu hỏi mẫu
   */
  generateSimilarQuestions(baseQuestion: Question, count: number): Promise<Question[]>;

  /**
   * Phân tích tổng hợp điểm yếu và kiến thức hổng của cả lớp dựa trên kết quả làm bài
   */
  analyzeClassMistakes(params: AnalyzeClassWeaknessParams): Promise<{
    summary: string;
    weakTopics: string[];
    recommendations: string[];
  }>;

  /**
   * Tách câu hỏi từ văn bản thô (Word / Text dán vào)
   */
  parseQuestionsFromText(rawText: string): Promise<Question[]>;
}

/**
 * Mock & Rule-based AI Service
 * Cung cấp dữ liệu mẫu thông minh và thuật toán phân tích nội bộ để người dùng trải nghiệm ngay lập tức.
 */
export class MockAIService implements IAIService {
  async generateQuestions(params: GenerateQuestionsParams): Promise<Question[]> {
    // Giả lập xử lý nhanh
    await new Promise(resolve => setTimeout(resolve, 600));

    const samplePool: Record<string, Question[]> = {
      '6': [
        {
          id: `q_gen_${Date.now()}_1`,
          order: 1,
          question: 'Phân số nào sau đây bằng phân số 3/4?',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: '6/8' },
            { id: 'B', text: '9/15' },
            { id: 'C', text: '6/10' },
            { id: 'D', text: '12/20' }
          ],
          correctAnswer: 'A',
          points: 1,
          explanation: 'Nhân cả tử và mẫu của 3/4 với 2 ta được: (3×2)/(4×2) = 6/8.',
          topicHint: 'Phân số bằng nhau'
        },
        {
          id: `q_gen_${Date.now()}_2`,
          order: 2,
          question: 'Kết quả của phép tính 1/3 + 2/5 là:',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: '3/8' },
            { id: 'B', text: '11/15' },
            { id: 'C', text: '2/15' },
            { id: 'D', text: '7/15' }
          ],
          correctAnswer: 'B',
          points: 1,
          explanation: 'Quy đồng mẫu số chung là 15: 1/3 = 5/15, 2/5 = 6/15 => 5/15 + 6/15 = 11/15.',
          topicHint: 'Cộng phân số khác mẫu'
        },
        {
          id: `q_gen_${Date.now()}_3`,
          order: 3,
          question: 'Rút gọn phân số 18/24 về phân số tối giản:',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: '9/12' },
            { id: 'B', text: '6/8' },
            { id: 'C', text: '3/4' },
            { id: 'D', text: '2/3' }
          ],
          correctAnswer: 'C',
          points: 1,
          explanation: 'ƯCLN(18, 24) = 6. Chia cả tử và mẫu cho 6 ta được 3/4.',
          topicHint: 'Rút gọn phân số'
        },
        {
          id: `q_gen_${Date.now()}_4`,
          order: 4,
          question: 'Tìm x biết: x - 1/4 = 3/8',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: 'x = 5/8' },
            { id: 'B', text: 'x = 1/8' },
            { id: 'C', text: 'x = 2/8' },
            { id: 'D', text: 'x = 4/8' }
          ],
          correctAnswer: 'A',
          points: 1,
          explanation: 'x = 3/8 + 1/4 = 3/8 + 2/8 = 5/8.',
          topicHint: 'Tìm x với phân số'
        }
      ],
      '7': [
        {
          id: `q_gen_${Date.now()}_71`,
          order: 1,
          question: 'Số nào sau đây là số vô tỉ?',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: '0.75' },
            { id: 'B', text: '√2' },
            { id: 'C', text: '-3/5' },
            { id: 'D', text: '√9' }
          ],
          correctAnswer: 'B',
          points: 1,
          explanation: '√2 là số thập phân vô hạn không tuần hoàn nên là số vô tỉ. √9 = 3 là số hữu tỉ.',
          topicHint: 'Số vô tỉ & Số thực'
        }
      ]
    };

    const defaultList = samplePool[params.grade] || samplePool['6'];
    return defaultList.slice(0, Math.max(1, params.count));
  }

  async explainAnswer(params: ExplainAnswerParams): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const optObj = params.options.find(o => o.id === params.studentAnswer);
    const correctObj = params.options.find(o => o.id === params.correctAnswer);
    
    const qLower = params.questionText.toLowerCase();
    let specificAdvice = '';

    if (qLower.includes('hữu tỉ') || qLower.includes('tập hợp')) {
      specificAdvice = `
📌 **Kiến thức cốt lõi:**
• Số hữu tỉ là số viết được dưới dạng phân số $a/b$ với $a, b \\in \\mathbb{Z}$ và $b \\neq 0$.
• Kí hiệu: $\\mathbb{Q}$.
• Chú ý: Phân số có mẫu số bằng 0 (như $-9/0$) không xác định nên KHÔNG phải là số hữu tỉ!`;
    } else if (qLower.includes('căn bậc hai') || qLower.includes('√')) {
      specificAdvice = `
📌 **Kiến thức cốt lõi:**
• Căn bậc hai số học của số $a \\geq 0$ là số $x \\geq 0$ sao cho $x^2 = a$ (kí hiệu $\\sqrt{a} = x$).
• Với mọi số $a$, ta luôn có: $\\sqrt{a^2} = |a|$. Nếu $a \\geq 0$ thì $\\sqrt{a^2} = a$.`;
    } else if (qLower.includes('thập phân') || qLower.includes('tuần hoàn')) {
      specificAdvice = `
📌 **Kiến thức cốt lõi:**
• Phân số tối giản với mẫu dương, không có ước nguyên tố khác 2 và 5 thì viết được dưới dạng số thập phân hữu hạn.
• Nếu mẫu có ước nguyên tố khác 2 và 5 (như 3, 7, 11...) thì viết được dưới dạng số thập phân vô hạn tuần hoàn.
• Đổi số $0,(ab) = \\frac{ab}{99}$; $0,a(b) = \\frac{ab - a}{90}$.`;
    } else if (qLower.includes('đối đỉnh') || qLower.includes('góc')) {
      specificAdvice = `
📌 **Kiến thức cốt lõi:**
• Hai góc đối đỉnh là hai góc mà mỗi cạnh của góc này là tia đối của một cạnh của góc kia.
• Hai góc đối đỉnh thì luôn bằng nhau: $\\widehat{xOy} = \\widehat{x'Oy'}$.`;
    } else {
      specificAdvice = `
📌 **Phương pháp tư duy:**
• Bước 1: Xác định rõ yêu cầu bài toán và các đại lượng đã cho.
• Bước 2: Nhắc lại công thức, định lý Toán học liên quan.
• Bước 3: Thực hiện tính toán cẩn thận từng bước và so sánh với 4 phương án.`;
    }

    return `💡 **Gia Sư AI Hướng Dẫn Từng Bước:**
1. **Lỗi sai thường gặp**: Em đã chọn đáp án **${params.studentAnswer}** (${optObj ? optObj.text : ''}). Lựa chọn này chưa chính xác vì có thể bị nhầm lẫn dấu, quên điều kiện mẫu khác 0 hoặc thứ tự ưu tiên các phép tính.
2. **Đáp án chuẩn**: **${params.correctAnswer}** (${correctObj ? correctObj.text : ''}).
${specificAdvice}
3. **Mẹo ghi nhớ nhanh**: Đọc kỹ đề bài, kiểm tra điều kiện xác định trước khi tính toán.`;
  }

  async generateSimilarQuestions(baseQuestion: Question, count: number): Promise<Question[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const result: Question[] = [];

    for (let i = 1; i <= count; i++) {
      result.push({
        id: `sim_${Date.now()}_${i}`,
        order: baseQuestion.order + i,
        question: `[Câu tương tự ${i}] ` + baseQuestion.question.replace(/\b(\d+)\b/g, (match) => String(parseInt(match) + i * 2)),
        type: baseQuestion.type,
        options: baseQuestion.options.map(opt => ({
          ...opt,
          text: opt.text.replace(/\b(\d+)\b/g, (m) => String(parseInt(m) + i))
        })),
        correctAnswer: baseQuestion.correctAnswer,
        points: baseQuestion.points,
        explanation: `Lời giải tương tự câu gốc số ${baseQuestion.order}.`,
        topicHint: baseQuestion.topicHint
      });
    }

    return result;
  }

  async analyzeClassMistakes(params: AnalyzeClassWeaknessParams): Promise<{
    summary: string;
    weakTopics: string[];
    recommendations: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const missed = params.questionAnalyses.filter(q => q.accuracyRate < 60);
    const weakTopics = Array.from(new Set(missed.map(m => m.topicHint || 'Kỹ năng tính toán cơ bản')));

    return {
      summary: `Qua kết quả làm bài của ${params.totalStudents} học sinh ở bài "${params.assignmentTitle}", tỷ lệ nắm vững kiến thức chung đạt mức khá. Có ${missed.length} câu hỏi học sinh hay nhầm lẫn nhiều nhất (tỷ lệ đúng dưới 60%).`,
      weakTopics: weakTopics.length > 0 ? weakTopics : ['Quy đồng mẫu số', 'Quy tắc dấu khi thực hiện phép tính'],
      recommendations: [
        'Dành 10-15 phút đầu giờ ôn lại kiến thức cốt lõi về ' + (weakTopics[0] || 'Phân số'),
        'Luyện tập thêm dạng bài tính nhẩm và so sánh trước khi làm bài phức tạp',
        'Nhắc nhở học sinh kiểm tra lại dấu âm và rút gọn phân số tối giản trước khi chọn đáp án'
      ]
    };
  }

  async parseQuestionsFromText(rawText: string): Promise<Question[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    // Tách câu hỏi theo mẫu: Câu 1, Câu 2... hoặc 1., 2.
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const questions: Question[] = [];
    let currentQ: Partial<Question> | null = null;

    for (const line of lines) {
      const matchQ = line.match(/^(?:Câu\s*(\d+)[:.]|(\d+)[:.])\s*(.*)/i);
      if (matchQ) {
        if (currentQ && currentQ.question && currentQ.options && currentQ.options.length > 0) {
          questions.push(currentQ as Question);
        }
        const qNum = parseInt(matchQ[1] || matchQ[2]) || questions.length + 1;
        currentQ = {
          id: `parsed_${Date.now()}_${qNum}`,
          order: qNum,
          question: matchQ[3] || line,
          type: 'multiple_choice',
          options: [],
          correctAnswer: 'A',
          points: 1,
          explanation: ''
        };
        continue;
      }

      const matchOpt = line.match(/^([A-D])[\.:\)]\s*(.*)/i);
      if (matchOpt && currentQ) {
        currentQ.options = currentQ.options || [];
        currentQ.options.push({
          id: matchOpt[1].toUpperCase(),
          text: matchOpt[2] || ''
        });
      } else if (currentQ && !currentQ.options?.length) {
        currentQ.question += ' ' + line;
      }
    }

    if (currentQ && currentQ.question) {
      if (!currentQ.options || currentQ.options.length === 0) {
        currentQ.options = [
          { id: 'A', text: 'Đáp án A' },
          { id: 'B', text: 'Đáp án B' },
          { id: 'C', text: 'Đáp án C' },
          { id: 'D', text: 'Đáp án D' }
        ];
      }
      questions.push(currentQ as Question);
    }

    return questions;
  }
}

// Single instance exportable and swappable
export const aiService: IAIService = new MockAIService();
