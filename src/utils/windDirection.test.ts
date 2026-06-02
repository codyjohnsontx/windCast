import { describe, expect, it } from "vitest";
import { degreesToCompass, isIdealDirection, isUnsafeDirection } from "./windDirection";

describe("windDirection", () => {
  it("normalizes casing when matching direction lists", () => {
    expect(isIdealDirection("se", ["SE"])).toBe(true);
    expect(isUnsafeDirection(" nw ", ["NW"])).toBe(true);
  });

  it("maps degrees to the nearest compass point", () => {
    expect(degreesToCompass(0)).toBe("N");
    expect(degreesToCompass(135)).toBe("SE");
    expect(degreesToCompass(359)).toBe("N");
  });
});
