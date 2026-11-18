import { HelpCircle } from "lucide-react";

export function QuizCardHeading({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <HelpCircle className="size-5 text-primary" />
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}
