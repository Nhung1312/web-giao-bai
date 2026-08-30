import { Assignment, Question, QuestionOption, ViolationEvent } from '../types';
import { isEssayQuestion } from './questionUtils';

/**
 * Trộn ngẫu nhiên (Fisher-Yates Shuffle) danh sách câu hỏi và các đáp án A, B, C, D
 * Đảm bảo đáp án đúng (correctAnswer) được tự động map lại chính xác theo vị trí mới.
 */
export function shuffleAssignmentQuestionsAndOptions(assignment: Assignment): Assignment {
  if (!assignment || !assignment.questions || assignment.questions.length === 0) {
    return assignment;
  }

  // 1. Tạo bản sao sâu của danh sách câu hỏi
  const questionsClone: Question[] = assignment.questions.map(q => ({
    ...q,
    type: isEssayQuestion(q) ? 'essay' : (q.type || 'multiple_choice'),
    options: q.options ? q.options.map(opt => ({ ...opt })) : []
  }));

  // 2. Fisher-Yates shuffle thứ tự câu hỏi
  for (let i = questionsClone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questionsClone[i], questionsClone[j]] = [questionsClone[j], questionsClone[i]];
  }

  // 3. Shuffle các đáp án A, B, C, D trong từng câu và cập nhật lại correctAnswer
  const standardLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  const shuffledQuestions: Question[] = questionsClone.map((q, qIdx) => {
    if (isEssayQuestion(q) || !q.options || q.options.length <= 1) {
      return {
        ...q,
        type: 'essay',
        order: qIdx + 1,
        options: []
      };
    }

    // Xác định nội dung văn bản của đáp án đúng ban đầu
    const originalCorrect = q.options.find(
      opt => opt.id.trim().toUpperCase() === (q.correctAnswer || '').trim().toUpperCase()
    );
    const correctText = originalCorrect ? originalCorrect.text.trim() : '';

    // Shuffle mảng options
    const optionsShuffled = [...q.options];
    for (let i = optionsShuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsShuffled[i], optionsShuffled[j]] = [optionsShuffled[j], optionsShuffled[i]];
    }

    // Gán lại nhãn chuẩn A, B, C, D cho các vị trí mới và tìm vị trí mới của đáp án đúng
    let newCorrectAnswer = q.correctAnswer;

    const newOptions: QuestionOption[] = optionsShuffled.map((opt, optIdx) => {
      const newLabel = standardLabels[optIdx] || String.fromCharCode(65 + optIdx);
      
      // Nếu option này là đáp án đúng ban đầu (so khớp theo text hoặc id ban đầu)
      if (
        (correctText && opt.text.trim() === correctText) ||
        (!correctText && opt.id.trim().toUpperCase() === (q.correctAnswer || '').trim().toUpperCase())
      ) {
        newCorrectAnswer = newLabel;
      }

      return {
        id: newLabel,
        text: opt.text
      };
    });

    return {
      ...q,
      order: qIdx + 1,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    };
  });

  return {
    ...assignment,
    questions: shuffledQuestions
  };
}

/**
 * Định dạng thời gian ghi nhận vi phạm (HH:MM:SS)
 */
export function formatViolationTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  } catch {
    return isoString;
  }
}
