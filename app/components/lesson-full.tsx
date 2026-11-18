import { useFetcher } from "react-router";
import { CommentThread } from "~/components/comment-thread";
import { Card, CardContent } from "~/components/ui/card";
import { YouTubePlayer } from "~/components/youtube-player";
import { LessonNote } from "~/components/lesson-note";
import { LessonBreadcrumb } from "~/components/lesson-breadcrumb";
import { CurriculumSidebar } from "~/components/lesson-curriculum-sidebar";
import { QuizSection } from "~/components/lesson-quiz-section";
import { LessonHeader } from "~/components/lesson-header";
import { LessonCompletion } from "~/components/lesson-completion";
import { LessonPrevNext } from "~/components/lesson-prev-next";
import { useAutoplay } from "~/components/lesson-autoplay";
import type { Route } from "../routes/+types/courses.$slug.lessons.$lessonId";

type FullLessonData = Extract<
  Route.ComponentProps["loaderData"],
  { view: "full" }
>;

export function FullLesson({ data }: { data: FullLessonData }) {
  const { course, lesson, enrolled, currentUserId } = data;

  return (
    <div className="flex">
      <CurriculumSidebar
        course={course}
        curriculum={data.curriculum}
        currentLessonId={lesson.id}
        lessonProgressMap={data.lessonProgressMap}
        enrolled={enrolled}
      />

      <div className="flex-1 p-6 lg:p-8">
        <LessonBreadcrumb
          course={course}
          mod={data.module}
          lessonTitle={lesson.title}
        />

        <div className="mx-auto max-w-4xl">
          <LessonHeader
            lesson={lesson}
            showBookmark={!!currentUserId}
            bookmarked={data.bookmarked}
          />

          <LessonVideo data={data} />

          {/* Note — under the video, so the Student can write while they watch */}
          {currentUserId && <LessonNote note={data.note} />}

          <LessonContent
            contentHtml={data.contentHtml}
            hasVideo={!!lesson.videoUrl}
          />

          {enrolled && currentUserId && <LessonActivity data={data} />}

          {/* Questions & Discussion — confidential to people with access */}
          <CommentThread
            comments={data.comments}
            currentUserId={currentUserId}
            canModerate={data.canModerate}
            canPost
            instructorName={data.instructorName}
          />

          <LessonPrevNext
            course={course}
            prevLesson={data.prevLesson}
            nextLesson={data.nextLesson}
          />
        </div>
      </div>
    </div>
  );
}

function LessonVideo({ data }: { data: FullLessonData }) {
  const { lesson } = data;
  const [autoplay, toggleAutoplay] = useAutoplay();
  if (!lesson.videoUrl) return null;

  return (
    <YouTubePlayer
      videoUrl={lesson.videoUrl}
      lessonId={lesson.id}
      title={lesson.title}
      startPosition={data.lastWatchPosition}
      durationMinutes={lesson.durationMinutes}
      watchProgress={data.watchProgress}
      trackingEnabled={data.enrolled && !!data.currentUserId}
      autoplay={autoplay}
      onToggleAutoplay={toggleAutoplay}
    />
  );
}

function LessonContent({
  contentHtml,
  hasVideo,
}: {
  contentHtml: string | null;
  hasVideo: boolean;
}) {
  if (contentHtml) {
    return (
      <div
        className="prose prose-neutral dark:prose-invert mb-8 max-w-none"
        // oxlint-disable-next-line react/no-danger -- the instructor wrote this Markdown
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    );
  }
  if (hasVideo) return null;
  return (
    <Card className="mb-8">
      <CardContent className="py-12 text-center text-muted-foreground">
        No content has been added to this lesson yet.
      </CardContent>
    </Card>
  );
}

// Shown only to an enrolled, signed-in Student: the quiz and Mark Complete.
function LessonActivity({ data }: { data: FullLessonData }) {
  const { course, lesson, quiz } = data;
  const quizFetcher = useFetcher({ key: `quiz-${lesson.id}` });

  return (
    <>
      {quiz && (
        <QuizSection
          quiz={quiz}
          bestAttempt={data.bestAttempt}
          quizResult={quizFetcher.data?.quizResult ?? null}
          quizFetcher={quizFetcher}
          isSubmitting={quizFetcher.state !== "idle"}
        />
      )}

      <LessonCompletion
        courseSlug={course.slug}
        lessonId={lesson.id}
        lessonStatus={data.lessonStatus}
        nextLesson={data.nextLesson}
      />
    </>
  );
}
