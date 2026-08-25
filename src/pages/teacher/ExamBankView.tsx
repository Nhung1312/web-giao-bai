import React, { useState, useEffect } from 'react';
import { ExamTemplate, Assignment, ClassRoom } from '../../types';
import { FirestoreService } from '../../services/firestoreService';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Send, 
  FileText, 
  BookOpen, 
  Calendar, 
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface ExamBankViewProps {
  teacherId?: string;
  classes: ClassRoom[];
  onNavigate: (tab: string, params?: any) => void;
}

export const ExamBankView: React.FC<ExamBankViewProps> = ({
  teacherId,
  classes,
  onNavigate
}) => {
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Form state để giao bài từ kho đề
  const [targetClassId, setTargetClassId] = useState(classes[0]?.id || 'all');
  const [duration, setDuration] = useState(45);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [teacherId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getExamTemplates(teacherId);
      setTemplates(data);
    } catch (error) {
      console.error('Lỗi tải kho đề:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đề mẫu "${title}" khỏi kho không?`)) {
      try {
        await FirestoreService.deleteExamTemplate(templateId);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } catch (error) {
        alert('Không thể xóa đề mẫu này.');
      }
    }
  };

  const handleOpenAssign = (template: ExamTemplate) => {
    setSelectedTemplate(template);
    setShowAssignModal(true);
  };

  const handlePublishFromBank = async () => {
    if (!selectedTemplate) return;

    const targetClass = classes.find(c => c.id === targetClassId);
    const newAssignment: Assignment = {
      id: 'asg_' + Date.now(),
      title: selectedTemplate.title,
      grade: selectedTemplate.grade,
      topic: selectedTemplate.topic,
      classId: targetClassId,
      className: targetClass ? targetClass.name : 'Tất cả học sinh',
      templateId: selectedTemplate.id,
      pdfUrl: selectedTemplate.pdfUrl,
      questions: selectedTemplate.questions,
      durationMinutes: Number(duration),
      deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      allowViewResult: true,
      assignmentCode: 'TOAN' + selectedTemplate.grade + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      createdAt: new Date().toISOString(),
      isPublished: true
    };

    try {
      await FirestoreService.saveExam(newAssignment);
      alert(`Đã giao bài thành công! Mã đề cho học sinh là: ${newAssignment.assignmentCode}`);
      setShowAssignModal(false);
      onNavigate('assignments'); // Chuyển về danh sách bài tập đã giao
    } catch (error) {
      alert('Lỗi khi tạo bài tập từ kho đề.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('overview')}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-violet-50 text-violet-700 text-[11px] font-bold px-3 py-1 rounded-full mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Quản lý tài nguyên</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">📚 Kho Đề Mẫu Của Tôi</h1>
          </div>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="inline-flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tải lên đề mới vào kho</span>
        </button>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Đang tải danh sách kho đề...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Kho đề của bạn đang trống</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy tải lên các đề thi hoặc giáo án mẫu để lưu trữ và tái sử dụng bất cứ lúc nào bạn muốn giao bài cho học sinh.
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="px-5 py-2.5 bg-violet-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-violet-700"
          >
            Tạo đề mẫu đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                    Khối {tpl.grade}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {tpl.questions?.length || 0} câu hỏi
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base line-clamp-2">{tpl.title}</h3>
                {tpl.topic && <p className="text-xs text-slate-500 italic">Chủ đề: {tpl.topic}</p>}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenAssign(tpl)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Giao bài ngay</span>
                </button>

                <button
                  onClick={() => handleDelete(tpl.id, tpl.title)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Xóa đề mẫu"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cấu hình Giao bài nhanh từ Kho */}
      {showAssignModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">🚀 Giao đề: {selectedTemplate.title}</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn lớp tiếp nhận:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="all">Toàn bộ học sinh (Tất cả)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Lớp {c.name} (Khối {c.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thời gian làm bài (phút):</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hạn chót nộp bài:</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handlePublishFromBank}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Xác nhận giao bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
