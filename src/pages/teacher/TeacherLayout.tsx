import React, { useState, useEffect } from 'react';
import { Assignment, ClassRoom, Submission, TeacherSubscription } from '../../types';
import { TeacherOverview } from './TeacherOverview';
import { TeacherClasses } from './TeacherClasses';
import { TeacherAssignments } from './TeacherAssignments';
import { TeacherCreateAssignment } from './TeacherCreateAssignment';
import { TeacherResults } from './TeacherResults';
import { TeacherSettings } from './TeacherSettings';
import { ExamBankView } from './ExamBankView'; // MỚI: Import màn hình Kho Đề Mẫu
import { TeacherPaymentModal } from '../../components/TeacherPaymentModal';
import { SubscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  Settings,
  Sparkles,
  Layers,
  Crown,
  Clock,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface TeacherLayoutProps {
  classes: ClassRoom[];
  assignments: Assignment[];
  submissions: Submission[];
  onRefreshData: () => void;
  onOpenShare: (assignment: Assignment) => void;
  onTestAssignment: (assignment: Assignment) => void;
  onResetData: () => void;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  classes,
  assignments,
  submissions,
  onRefreshData,
  onOpenShare,
  onTestAssignment,
  onResetData
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [tabParams, setTabParams] = useState<any>({});
  
  // Trạng thái Bản quyền & Dùng thử 15 ngày của Giáo viên
  const [subscription, setSubscription] = useState<TeacherSubscription | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    try {
      const sub = await SubscriptionService.getSubscription(user);
      setSubscription(sub);
    } catch (e) {
      console.warn('Lỗi tải thông tin bản quyền:', e);
    }
  };

  const handleNavigate = (tab: string, params?: any) => {
    if (tab === 'create' && subscription?.status === 'expired') {
      setShowPaymentModal(true);
      return;
    }
    setActiveTab(tab);
    if (params) setTabParams(params);
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'exam_bank', label: 'Kho đề mẫu', icon: Layers, highlight: true }, // MỚI: Thêm tab Kho đề mẫu lên menu ngang
    { id: 'classes', label: 'Lớp học', icon: Users, badge: classes.length },
    { id: 'assignments', label: 'Bài tập', icon: BookOpen, badge: assignments.length },
    { id: 'create', label: 'Tạo bài mới', icon: PlusCircle },
    { id: 'results', label: 'Kết quả & Thống kê', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt', icon: Settings }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Subnav Navigation Bar for Teacher */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5">
            {/* Tabs List */}
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : item.highlight
                        ? 'bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Teacher Subscription Pill / Upgrade Trigger */}
            <div className="pl-2 shrink-0">
              {subscription?.isVip ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  title="Tài khoản Giáo viên đã kích hoạt VIP"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100/40 dark:hover:bg-amber-950/40 text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="hidden sm:inline">Bản quyền</span>
                  <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                    VIP
                  </span>
                </button>
              ) : subscription?.status === 'trial' ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  title="Nhấn để xem gói bản quyền hoặc quét QR Agribank"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span>Dùng thử: <strong>Còn {subscription.daysLeft} ngày</strong></span>
                </button>
              ) : subscription?.status === 'expired' ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  title="Hết hạn 15 ngày dùng thử - Nhấn để thanh toán kích hoạt"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 animate-bounce"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Hết hạn dùng thử (Nâng cấp)</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Expired Warning Banner */}
      {subscription?.status === 'expired' && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white py-3 px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <strong className="text-sm font-black">Thời gian dùng thử 15 ngày đã kết thúc!</strong>
                <p className="text-rose-100 text-[11px] mt-0.5">
                  Vui lòng chuyển khoản Agribank hoặc nhập mã kích hoạt để tiếp tục tạo đề thi mới và sử dụng AI chấm bài.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 shrink-0 flex items-center space-x-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Nâng cấp bản quyền ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <TeacherOverview
            classes={classes}
            assignments={assignments}
            submissions={submissions}
            onNavigate={handleNavigate}
            onOpenShare={onOpenShare}
          />
        )}

        {/* MỚI: Định tuyến hiển thị màn hình Kho đề mẫu */}
        {activeTab === 'exam_bank' && (
          <ExamBankView
            classes={classes}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'classes' && (
          <TeacherClasses classes={classes} onRefresh={onRefreshData} />
        )}

        {activeTab === 'assignments' && (
          <TeacherAssignments
            assignments={assignments}
            classes={classes}
            submissions={submissions}
            onRefresh={onRefreshData}
            onNavigate={handleNavigate}
            onOpenShare={onOpenShare}
            onTestAssignment={onTestAssignment}
          />
        )}

        {activeTab === 'create' && (
          <TeacherCreateAssignment
            classes={classes}
            initialQuestions={tabParams.initialQuestions}
            initialTitle={tabParams.initialTitle}
            initialGrade={tabParams.initialGrade}
            initialMode={tabParams.initialMode} // MỚI: Truyền mode PDF hoặc Text sang từ Kho Đề
            onSaveSuccess={(savedAssignment) => {
              onRefreshData();
              onOpenShare(savedAssignment);
              setActiveTab('assignments');
            }}
            onCancel={() => setActiveTab('assignments')}
          />
        )}

        {activeTab === 'results' && (
          <TeacherResults
            assignments={assignments}
            classes={classes}
            submissions={submissions}
            initialAssignmentId={tabParams.assignmentId}
            onOpenShare={onOpenShare}
          />
        )}

        {activeTab === 'settings' && (
          <TeacherSettings onResetData={onResetData} />
        )}
      </main>

      {/* Modal Nâng cấp Bản quyền & Quét mã VietQR Agribank */}
      <TeacherPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        subscription={subscription}
        onSubscriptionUpdated={(newSub) => {
          setSubscription(newSub);
        }}
        user={user}
      />
    </div>
  );
};

