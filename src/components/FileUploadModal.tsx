import React, { useState, useRef } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileType, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  Filter, 
  AlertCircle, 
  Check, 
  Trash2, 
  FileCheck, 
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { FileParserService, ParsedItem, ParseResult } from '../services/fileParserService';
import { Question } from '../types';
import { MathDisplay } from './MathDisplay';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: Question[]) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'trac_nghiem' | 'tu_luan'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await FileParserService.parseFile(file);
      if (result.totalFound === 0) {
        setErrorMsg('Không tìm thấy câu hỏi nào hợp lệ trong tệp. Vui lòng kiểm tra định dạng file.');
      } else {
        setParseResult(result);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Đã có lỗi khi đọc tệp: ' + (err.message || 'Tệp không đúng định dạng.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const toggleSelectAll = (select: boolean) => {
    if (!parseResult) return;
    const updated = parseResult.items.map(item => ({
      ...item,
      selected: select
    }));
    setParseResult({ ...parseResult, items: updated });
  };

  const toggleSelectItem = (id: string) => {
    if (!parseResult) return;
    const updated = parseResult.items.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    setParseResult({ ...parseResult, items: updated });
  };

  const handleToggleOnlyCategory = (cat: 'trac_nghiem' | 'tu_luan') => {
    if (!parseResult) return;
    const updated = parseResult.items.map(item => ({
      ...item,
      selected: item.category === cat
    }));
    setParseResult({ ...parseResult, items: updated });
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    const selectedItems = parseResult.items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để thêm vào đề kiểm tra.');
      return;
    }
    const converted = FileParserService.convertToQuestions(selectedItems);
    onImportQuestions(converted);
    onClose();
  };

  const filteredItems = parseResult
    ? parseResult.items.filter(item => {
        if (filterCategory === 'all') return true;
        return item.category === filterCategory;
      })
    : [];

  const selectedCount = parseResult?.items.filter(i => i.selected).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Tải lên Đề thi từ Excel, Word hoặc PDF
              </h2>
              <p className="text-xs text-slate-500">
                Hệ thống tự động nhận diện và phân loại Trắc nghiệm & Tự luận
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!parseResult ? (
            /* Upload Drop Area */
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json,.docx,.pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex justify-center space-x-3 mb-4">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs" title="Excel">
                    <FileSpreadsheet className="w-6 h-6" />
                  </span>
                  <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs" title="JSON">
                    <FileCheck className="w-6 h-6" />
                  </span>
                  <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs" title="Word">
                    <FileType className="w-6 h-6" />
                  </span>
                  <span className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs" title="PDF">
                    <FileText className="w-6 h-6" />
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 mb-1">
                  Kéo thả file vào đây hoặc bấm để chọn tệp
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Hỗ trợ định dạng: <strong>Excel (.xlsx, .xls)</strong>, <strong>JSON (.json)</strong>, <strong>Word (.docx)</strong>, <strong>PDF (.pdf)</strong> hoặc File văn bản (.txt)
                </p>

                <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95">
                  <UploadCloud className="w-4 h-4" />
                  <span>Chọn tệp từ máy tính</span>
                </div>
              </div>

              {/* Sample Template Download Bar */}
              <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950">Chưa có file mẫu?</div>
                    <div className="text-[11px] text-indigo-700">Tải file mẫu chuẩn về máy, nhập câu hỏi và tải lên lại:</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      FileParserService.downloadSampleExcelTemplate();
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>📥 File Excel Mẫu (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      FileParserService.downloadSampleJsonTemplate();
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>📥 File JSON Mẫu</span>
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center space-x-3 text-indigo-800 text-sm font-semibold animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang đọc và phân tích cấu trúc đề thi...</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Format guidance tips */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mẹo định dạng tệp để hệ thống tự nhận diện tốt nhất:</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
                  <li>
                    <strong>File Word/PDF:</strong> Ghi rõ <em>"Câu 1. ... A. ... B. ... C. ... D. ..."</em> cho Trắc nghiệm hoặc <em>"Bài 1. ..."</em> cho Tự luận.
                  </li>
                  <li>
                    <strong>File Excel:</strong> Đặt tiêu đề cột gồm: <em>Câu hỏi, A, B, C, D, Đáp án đúng, Lời giải</em>.
                  </li>
                  <li>
                    Bộ lọc thông minh sẽ tự động tách phần <strong>I. Trắc nghiệm</strong> và <strong>II. Tự luận</strong> để Thầy/Cô tùy ý lựa chọn.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* Parsed Results & Filter Dashboard */
            <div className="space-y-5">
              {/* Summary Stats bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                    {parseResult.fileType.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 line-clamp-1">
                      {parseResult.fileName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span>Tìm thấy: <strong>{parseResult.totalFound}</strong> câu</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        Trắc nghiệm: <strong>{parseResult.multipleChoiceCount}</strong> câu
                      </span>
                      <span>•</span>
                      <span className="text-amber-700 font-semibold">
                        Tự luận: <strong>{parseResult.essayCount}</strong> câu
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setParseResult(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Tải file khác
                </button>
              </div>

              {/* Filter Tabs & Selection Control */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filterCategory === 'all'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({parseResult.totalFound})
                  </button>
                  <button
                    onClick={() => setFilterCategory('trac_nghiem')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filterCategory === 'trac_nghiem'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔘 Trắc nghiệm ({parseResult.multipleChoiceCount})
                  </button>
                  <button
                    onClick={() => setFilterCategory('tu_luan')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filterCategory === 'tu_luan'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✍️ Tự luận ({parseResult.essayCount})
                  </button>
                </div>

                {/* Batch selection shortcuts */}
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => handleToggleOnlyCategory('trac_nghiem')}
                    className="text-emerald-600 hover:underline font-semibold"
                  >
                    Chỉ chọn Trắc nghiệm
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="text-slate-500 hover:underline font-semibold"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Questions Preview List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredItems.map((item, idx) => {
                  const isMC = item.category === 'trac_nghiem';

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelectItem(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        item.selected
                          ? 'bg-white border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                          : 'bg-slate-50/80 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!item.selected}
                            onChange={() => {}} // Handled by parent div
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-800">
                            Câu {idx + 1}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              isMC
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isMC ? 'Trắc nghiệm' : 'Tự luận'}
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-slate-500">
                          {item.points} điểm
                        </span>
                      </div>

                      {/* Question text */}
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 pl-6">
                        {item.question}
                      </p>

                      {/* Options preview if Multiple choice */}
                      {isMC && item.options && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6 text-xs text-slate-700">
                          {item.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-1.5 rounded-lg border text-[11px] truncate ${
                                opt.id === item.correctAnswer
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <strong>{opt.id}.</strong> {opt.text || '(Trống)'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation if any */}
                      {item.explanation && (
                        <div className="mt-2 pl-6 text-[11px] text-slate-500 italic">
                          💡 Lời giải: {item.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>

          {parseResult && (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                Đã chọn: <strong className="text-indigo-600">{selectedCount}</strong> / {parseResult.totalFound} câu
              </span>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>THÊM {selectedCount} CÂU HỎI VÀO BÀI TẬP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
