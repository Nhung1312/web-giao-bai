/**
 * Grading Service for TOÁN THCS
 * Cung cấp giải thuật tự động chấm điểm, tính phân tích phổ điểm, tỷ lệ đúng/sai từng câu.
 * Hỗ trợ cả câu trắc nghiệm, trả lời ngắn và câu tự luận có đính kèm ảnh bài làm học sinh.
 */

import { Assignment, Submission, StudentAnswer, AssignmentStats, QuestionAnalysis, ViolationEvent } from '../types';
import { isEssayQuestion } from '../utils/questionUtils';

export class GradingService {
  /**
   * Tự động chấm bài làm của học sinh
   */
  static gradeSubmission(params: {
    assignment: Assignment;
    studentAnswers: Record<string, string>; // questionId -> selectedOption ('A' | 'B' | 'C' | 'D'...)
    studentSolutions?: Record<string, string>; // questionId -> text solution
    essayImagesByQuestion?: Record<string, string[]>; // questionId -> image base64 / urls
    generalEssayImages?: string[]; // exam level images
    studentName: string;
    studentId?: string;
    classId: string;
    className: string;
    startedAt: string;
    submittedAt: string;
    tabSwitchCount?: number;
    violationEvents?: ViolationEvent[];
    isShuffled?: boolean;
    aiFeedbacks?: Record<string, { score?: number; feedback?: string; graded?: boolean }>;
  }): Submission {
    const { 
      assignment, 
      studentAnswers, 
      studentSolutions = {},
      essayImagesByQuestion = {},
      generalEssayImages = [],
      studentName, 
      studentId, 
      classId, 
      className, 
      startedAt, 
      submittedAt,
      tabSwitchCount = 0,
      violationEvents = [],
      isShuffled = false,
      aiFeedbacks = {}
    } = params;

    let earnedPointsTotal = 0;
    let maxPointsTotal = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const answers: StudentAnswer[] = assignment.questions.map((q) => {
      const selected = (studentAnswers[q.id] || '').trim();
      const solutionText = (studentSolutions[q.id] || '').trim();
      const images = essayImagesByQuestion[q.id] || [];
      const aiEval = aiFeedbacks[q.id];

      const isEssay = isEssayQuestion(q);
      let isCorrect = false;
      let pointsEarned = 0;
      let isUnanswered = false;

      if (isEssay) {
        // Với câu tự luận: nếu đã có điểm AI chấm
        if (aiEval && typeof aiEval.score === 'number') {
          pointsEarned = Math.min(q.points, Math.max(0, aiEval.score));
          isCorrect = pointsEarned >= (q.points * 0.5);
        } else if (solutionText || images.length > 0 || selected) {
          // Đã có lời giải/ảnh nhưng chưa chấm AI
          pointsEarned = 0;
          isCorrect = false;
        } else {
          isUnanswered = true;
          pointsEarned = 0;
          isCorrect = false;
        }
      } else {
        // Trắc nghiệm
        isUnanswered = selected === '';
        isCorrect = !isUnanswered && selected.toUpperCase() === (q.correctAnswer || '').toUpperCase();
        pointsEarned = isCorrect ? q.points : 0;
      }

      earnedPointsTotal += pointsEarned;
      maxPointsTotal += q.points;

      if (isUnanswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        selectedAnswer: selected,
        studentSolutionText: solutionText,
        essayImages: images,
        isCorrect,
        pointsEarned,
        maxPoints: q.points,
        aiFeedback: aiEval?.feedback,
        aiScore: aiEval?.score,
        aiGraded: aiEval?.graded
      };
    });

    // Quy đổi điểm ra thang điểm 10 chuẩn
    const rawScore = maxPointsTotal > 0 ? (earnedPointsTotal / maxPointsTotal) * 10 : 0;
    const finalScore = Math.round(rawScore * 10) / 10; // làm tròn 1 chữ số thập phân

    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(submittedAt).getTime();
    const timeSpentSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

    return {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      classId,
      className,
      studentName,
      studentId,
      answers,
      totalScore: finalScore,
      maxScore: 10,
      correctCount,
      wrongCount,
      unansweredCount,
      totalQuestions: assignment.questions.length,
      timeSpentSeconds,
      startedAt,
      submittedAt,
      essayImages: generalEssayImages,
      tabSwitchCount,
      violationEvents,
      isShuffled
    };
  }

  /**
   * Tính toán thống kê toàn diện cho giáo viên theo bài tập
   */
  static computeAssignmentStats(
    assignment: Assignment,
    totalClassStudents: number,
    submissions: Submission[]
  ): AssignmentStats {
    const submittedCount = submissions.length;
    const unsubmittedCount = Math.max(0, totalClassStudents - submittedCount);

    let sumScore = 0;
    let highestScore = 0;
    let lowestScore = submittedCount > 0 ? 10 : 0;

    submissions.forEach(sub => {
      sumScore += sub.totalScore;
      if (sub.totalScore > highestScore) highestScore = sub.totalScore;
      if (sub.totalScore < lowestScore) lowestScore = sub.totalScore;
    });

    const averageScore = submittedCount > 0 ? Math.round((sumScore / submittedCount) * 10) / 10 : 0;

    // Thống kê từng câu hỏi
    const questionAnalyses: QuestionAnalysis[] = assignment.questions.map((q) => {
      let correctCount = 0;
      let wrongCount = 0;
      const optionDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

      submissions.forEach(sub => {
        const studentAns = sub.answers.find(a => a.questionId === q.id);
        if (studentAns) {
          if (studentAns.selectedAnswer) {
            const opt = studentAns.selectedAnswer.toUpperCase();
            optionDistribution[opt] = (optionDistribution[opt] || 0) + 1;
          }
          if (studentAns.isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }
        } else {
          wrongCount++;
        }
      });

      const totalResponses = submissions.length;
      const accuracyRate = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

      return {
        questionId: q.id,
        order: q.order,
        questionText: q.question,
        correctAnswer: q.correctAnswer,
        totalResponses,
        correctCount,
        wrongCount,
        accuracyRate,
        optionDistribution,
        topicHint: q.topicHint
      };
    });

    // Sắp xếp các câu học sinh sai nhiều nhất (accuracyRate thấp nhất)
    const mostMissedQuestions = [...questionAnalyses]
      .filter(q => q.accuracyRate < 65)
      .sort((a, b) => a.accuracyRate - b.accuracyRate);

    return {
      assignmentId: assignment.id,
      totalAssigned: totalClassStudents,
      submittedCount,
      unsubmittedCount,
      averageScore,
      highestScore,
      lowestScore,
      questionAnalyses,
      mostMissedQuestions
    };
  }

  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs > 0 ? `${secs}s` : ''}`;
  }

  static formatTimeShort(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
