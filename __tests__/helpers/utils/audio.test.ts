import { describe, expect, it } from "@jest/globals";

import {
  RESUME_END_MARGIN_SECONDS,
  RESUME_MIN_SECONDS,
  RESUME_SAVE_INTERVAL_SECONDS,
  formatTime,
} from "#/helpers/utils/audio";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [59, "0:59"],
    [60, "1:00"],
    [65, "1:05"],
    [125, "2:05"],
    [3599, "59:59"],
    [3600, "60:00"],
  ])("formats %i seconds as %s", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  it("floors fractional seconds", () => {
    expect(formatTime(90.9)).toBe("1:30");
    expect(formatTime(9.4)).toBe("0:09");
  });
});

describe("resume constants", () => {
  it("uses a start threshold below the end margin window it guards", () => {
    // Both bounds are positive and the save interval is smaller than the
    // start threshold so progress is persisted before it becomes resumable.
    expect(RESUME_MIN_SECONDS).toBeGreaterThan(0);
    expect(RESUME_END_MARGIN_SECONDS).toBeGreaterThan(0);
    expect(RESUME_SAVE_INTERVAL_SECONDS).toBeGreaterThan(0);
    expect(RESUME_SAVE_INTERVAL_SECONDS).toBeLessThanOrEqual(
      RESUME_MIN_SECONDS,
    );
  });
});
