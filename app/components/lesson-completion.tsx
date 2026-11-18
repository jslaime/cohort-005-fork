import { useEffect } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { LessonProgressStatus } from "~/db/schema";

type LessonLink = { id: number; title: string };

export function LessonCompletion({
  courseSlug,
  lessonId,
  lessonStatus,
  nextLesson,
}: {
  courseSlug: string;
  lessonId: number;
  lessonStatus: string | null;
  nextLesson: LessonLink | null;
}) {
  const { fetcher, isMarking, isCompleted } = useMarkComplete({
    courseSlug,
    lessonId,
    lessonStatus,
    nextLesson,
  });

  return (
    <div className="mb-8">
      {isCompleted ? (
        <LessonCompletedBanner
          courseSlug={courseSlug}
          nextLesson={nextLesson}
        />
      ) : (
        <MarkCompleteForm
          fetcher={fetcher}
          isMarking={isMarking}
          nextLesson={nextLesson}
        />
      )}
    </div>
  );
}

function useMarkComplete({
  courseSlug,
  lessonId,
  lessonStatus,
  nextLesson,
}: {
  courseSlug: string;
  lessonId: number;
  lessonStatus: string | null;
  nextLesson: LessonLink | null;
}) {
  const fetcher = useFetcher({ key: `mark-complete-${lessonId}` });
  const navigate = useNavigate();

  const isMarking =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "mark-complete";

  const justCompleted = fetcher.data?.success;

  const isCompleted =
    lessonStatus === LessonProgressStatus.Completed || justCompleted;

  // Navigate to next lesson after marking complete
  useEffect(() => {
    if (justCompleted && nextLesson) {
      navigate(`/courses/${courseSlug}/lessons/${nextLesson.id}`);
    }
  }, [justCompleted, nextLesson, courseSlug, navigate]);

  return { fetcher, isMarking, isCompleted };
}

function LessonCompletedBanner({
  courseSlug,
  nextLesson,
}: {
  courseSlug: string;
  nextLesson: LessonLink | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="size-5" />
        <span className="font-medium">Lesson completed</span>
      </div>
      {nextLesson && (
        <Link to={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
          <Button variant="outline" size="sm">
            Up next: {nextLesson.title}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function MarkCompleteForm({
  fetcher,
  isMarking,
  nextLesson,
}: {
  fetcher: ReturnType<typeof useFetcher>;
  isMarking: boolean;
  nextLesson: LessonLink | null;
}) {
  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="mark-complete" />
      <Button disabled={isMarking}>
        {nextLesson ? (
          isMarking ? (
            "Completing..."
          ) : (
            <>
              Up next: {nextLesson.title}
              <ChevronRight className="ml-1 size-4" />
            </>
          )
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-4" />
            {isMarking ? "Marking..." : "Mark as Complete"}
          </>
        )}
      </Button>
    </fetcher.Form>
  );
}
