import {
  MAX_PLAYBACK_STEP_SECONDS,
  crossedMilestones,
} from "#/helpers/utils/listenMilestones";

describe("crossedMilestones", () => {
  // 90 % of 1000 s is at 900 s.
  const duration = 1000;

  it("reports a milestone crossed by playback", () => {
    expect(crossedMilestones(899.8, 900.05, duration)).toEqual([90]);
  });

  it("reports nothing before or after the milestone", () => {
    expect(crossedMilestones(500, 500.25, duration)).toEqual([]);
    expect(crossedMilestones(950, 950.25, duration)).toEqual([]);
  });

  it("ignores a jump past the milestone (seek, resume restore)", () => {
    expect(crossedMilestones(10, 990, duration)).toEqual([]);
    expect(crossedMilestones(890, 905, duration)).toEqual([]);
    expect(
      crossedMilestones(899, 899 + MAX_PLAYBACK_STEP_SECONDS + 0.1, duration),
    ).toEqual([]);
  });

  it("counts a step up to the playback bound (fast playback, JS stalls)", () => {
    expect(
      crossedMilestones(899, 899 + MAX_PLAYBACK_STEP_SECONDS, duration),
    ).toEqual([90]);
  });

  it("ignores seeking backwards over the milestone", () => {
    expect(crossedMilestones(901, 899, duration)).toEqual([]);
  });

  it("needs a previous tick and a known duration", () => {
    expect(crossedMilestones(null, 900, duration)).toEqual([]);
    expect(crossedMilestones(899.8, 900.05, 0)).toEqual([]);
    expect(crossedMilestones(899.8, 900.05, NaN)).toEqual([]);
  });

  it("reports every given milestone crossed in one step", () => {
    // Short track: 25 % and 50 % of 4 s are 1 s apart.
    expect(crossedMilestones(0.9, 2.1, 4, [25, 50, 75])).toEqual([25, 50]);
  });
});
