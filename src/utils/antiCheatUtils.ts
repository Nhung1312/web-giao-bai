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

    const cleanCorrect = (q.correctAnswer || '').trim().toUpperCase();

    // Xác định chính xác phương án đúng ban đầu
    // 1. So khớp theo id (ví dụ: 'A', 'B', 'C', 'D')
    let originalCorrectIdx = q.options.findIndex(
      opt => (opt.id || '').trim().toUpperCase() === cleanCorrect
    );

    // 2. Nếu chưa thấy, thử so khớp theo nhãn chuẩn A=0, B=1, C=2, D=3
    if (originalCorrectIdx === -1 && ['A', 'B', 'C', 'D', 'E', 'F'].includes(cleanCorrect)) {
      const idxFromLetter = cleanCorrect.charCodeAt(0) - 65;
      if (idxFromLetter >= 0 && idxFromLetter < q.options.length) {
        originalCorrectIdx = idxFromLetter;
      }
    }

    // 3. Nếu vẫn chưa thấy, so khớp theo nội dung văn bản (text)
    if (originalCorrectIdx === -1 && cleanCorrect) {
      originalCorrectIdx = q.options.findIndex(
        opt => (opt.text || '').trim().toUpperCase() === cleanCorrect
      );
    }

    // Gắn nhãn ban đầu (originalId) và cờ isCorrect ban đầu cho từng option
    const taggedOptions = q.options.map((opt, idx) => {
      const fallbackLabel = standardLabels[idx] || String.fromCharCode(65 + idx);
      const originalId = (opt.id && opt.id.trim()) ? opt.id.trim() : fallbackLabel;
      const isOriginallyCorrect = originalCorrectIdx !== -1 
        ? idx === originalCorrectIdx 
        : (originalId.toUpperCase() === cleanCorrect);

      return {
        ...opt,
        originalId,
        isOriginallyCorrect
      };
    });

    // Fisher-Yates shuffle mảng options
    for (let i = taggedOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [taggedOptions[i], taggedOptions[j]] = [taggedOptions[j], taggedOptions[i]];
    }

    // Gán lại nhãn chuẩn A, B, C, D cho các vị trí mới và cập nhật vị trí mới của đáp án đúng
    let newCorrectAnswer = q.correctAnswer;

    const newOptions: (QuestionOption & { originalId?: string })[] = taggedOptions.map((opt, optIdx) => {
      const newLabel = standardLabels[optIdx] || String.fromCharCode(65 + optIdx);
      
      if (opt.isOriginallyCorrect) {
        newCorrectAnswer = newLabel;
      }

      return {
        id: newLabel,
        text: opt.text,
        originalId: opt.originalId
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

/**
 * Nén ảnh trước khi lưu trữ hoặc truyền tải
 */
export function compressImage(file: File, maxDim: number = 1200, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
