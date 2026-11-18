import { describe, it, expect } from "vitest";
import { describeNoteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("describeNoteDraft", () => {
  it("counts characters against the note limit", () => {
    const draft = describeNoteDraft("hello", "");
    expect(draft.length).toBe(5);
    expect(draft.max).toBe(MAX_NOTE_LENGTH);
  });

  it("can save a new, non-empty note", () => {
    expect(describeNoteDraft("first thoughts", "")).toMatchObject({
      dirty: true,
      empty: false,
      tooLong: false,
      canSave: true,
    });
  });

  it("cannot save when nothing changed since the last save", () => {
    expect(describeNoteDraft("same", "same")).toMatchObject({
      dirty: false,
      canSave: false,
    });
  });

  it("cannot save a blank note", () => {
    expect(describeNoteDraft("   \n", "")).toMatchObject({
      empty: true,
      canSave: false,
    });
  });

  it("allows a note exactly at the limit", () => {
    expect(describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), "")).toMatchObject({
      tooLong: false,
      canSave: true,
    });
  });

  it("cannot save a note one character over the limit", () => {
    expect(
      describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), "")
    ).toMatchObject({ tooLong: true, canSave: false });
  });
});

describe("describeNoteDraft after a save", () => {
  it("treats whitespace the server trims away as no change", () => {
    expect(describeNoteDraft("my note\n", "my note")).toMatchObject({
      dirty: false,
      canSave: false,
    });
  });
});
