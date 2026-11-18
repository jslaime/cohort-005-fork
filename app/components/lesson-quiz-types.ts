export type LessonQuiz = {
  id: number;
  title: string;
  passingScore: number;
  questions: Array<{
    id: number;
    questionText: string;
    questionType: string;
    position: number;
    options: Array<{ id: number; optionText: string }>;
  }>;
};

export type QuizResult = {
  attemptId: number;
  score: number;
  passed: boolean;
  grade: string;
  totalCorrect: number;
  totalQuestions: number;
  questionResults: Array<{
    questionId: number;
    correct: boolean;
    selectedOptionId: number | null;
    correctOptionId: number | null;
  }>;
};
