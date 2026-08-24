import React, { useState } from 'react';
import { Assignment, ClassRoom, Submission } from '../../types';
import { TeacherOverview } from './TeacherOverview';
import { TeacherClasses } from './TeacherClasses';
import { TeacherAssignments } from './TeacherAssignments';
import { TeacherCreateAssignment } from './TeacherCreateAssignment';
import { TeacherResults } from './TeacherResults';
import { TeacherSettings } from './TeacherSettings';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  Settings,
  Sparkles
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
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [tabParams, setTabParams] = useState<any>({});

  const handleNavigate = (tab: string, params?: any) => {
    setActiveTab(tab);
    if (params) setTabParams(params);
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'classes', label: 'Lớp học', icon: Users, badge: classes.length },
    { id: 'assignments', label: 'Bài tập', icon: BookOpen, badge: assignments.length },
    { id: 'create', label: 'Tạo bài mới', icon: PlusCircle, highlight: true },
    { id: 'results', label: 'Kết quả & Thống kê', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt', icon: Settings }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Subnav Navigation Bar for Teacher */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
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
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800'
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
        </div>
      </div>

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
    </div>
  );
};
