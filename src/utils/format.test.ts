import { describe, expect, it } from "vitest";
import { formatAge } from "./format";

describe("formatAge", () => {
  it("returns unknown for invalid timestamps", () => {
    expect(formatAge("not-a-date")).toBe("unknown");
  });
});
