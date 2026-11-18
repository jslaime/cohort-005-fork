import { db } from "~/db";
import {
  quizzes,
  quizQuestions,
  quizOptions,
  quizAttempts,
  quizAnswers,
} from "~/db/schema";
import { desc, eq, inArray, and } from "drizzle-orm";

export function getQuizByLessonId(lessonId: number) {
  return db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).get();
}

/**
 * The quiz with this id, but only if it belongs to this lesson, so a quiz
 * elsewhere can't be reached by posting its id to another lesson's route.
 */
export function getQuizForLesson(quizId: number, lessonId: number) {
  return db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.lessonId, lessonId)))
    .get();
}

/**
 * The quiz as a learner may see it: `isCorrect` is left off every option so
 * the answers never reach the browser.
 */
export function getQuizForLearner(quizId: number) {
  const quiz = db.select().from(quizzes).where(eq(quizzes.id, quizId)).get();
  if (!quiz) return null;

  const questions = getQuestionsWithOptions(quizId);
  return {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      position: q.position,
      options: q.options.map((o) => ({ id: o.id, optionText: o.optionText })),
    })),
  };
}

export type LearnerQuiz = NonNullable<ReturnType<typeof getQuizForLearner>>;

function getQuestionsWithOptions(quizId: number) {
  const questions = db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.position)
    .all();
  if (questions.length === 0) return [];

  const options = db
    .select()
    .from(quizOptions)
    .where(
      inArray(
        quizOptions.questionId,
        questions.map((q) => q.id)
      )
    )
    .all();
  return questions.map((question) => ({
    ...question,
    options: options.filter((o) => o.questionId === question.id),
  }));
}

export function getBestAttempt(userId: number, quizId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.score))
    .limit(1)
    .get();
}

export function calculateGrade(score: number): string {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

export type QuestionResult = {
  questionId: number;
  correct: boolean;
  selectedOptionId: number | null;
  correctOptionId: number | null;
};

export function computeResult(
  userId: number,
  quizId: number,
  selectedAnswers: Record<number, number>
) {
  try {
    const quiz = db.select().from(quizzes).where(eq(quizzes.id, quizId)).get();
    if (!quiz) {
      console.error("quiz not found");
      return null;
    }

    const questions = getQuestionsWithOptions(quizId);
    const questionResults = questions.map((q) =>
      gradeQuestion(q, selectedAnswers[q.id])
    );
    const correct = questionResults.filter((r) => r.correct).length;
    const total = questions.length;

    const scoreValue = total > 0 ? correct / total : 0;
    const passed = scoreValue > 0.7;
    const grade = calculateGrade(scoreValue);

    const attemptId = saveAttempt(
      { userId, quizId, score: scoreValue, passed },
      questionResults
    );

    return {
      attemptId,
      score: scoreValue,
      passed,
      grade,
      totalCorrect: correct,
      totalQuestions: total,
      questionResults,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

type GradableQuestion = {
  id: number;
  questionType: string;
  options: Array<{ id: number; isCorrect: boolean }>;
};

function gradeQuestion(
  q: GradableQuestion,
  selected: number | undefined
): QuestionResult {
  if (!selected) {
    return {
      questionId: q.id,
      correct: false,
      selectedOptionId: null,
      correctOptionId: null,
    };
  }

  const correctOptionId = findCorrectOptionId(q);
  return {
    questionId: q.id,
    correct: selected === correctOptionId,
    selectedOptionId: selected,
    correctOptionId,
  };
}

function findCorrectOptionId(q: GradableQuestion): number | null {
  if (q.questionType !== "multiple_choice" && q.questionType !== "true_false") {
    return null;
  }
  return q.options.find((o) => o.isCorrect)?.id ?? null;
}

function saveAttempt(
  attemptValues: {
    userId: number;
    quizId: number;
    score: number;
    passed: boolean;
  },
  questionResults: QuestionResult[]
): number {
  // The attempt and its answers land together or not at all: an attempt with
  // no answers would show a score nobody can review.
  return db.transaction((tx) => {
    const attempt = tx
      .insert(quizAttempts)
      .values(attemptValues)
      .returning()
      .get();

    for (const result of questionResults) {
      if (result.selectedOptionId !== null) {
        tx.insert(quizAnswers)
          .values({
            attemptId: attempt.id,
            questionId: result.questionId,
            selectedOptionId: result.selectedOptionId,
          })
          .run();
      }
    }
    return attempt.id;
  });
}
