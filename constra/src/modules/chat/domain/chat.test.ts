import { describe, expect, it } from "vitest";
import {
  MAX_BODY_LENGTH,
  countUnread,
  directKey,
  validateBody,
} from "./chat";

describe("directKey", () => {
  it("is order-independent for the same pair", () => {
    expect(directKey("user-a", "user-b")).toBe(directKey("user-b", "user-a"));
  });
  it("sorts the pair so the smaller id comes first", () => {
    const [first] = directKey("user-b", "user-a").split(":");
    expect(first).toBe("user-a");
  });
  it("differs for different pairs", () => {
    expect(directKey("a", "b")).not.toBe(directKey("a", "c"));
  });
});

describe("validateBody", () => {
  it("rejects empty string", () => {
    expect(validateBody("")).toEqual({ ok: false, error: "empty" });
  });
  it("rejects blank string", () => {
    expect(validateBody("   \n\t  ")).toEqual({ ok: false, error: "empty" });
  });
  it("rejects bodies over 2000 chars", () => {
    expect(MAX_BODY_LENGTH).toBe(2000);
    expect(validateBody("x".repeat(2001))).toEqual({
      ok: false,
      error: "too_long",
    });
  });
  it("accepts 1..2000 chars", () => {
    expect(validateBody("hi").ok).toBe(true);
    expect(validateBody("x".repeat(2000)).ok).toBe(true);
  });
});

describe("countUnread", () => {
  const t1 = "2026-01-01T00:00:00.000Z";
  const t2 = "2026-01-02T00:00:00.000Z";
  const t3 = "2026-01-03T00:00:00.000Z";

  it("counts every message when never read", () => {
    expect(countUnread([t1, t2, t3], null)).toBe(3);
  });
  it("counts only messages strictly after last_read_at", () => {
    expect(countUnread([t1, t2, t3], t1)).toBe(2);
    expect(countUnread([t1, t2, t3], t2)).toBe(1);
    expect(countUnread([t1, t2, t3], t3)).toBe(0);
  });
  it("returns 0 for no messages", () => {
    expect(countUnread([], null)).toBe(0);
    expect(countUnread([], t1)).toBe(0);
  });
});
