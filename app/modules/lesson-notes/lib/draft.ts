export type NoteDraft = {
  length: number;
  max: number;
  tooLong: boolean;
  empty: boolean;
  dirty: boolean;
  canSave: boolean;
};

export function describeDraft(
  draft: string,
  savedBody: string,
  max: number
): NoteDraft {
  const length = draft.length;
  const tooLong = length > max;
  const empty = draft.trim().length === 0;
  // The server trims a note before storing it, so savedBody is already
  // trimmed and whitespace at the ends of the draft is not worth saving.
  const dirty = draft.trim() !== savedBody;
  return {
    length,
    max,
    tooLong,
    empty,
    dirty,
    canSave: dirty && !empty && !tooLong,
  };
}
