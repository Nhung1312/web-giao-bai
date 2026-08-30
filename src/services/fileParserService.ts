import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Question, QuestionOption, QuestionType } from '../types';

// Set up pdfjs worker
try {
  // Use unpkg or cdnjs worker or inline fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  // worker fallback
}

export interface ParsedItem {
  id: string;
  order: number;
  question: string;
  type: QuestionType; // 'multiple_choice' | 'essay' | 'short_answer'
  options: QuestionOption[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  topicHint?: string;
  rawText?: string;
  category: 'trac_nghiem' | 'tu_luan';
  selected?: boolean;
}

export interface ParseResult {
  fileName: string;
  fileType: 'excel' | 'word' | 'pdf' | 'text';
  totalFound: number;
  multipleChoiceCount: number;
  essayCount: number;
  items: ParsedItem[];
}

export class FileParserService {
  /**
   * Main entry point to parse any supported file
   */
  static async parseFile(file: File): Promise<ParseResult> {
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
      return this.parseExcelFile(file);
    } else if (lowerName.endsWith('.json')) {
      return this.parseJsonFile(file);
    } else if (lowerName.endsWith('.docx')) {
      return this.parseDocxFile(file);
    } else if (lowerName.endsWith('.pdf')) {
      return this.parsePdfFile(file);
    } else {
      // Text fallback (.txt, .md, etc.)
      const text = await file.text();
      return this.parseRawText(text, fileName, 'text');
    }
  }

  /**
   * Parse JSON (.json) files
   */
  static async parseJsonFile(file: File): Promise<ParseResult> {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e: any) {
      throw new Error('Tệp JSON không hợp lệ: ' + e.message);
    }

    let questionsArray: any[] = [];
    if (Array.isArray(data)) {
      questionsArray = data;
    } else if (data && Array.isArray(data.questions)) {
      questionsArray = data.questions;
    } else if (data && Array.isArray(data.data)) {
      questionsArray = data.data;
    } else {
      throw new Error('Cấu trúc JSON không chứa danh sách câu hỏi hợp lệ.');
    }

    const items: ParsedItem[] = [];
    let mcCount = 0;
    let essayCount = 0;

    questionsArray.forEach((q: any, index: number) => {
      const questionText = q.question || q.questionText || q.content || q.title || `Câu hỏi ${index + 1}`;
      let options: QuestionOption[] = [];
      let correctAnswer = (q.correctAnswer || q.answer || 'A').toString().toUpperCase().trim();

      if (Array.isArray(q.options)) {
        if (typeof q.options[0] === 'string') {
          const ids = ['A', 'B', 'C', 'D'];
          options = q.options.map((opt: string, optIdx: number) => ({
            id: ids[optIdx] || String.fromCharCode(65 + optIdx),
            text: opt
          }));
        } else {
          options = q.options.map((opt: any, optIdx: number) => ({
            id: opt.id || String.fromCharCode(65 + optIdx),
            text: opt.text || opt.content || ''
          }));
        }
      } else if (q.options && typeof q.options === 'object') {
        options = Object.keys(q.options).map(key => ({
          id: key.toUpperCase(),
          text: String(q.options[key])
        }));
      }

      // Check if options exist
      const isMc = options.length >= 2 || q.type === 'multiple_choice';
      if (isMc) {
        mcCount++;
      } else {
        essayCount++;
      }

      items.push({
        id: `q_json_${Date.now()}_${index + 1}`,
        order: index + 1,
        question: questionText,
        type: isMc ? 'multiple_choice' : (q.type || 'short_answer'),
        category: isMc ? 'trac_nghiem' : 'tu_luan',
        options: isMc ? options : [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correctAnswer: isMc ? (correctAnswer || 'A') : '',
        points: typeof q.points === 'number' ? q.points : (isMc ? 0.5 : 1.0),
        explanation: q.explanation || q.solution || '',
        topicHint: q.topicHint || q.topic || 'Toán THCS',
        selected: true
      });
    });

    return {
      fileName: file.name,
      fileType: 'text',
      totalFound: items.length,
      multipleChoiceCount: mcCount,
      essayCount: essayCount,
      items
    };
  }

  /**
   * Download sample Excel template for teachers
   */
  static downloadSampleExcelTemplate() {
    const data = [
      {
        'STT': 1,
        'Câu hỏi': 'Tập hợp các số hữu tỉ được kí hiệu bằng chữ cái nào sau đây?',
        'Phương án A': 'N',
        'Phương án B': 'Z',
        'Phương án C': 'Q',
        'Phương án D': 'R',
        'Đáp án đúng': 'C',
        'Điểm': 0.5,
        'Lời giải chi tiết': 'Tập hợp các số hữu tỉ được kí hiệu là Q theo định nghĩa SGK Toán 7.',
        'Chủ đề': 'Số hữu tỉ'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DeThiMau');
    XLSX.writeFile(workbook, 'Mau_De_Kiem_Tra_Toan_THCS.xlsx');
  }

  /**
   * Download sample JSON template for teachers
   */
  static downloadSampleJsonTemplate() {
    // Keep it minimal for file size
  }

  /**
   * Parse Excel (.xlsx, .xls)
   */
  static async parseExcelFile(file: File): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get raw json rows
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (!rows || rows.length === 0) {
      return { fileName: file.name, fileType: 'excel', totalFound: 0, multipleChoiceCount: 0, essayCount: 0, items: [] };
    }

    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('câu') || rowStr.includes('đáp án') || rowStr.includes('phương án')) {
        headerRowIdx = r;
        break;
      }
    }

    const items: ParsedItem[] = [];
    if (headerRowIdx !== -1) {
      const headers = rows[headerRowIdx].map((h: any) => String(h).trim().toLowerCase());
      const colQ = headers.findIndex(h => h.includes('câu hỏi') || h === 'câu' || h.includes('nội dung'));
      const colA = headers.findIndex(h => h === 'a' || h.includes('phương án a'));
      const colB = headers.findIndex(h => h === 'b' || h.includes('phương án b'));
      const colC = headers.findIndex(h => h === 'c' || h.includes('phương án c'));
      const colD = headers.findIndex(h => h === 'd' || h.includes('phương án d'));
      const colAns = headers.findIndex(h => h.includes('đáp án đúng') || h === 'đáp án');
      const colPoints = headers.findIndex(h => h.includes('điểm'));

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        const questionText = colQ !== -1 ? String(row[colQ] || '').trim() : String(row[0] || '').trim();
        if (!questionText) continue;

        const optA = colA !== -1 ? String(row[colA] || '').trim() : '';
        const optB = colB !== -1 ? String(row[colB] || '').trim() : '';
        const isEssay = (!optA && !optB);

        items.push({
          id: `item_${Date.now()}_${items.length + 1}`,
          order: items.length + 1,
          question: questionText,
          type: isEssay ? 'short_answer' : 'multiple_choice',
          category: isEssay ? 'tu_luan' : 'trac_nghiem',
          options: [
            { id: 'A', text: optA },
            { id: 'B', text: optB },
            { id: 'C', text: colC !== -1 ? String(row[colC] || '').trim() : '' },
            { id: 'D', text: colD !== -1 ? String(row[colD] || '').trim() : '' }
          ],
          correctAnswer: colAns !== -1 ? String(row[colAns] || '').trim().toUpperCase() : 'A',
          points: colPoints !== -1 && !isNaN(Number(row[colPoints])) ? Number(row[colPoints]) : (isEssay ? 1.0 : 0.5),
          selected: true
        });
      }
    }

    if (items.length === 0) {
      const fullText = rows.map(r => r.join(' ')).join('\n');
      return this.parseRawText(fullText, file.name, 'excel');
    }

    return {
      fileName: file.name, fileType: 'excel', totalFound: items.length,
      multipleChoiceCount: items.filter(i => i.category === 'trac_nghiem').length,
      essayCount: items.filter(i => i.category === 'tu_luan').length,
      items
    };
  }

  /**
   * Parse Docx (.docx) via mammoth
   */
  static async parseDocxFile(file: File): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return this.parseRawText(result.value || '', file.name, 'word');
  }

  /**
   * Parse PDF (.pdf) via pdfjs-dist
   */
  static async parsePdfFile(file: File): Promise<ParseResult> {
    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        // Giữ khoảng cách giữa các chữ để tránh bị dính nhau
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n` + pageText;
      }

      return this.parseRawText(fullText, file.name, 'pdf');
    } catch (err) {
      console.error('PDF Parse Error:', err);
      return { fileName: file.name, fileType: 'pdf', totalFound: 0, multipleChoiceCount: 0, essayCount: 0, items: [] };
    }
  }

  /**
   * Thông minh: Cắt chuỗi và tự động phân biệt Trắc nghiệm / Tự luận dựa vào đáp án A, B, C, D
   */
  static parseRawText(rawText: string, fileName: string = 'Đề thi', fileType: 'excel' | 'word' | 'pdf' | 'text' = 'text'): ParseResult {
    if (!rawText || !rawText.trim()) {
      return { fileName, fileType, totalFound: 0, multipleChoiceCount: 0, essayCount: 0, items: [] };
    }

    const items: ParsedItem[] = [];

    // Tìm TẤT CẢ các từ khóa "Câu 1", "Bài 1", kể cả khi nó nằm giữa 1 dòng chữ (không cần phải xuống dòng mới)
    // Regex này bắt dấu cách hoặc đầu dòng, theo sau là Câu/Bài và số thứ tự
    const splitRegex = /(?:^|\s)(?:Câu|Bài|Question)\s*(\d+)[\.:\s]+/gi;

    const matches: { index: number; num: number; matchStr: string }[] = [];
    let match;
    while ((match = splitRegex.exec(rawText)) !== null) {
      matches.push({
        index: match.index,
        num: parseInt(match[1], 10),
        matchStr: match[0]
      });
    }

    if (matches.length === 0) {
      // Nếu không tìm thấy chữ "Câu X" hay "Bài X", trả về 1 câu Tự luận bọc toàn bộ nội dung
      items.push(this.buildFallbackItem(rawText, 1));
    } else {
      for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const nextIndex = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
        
        // Cắt lấy toàn bộ nội dung của câu hỏi này
        let blockText = rawText.substring(current.index, nextIndex).trim();
        blockText = blockText.replace(/--- Trang \d+ ---/g, '').trim(); // Xóa số trang nếu có

        // Phân tích Trắc nghiệm / Tự luận cho riêng câu này
        const parsedItem = this.extractSingleQuestionInfo(blockText, i + 1);
        items.push(parsedItem);
      }
    }

    const mcCount = items.filter(i => i.category === 'trac_nghiem').length;
    const essayCount = items.filter(i => i.category === 'tu_luan').length;

    return {
      fileName,
      fileType,
      totalFound: items.length,
      multipleChoiceCount: mcCount,
      essayCount: essayCount,
      items
    };
  }

  /**
   * Trích xuất thông tin một khối câu hỏi (Biết tự tìm A, B, C, D)
   */
  private static extractSingleQuestionInfo(blockText: string, order: number): ParsedItem {
    // Regex tìm đáp án A., B., C., D. (chỉ chấp nhận chữ hoa A., B., C., D. rõ ràng)
    const aRegex = /(?:^|\n|\s)A[\.\:\)]\s+/;
    const bRegex = /(?:^|\n|\s)B[\.\:\)]\s+/;
    const cRegex = /(?:^|\n|\s)C[\.\:\)]\s+/;
    const dRegex = /(?:^|\n|\s)D[\.\:\)]\s+/;

    // Kiểm tra xem có chứa các ý a), b), c) hoặc 1), 2) tự luận hay không
    const hasSubParts = /(?:^|\n|\s)(?:[a-d]\)|[1-4]\))\s+/i.test(blockText);
    const hasProofKeywords = /\b(chứng minh|chứng tỏ|cmr|rút gọn|tính giá trị|tìm x|giải phương trình|vẽ hình)\b/i.test(blockText);

    const aMatch = blockText.match(aRegex);
    const bMatch = blockText.match(bRegex);
    const cMatch = blockText.match(cRegex);
    const dMatch = blockText.match(dRegex);

    // CHÌA KHÓA: Nếu tìm thấy cả A và B trong nội dung VÀ không phải là câu chứng minh phân nhánh a), b) -> TRẮC NGHIỆM
    const isMultipleChoice = (aMatch !== null && bMatch !== null) && !(hasSubParts && !cMatch && !dMatch);
    
    let questionContent = blockText;
    let optA = '', optB = '', optC = '', optD = '';

    if (isMultipleChoice) {
      const aIdx = blockText.search(aRegex);
      const bIdx = blockText.search(bRegex);
      const cIdx = blockText.search(cRegex);
      const dIdx = blockText.search(dRegex);

      // Lấy phần đề bài (từ đầu cho tới trước chữ A.)
      questionContent = blockText.substring(0, aIdx).trim();

      // Cắt lấy từng đáp án
      if (aIdx !== -1 && bIdx !== -1) {
        if (cIdx !== -1 && dIdx !== -1) {
          optA = blockText.substring(aIdx + aMatch![0].length, bIdx).trim();
          optB = blockText.substring(bIdx + bMatch![0].length, cIdx).trim();
          optC = blockText.substring(cIdx + cMatch![0].length, dIdx).trim();
          optD = blockText.substring(dIdx + dMatch![0].length).trim();
        } else if (cIdx !== -1) {
          optA = blockText.substring(aIdx + aMatch![0].length, bIdx).trim();
          optB = blockText.substring(bIdx + bMatch![0].length, cIdx).trim();
          optC = blockText.substring(cIdx + cMatch![0].length).trim();
        } else {
          optA = blockText.substring(aIdx + aMatch![0].length, bIdx).trim();
          optB = blockText.substring(bIdx + bMatch![0].length, dIdx !== -1 ? dIdx : undefined).trim();
        }
      }
    }

    // Xóa chữ "Câu 1:" hay "Bài 1." ở đầu đề bài cho sạch đẹp
    questionContent = questionContent.replace(/^(?:Chủ\s*đề[^\n]+\n+)?(?:Câu|Bài|Question)\s*\d+[\.:\s]*/i, '').trim();

    return {
      id: `q_parsed_${Date.now()}_${order}`,
      order: order,
      question: questionContent || blockText,
      type: isMultipleChoice ? 'multiple_choice' : 'essay',
      category: isMultipleChoice ? 'trac_nghiem' : 'tu_luan',
      options: isMultipleChoice
        ? [
            { id: 'A', text: optA || 'Phương án A' },
            { id: 'B', text: optB || 'Phương án B' },
            { id: 'C', text: optC || 'Phương án C' },
            { id: 'D', text: optD || 'Phương án D' }
          ]
        : [],
      correctAnswer: isMultipleChoice ? 'A' : '',
      points: isMultipleChoice ? 0.5 : (hasProofKeywords ? 1.5 : 1.0),
      topicHint: 'Toán THCS',
      rawText: blockText,
      selected: true
    };
  }

  private static buildFallbackItem(text: string, order: number): ParsedItem {
    return {
      id: `q_parsed_${Date.now()}_${order}`,
      order: order,
      question: text.trim(),
      type: 'essay',
      category: 'tu_luan',
      options: [],
      correctAnswer: '',
      points: 1.0,
      topicHint: 'Toán THCS',
      selected: true
    };
  }

  /**
   * Convert parsed items to app Question model
   */
  static convertToQuestions(items: ParsedItem[]): Question[] {
    return items.map((item, idx) => {
      const isEssay = item.type === 'essay' || item.category === 'tu_luan' || !item.options || item.options.length < 2 || item.options.every(o => !o.text || !o.text.trim());
      return {
        id: `q_import_${Date.now()}_${idx + 1}`,
        order: idx + 1,
        question: item.question,
        type: isEssay ? 'essay' : 'multiple_choice',
        options: isEssay ? [] : item.options,
        correctAnswer: item.correctAnswer || (isEssay ? '' : 'A'),
        points: item.points || (isEssay ? 1.0 : 0.5),
        explanation: item.explanation || '',
        topicHint: item.topicHint || 'Toán THCS'
      };
    });
  }
}
