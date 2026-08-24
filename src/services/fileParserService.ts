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
      },
      {
        'STT': 2,
        'Câu hỏi': 'Căn bậc hai số học của số 81 là bao nhiêu?',
        'Phương án A': '9',
        'Phương án B': '-9',
        'Phương án C': '±9',
        'Phương án D': '81',
        'Đáp án đúng': 'A',
        'Điểm': 0.5,
        'Lời giải chi tiết': 'Căn bậc hai số học của một số không âm a là số không âm x sao cho x^2 = a. Ta có 9^2 = 81 và 9 > 0 nên căn bậc hai số học của 81 là 9.',
        'Chủ đề': 'Căn bậc hai'
      },
      {
        'STT': 3,
        'Câu hỏi': 'Kết quả của phép tính (-2/3) + (1/6) là:',
        'Phương án A': '-1/2',
        'Phương án B': '-3/6',
        'Phương án C': '-5/6',
        'Phương án D': '1/2',
        'Đáp án đúng': 'A',
        'Điểm': 0.5,
        'Lời giải chi tiết': 'Ta quy đồng mẫu số: (-2/3) + (1/6) = (-4/6) + (1/6) = -3/6 = -1/2.',
        'Chủ đề': 'Các phép tính số hữu tỉ'
      },
      {
        'STT': 4,
        'Câu hỏi': 'Cho hai góc đối đỉnh xOy và x\'Oy\'. Biết góc xOy = 60 độ thì góc x\'Oy\' bằng:',
        'Phương án A': '30°',
        'Phương án B': '60°',
        'Phương án C': '120°',
        'Phương án D': '180°',
        'Đáp án đúng': 'B',
        'Điểm': 0.5,
        'Lời giải chi tiết': 'Hai góc đối đỉnh thì bằng nhau nên x\'Oy\' = xOy = 60°.',
        'Chủ đề': 'Góc đối đỉnh'
      },
      {
        'STT': 5,
        'Câu hỏi': 'Phân số nào sau đây viết được dưới dạng số thập phân hữu hạn?',
        'Phương án A': '1/3',
        'Phương án B': '7/15',
        'Phương án C': '3/8',
        'Phương án D': '5/7',
        'Đáp án đúng': 'C',
        'Điểm': 0.5,
        'Lời giải chi tiết': 'Mẫu số 8 = 2^3 chỉ chứa ước nguyên tố 2 nên phân số 3/8 viết được dưới dạng số thập phân hữu hạn: 3/8 = 0.375.',
        'Chủ đề': 'Số thập phân hữu hạn'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto column width
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 8 },
      { wch: 45 },
      { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DeThiMau');
    XLSX.writeFile(workbook, 'Mau_De_Kiem_Tra_Toan_THCS.xlsx');
  }

  /**
   * Download sample JSON template for teachers
   */
  static downloadSampleJsonTemplate() {
    const sampleData = {
      title: 'Đề kiểm tra Toán THCS Mẫu',
      grade: '7',
      durationMinutes: 45,
      questions: [
        {
          order: 1,
          question: 'Tập hợp các số hữu tỉ được kí hiệu bằng chữ cái nào sau đây?',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: 'N' },
            { id: 'B', text: 'Z' },
            { id: 'C', text: 'Q' },
            { id: 'D', text: 'R' }
          ],
          correctAnswer: 'C',
          points: 0.5,
          explanation: 'Tập hợp các số hữu tỉ được kí hiệu là Q theo chuẩn chương trình Toán THCS.',
          topicHint: 'Số hữu tỉ'
        },
        {
          order: 2,
          question: 'Căn bậc hai số học của số 81 là bao nhiêu?',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: '9' },
            { id: 'B', text: '-9' },
            { id: 'C', text: '±9' },
            { id: 'D', text: '81' }
          ],
          correctAnswer: 'A',
          points: 0.5,
          explanation: 'Căn bậc hai số học của 81 là 9 vì 9 > 0 và 9^2 = 81.',
          topicHint: 'Căn bậc hai'
        },
        {
          order: 3,
          question: 'Kết quả của phép tính (-2/3) + (1/6) là:',
          type: 'multiple_choice',
          options: [
            { id: 'A', text: '-1/2' },
            { id: 'B', text: '-3/6' },
            { id: 'C', text: '-5/6' },
            { id: 'D', text: '1/2' }
          ],
          correctAnswer: 'A',
          points: 0.5,
          explanation: 'Quy đồng mẫu số: (-2/3) + (1/6) = (-4/6) + (1/6) = -3/6 = -1/2.',
          topicHint: 'Các phép tính số hữu tỉ'
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_De_Kiem_Tra_Toan_THCS.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

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
      return {
        fileName: file.name,
        fileType: 'excel',
        totalFound: 0,
        multipleChoiceCount: 0,
        essayCount: 0,
        items: []
      };
    }

    // Try to find header row (contains 'câu' or 'question' or 'đáp án')
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
      if (
        rowStr.includes('câu') || 
        rowStr.includes('nội dung') || 
        rowStr.includes('đáp án') || 
        rowStr.includes('phương án') ||
        rowStr.includes('option')
      ) {
        headerRowIdx = r;
        break;
      }
    }

    const items: ParsedItem[] = [];

    if (headerRowIdx !== -1) {
      // Column mapped mode
      const headers = rows[headerRowIdx].map((h: any) => String(h).trim().toLowerCase());
      
      const colQ = headers.findIndex(h => h.includes('câu hỏi') || h.includes('nội dung') || h.includes('đề bài') || h === 'câu');
      const colType = headers.findIndex(h => h.includes('loại') || h.includes('dạng'));
      const colA = headers.findIndex(h => h === 'a' || h.startsWith('đáp án a') || h.startsWith('phương án a') || h.includes('lựa chọn a'));
      const colB = headers.findIndex(h => h === 'b' || h.startsWith('đáp án b') || h.startsWith('phương án b') || h.includes('lựa chọn b'));
      const colC = headers.findIndex(h => h === 'c' || h.startsWith('đáp án c') || h.startsWith('phương án c') || h.includes('lựa chọn c'));
      const colD = headers.findIndex(h => h === 'd' || h.startsWith('đáp án d') || h.startsWith('phương án d') || h.includes('lựa chọn d'));
      const colAns = headers.findIndex(h => h.includes('đáp án đúng') || h.includes('đáp án') || h === 'key' || h === 'đúng');
      const colExp = headers.findIndex(h => h.includes('lời giải') || h.includes('hướng dẫn') || h.includes('giải thích'));
      const colTopic = headers.findIndex(h => h.includes('chủ đề') || h.includes('dạng bài') || h.includes('kỹ năng') || h.includes('bài'));
      const colPoints = headers.findIndex(h => h.includes('điểm'));

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        const questionText = colQ !== -1 ? String(row[colQ] || '').trim() : String(row[0] || '').trim();
        if (!questionText) continue;

        const optA = colA !== -1 ? String(row[colA] || '').trim() : '';
        const optB = colB !== -1 ? String(row[colB] || '').trim() : '';
        const optC = colC !== -1 ? String(row[colC] || '').trim() : '';
        const optD = colD !== -1 ? String(row[colD] || '').trim() : '';

        const typeStr = colType !== -1 ? String(row[colType] || '').toLowerCase() : '';
        const isEssay = typeStr.includes('tự luận') || (!optA && !optB && !optC && !optD);

        const correctRaw = colAns !== -1 ? String(row[colAns] || '').trim().toUpperCase() : 'A';
        const correct = ['A', 'B', 'C', 'D'].includes(correctRaw) ? correctRaw : 'A';
        const explanation = colExp !== -1 ? String(row[colExp] || '').trim() : '';
        const topicHint = colTopic !== -1 ? String(row[colTopic] || '').trim() : 'Toán THCS';
        const points = colPoints !== -1 && !isNaN(Number(row[colPoints])) ? Number(row[colPoints]) : 0.5;

        items.push({
          id: `item_${Date.now()}_${items.length + 1}`,
          order: items.length + 1,
          question: questionText,
          type: isEssay ? 'short_answer' : 'multiple_choice',
          category: isEssay ? 'tu_luan' : 'trac_nghiem',
          options: [
            { id: 'A', text: optA || (isEssay ? '' : 'Lựa chọn A') },
            { id: 'B', text: optB || (isEssay ? '' : 'Lựa chọn B') },
            { id: 'C', text: optC || (isEssay ? '' : 'Lựa chọn C') },
            { id: 'D', text: optD || (isEssay ? '' : 'Lựa chọn D') }
          ],
          correctAnswer: isEssay ? (colAns !== -1 ? String(row[colAns] || '') : '') : correct,
          points: points,
          explanation: explanation,
          topicHint: topicHint,
          selected: true
        });
      }
    }

    // If table didn't match structured columns, parse full sheet as text
    if (items.length === 0) {
      const fullText = rows.map(r => r.join(' ')).join('\n');
      return this.parseRawText(fullText, file.name, 'excel');
    }

    const mcCount = items.filter(i => i.category === 'trac_nghiem').length;
    const essayCount = items.filter(i => i.category === 'tu_luan').length;

    return {
      fileName: file.name,
      fileType: 'excel',
      totalFound: items.length,
      multipleChoiceCount: mcCount,
      essayCount: essayCount,
      items
    };
  }

  /**
   * Parse Docx (.docx) via mammoth
   */
  static async parseDocxFile(file: File): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value || '';
    return this.parseRawText(text, file.name, 'word');
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
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `\n--- Trang ${pageNum} ---\n` + pageText;
      }

      return this.parseRawText(fullText, file.name, 'pdf');
    } catch (err) {
      console.error('PDF Parse Error:', err);
      // Fallback
      return {
        fileName: file.name,
        fileType: 'pdf',
        totalFound: 0,
        multipleChoiceCount: 0,
        essayCount: 0,
        items: []
      };
    }
  }

  /**
   * Universal Intelligent Text Parser for Vietnamese Math Exam Questions
   * Distinguishes:
   * 1. Phần Trắc nghiệm (A, B, C, D)
   * 2. Phần Tự luận (Bài 1, Bài 2... không có 4 đáp án A B C D)
   */
  static parseRawText(rawText: string, fileName: string = 'Đề thi', fileType: 'excel' | 'word' | 'pdf' | 'text' = 'text'): ParseResult {
    if (!rawText || !rawText.trim()) {
      return {
        fileName,
        fileType,
        totalFound: 0,
        multipleChoiceCount: 0,
        essayCount: 0,
        items: []
      };
    }

    const items: ParsedItem[] = [];

    // Check if the document has explicit sections:
    // "I. PHẦN TRẮC NGHIỆM" and "II. PHẦN TỰ LUẬN"
    let tracNghiemSection = '';
    let tuLuanSection = '';

    const tuLuanMatch = rawText.search(/(ii\.?\s*phần\s*tự\s*luận|phần\s*2:?\s*tự\s*luận|b\.\s*tự\s*luận)/i);
    const tracNghiemMatch = rawText.search(/(i\.?\s*phần\s*trắc\s*nghiệm|phần\s*1:?\s*trắc\s*nghiệm|a\.\s*trắc\s*nghiệm)/i);

    if (tracNghiemMatch !== -1 && tuLuanMatch !== -1) {
      if (tracNghiemMatch < tuLuanMatch) {
        tracNghiemSection = rawText.substring(tracNghiemMatch, tuLuanMatch);
        tuLuanSection = rawText.substring(tuLuanMatch);
      } else {
        tuLuanSection = rawText.substring(tuLuanMatch, tracNghiemMatch);
        tracNghiemSection = rawText.substring(tracNghiemMatch);
      }
    } else {
      // Single continuous text
      tracNghiemSection = rawText;
    }

    // Helper to parse blocks
    let currentOrder = 1;

    // 1. Extract from Trắc nghiệm section
    if (tracNghiemSection) {
      const parsedMC = this.extractQuestionsFromBlock(tracNghiemSection, 'trac_nghiem', currentOrder);
      items.push(...parsedMC);
      currentOrder += parsedMC.length;
    }

    // 2. Extract from Tự luận section (if any)
    if (tuLuanSection) {
      const parsedEssay = this.extractQuestionsFromBlock(tuLuanSection, 'tu_luan', currentOrder);
      items.push(...parsedEssay);
      currentOrder += parsedEssay.length;
    }

    // If nothing found via strict split, do a generic fallback
    if (items.length === 0) {
      const genericItems = this.extractQuestionsFromBlock(rawText, 'auto', 1);
      items.push(...genericItems);
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
   * Block extractor
   */
  private static extractQuestionsFromBlock(
    text: string, 
    forceCategory: 'trac_nghiem' | 'tu_luan' | 'auto',
    startingOrder: number
  ): ParsedItem[] {
    const results: ParsedItem[] = [];

    // Split by markers like "Câu 1.", "Câu 2:", "Bài 1.", "Bài 2:"
    // Regex matches "Câu 1", "Câu 01", "Bài 1", "Bài 01", "Question 1"
    const splitRegex = /(?:^|\n|\r)\s*(?:Chủ\s*đề\s*\d+[^:\n]*[:\.\n])?\s*(?:(?:Câu|Bài|Question)\s*(\d+)[\.:\s]+)/gi;

    const matches: { index: number; num: number; matchStr: string }[] = [];
    let match;
    while ((match = splitRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        num: parseInt(match[1], 10),
        matchStr: match[0]
      });
    }

    if (matches.length === 0) {
      // Try line-by-line fallback
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.length > 10 && !line.startsWith('---') && !line.toLowerCase().includes('đề cương') && !line.toLowerCase().includes('tài liệu')) {
          results.push({
            id: `q_parsed_${Date.now()}_${results.length + 1}`,
            order: startingOrder + results.length,
            question: line,
            type: 'short_answer',
            category: 'tu_luan',
            options: [
              { id: 'A', text: '' },
              { id: 'B', text: '' },
              { id: 'C', text: '' },
              { id: 'D', text: '' }
            ],
            correctAnswer: '',
            points: 0.5,
            topicHint: 'Toán THCS',
            selected: true
          });
        }
      }
      return results;
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const blockText = text.substring(current.index, nextIndex).trim();

      // Clean block
      const cleanBlock = blockText.replace(/--- Trang \d+ ---/g, '').trim();

      // Determine if this block has A, B, C, D options
      const optAMatch = cleanBlock.search(/(?:^|[\s\n])A[\.\:\)]\s*/);
      const optBMatch = cleanBlock.search(/(?:^|[\s\n])B[\.\:\)]\s*/);
      const optCMatch = cleanBlock.search(/(?:^|[\s\n])C[\.\:\)]\s*/);
      const optDMatch = cleanBlock.search(/(?:^|[\s\n])D[\.\:\)]\s*/);

      const hasOptions = optAMatch !== -1 && optBMatch !== -1;
      const isMultipleChoice = forceCategory === 'trac_nghiem' || (forceCategory === 'auto' && hasOptions);

      let questionContent = '';
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let correctAnswer = 'A';
      let explanation = '';
      let topicHint = 'Toán THCS';

      // Detect topic header if present near the start (e.g., "Chủ đề 1: Khái niệm...")
      const topicMatch = cleanBlock.match(/Chủ\s*đề\s*\d*[:\-]?\s*([^\n\r]+)/i);
      if (topicMatch && topicMatch[1]) {
        topicHint = topicMatch[1].trim();
      }

      if (hasOptions && optAMatch !== -1) {
        // Multiple choice parsing
        questionContent = cleanBlock.substring(0, optAMatch).trim();
        // Remove leading "Câu 1." or "Bài 1:"
        questionContent = questionContent.replace(/^(?:Chủ\s*đề[^\n]+\n+)?(?:Câu|Bài|Question)\s*\d+[\.:\s]*/i, '').trim();

        const optionsText = cleanBlock.substring(optAMatch);
        
        // Extract A, B, C, D
        const aIndex = optionsText.search(/A[\.\:\)]\s*/);
        const bIndex = optionsText.search(/B[\.\:\)]\s*/);
        const cIndex = optionsText.search(/C[\.\:\)]\s*/);
        const dIndex = optionsText.search(/D[\.\:\)]\s*/);

        if (aIndex !== -1 && bIndex !== -1) {
          optA = optionsText.substring(aIndex + 2, bIndex).trim().replace(/^[\.\:\)]\s*/, '');
          
          if (cIndex !== -1) {
            optB = optionsText.substring(bIndex + 2, cIndex).trim().replace(/^[\.\:\)]\s*/, '');
            if (dIndex !== -1) {
              optC = optionsText.substring(cIndex + 2, dIndex).trim().replace(/^[\.\:\)]\s*/, '');
              optD = optionsText.substring(dIndex + 2).trim().replace(/^[\.\:\)]\s*/, '');
            } else {
              optC = optionsText.substring(cIndex + 2).trim().replace(/^[\.\:\)]\s*/, '');
            }
          } else {
            optB = optionsText.substring(bIndex + 2).trim().replace(/^[\.\:\)]\s*/, '');
          }
        }

        // Clean trailing punctuation or newlines
        optA = optA.replace(/[\n\r]+/g, ' ').trim();
        optB = optB.replace(/[\n\r]+/g, ' ').trim();
        optC = optC.replace(/[\n\r]+/g, ' ').trim();
        optD = optD.replace(/[\n\r]+/g, ' ').trim();
      } else {
        // Essay question
        questionContent = cleanBlock.replace(/^(?:Chủ\s*đề[^\n]+\n+)?(?:Câu|Bài|Question)\s*\d+[\.:\s]*/i, '').trim();
      }

      if (!questionContent) {
        questionContent = cleanBlock;
      }

      const category: 'trac_nghiem' | 'tu_luan' = isMultipleChoice ? 'trac_nghiem' : 'tu_luan';

      results.push({
        id: `q_parsed_${Date.now()}_${results.length + 1}`,
        order: startingOrder + results.length,
        question: questionContent,
        type: isMultipleChoice ? 'multiple_choice' : 'short_answer',
        category,
        options: isMultipleChoice
          ? [
              { id: 'A', text: optA || 'Phương án A' },
              { id: 'B', text: optB || 'Phương án B' },
              { id: 'C', text: optC || 'Phương án C' },
              { id: 'D', text: optD || 'Phương án D' }
            ]
          : [
              { id: 'A', text: '' },
              { id: 'B', text: '' },
              { id: 'C', text: '' },
              { id: 'D', text: '' }
            ],
        correctAnswer: isMultipleChoice ? correctAnswer : '',
        points: isMultipleChoice ? 0.4 : 1.0,
        explanation: explanation,
        topicHint: topicHint,
        rawText: cleanBlock,
        selected: true
      });
    }

    return results;
  }

  /**
   * Convert parsed items to app Question model
   */
  static convertToQuestions(items: ParsedItem[]): Question[] {
    return items.map((item, idx) => ({
      id: `q_import_${Date.now()}_${idx + 1}`,
      order: idx + 1,
      question: item.question,
      type: item.type,
      options: item.options && item.options.length > 0 ? item.options : [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ],
      correctAnswer: item.correctAnswer || 'A',
      points: item.points || (item.category === 'trac_nghiem' ? 0.4 : 1.0),
      explanation: item.explanation || '',
      topicHint: item.topicHint || 'Toán THCS'
    }));
  }
}
