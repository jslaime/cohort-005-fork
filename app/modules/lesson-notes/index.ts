import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { describeDraft, type NoteDraft } from "./lib/draft";

export type { NoteDraft };

/**
 * What the note editor should show for the text in the box: the character
 * count, whether it is over the limit, and whether Save would do anything.
 * `savedBody` is the note as last saved, or "" when there is none.
 */
export function describeNoteDraft(draft: string, savedBody: string): NoteDraft {
  return describeDraft(draft, savedBody, MAX_NOTE_LENGTH);
}
