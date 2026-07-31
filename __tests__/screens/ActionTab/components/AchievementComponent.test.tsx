import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";
// Aliased with a `mock` prefix so the hoisted jest.mock factory below may
// reference it (jest only allows out-of-scope names matching /^mock/i).
import { useEffect as mockUseEffect } from "react";

import type { LevelType } from "#/helpers/Achievements";
import AchievementComponent from "#/screens/ActionTab/components/AchievementComponent";

const mockGetCurrentAchievements = jest.fn<() => Promise<LevelType>>();
const mockUpdateBadgeState = jest.fn();

jest.mock("#/helpers/Achievements", () => ({
  Achievements: {
    getCurrentAchievements: () => mockGetCurrentAchievements(),
  },
  AchievementConfig: [
    { name: "Einsteiger", logo: "🌱", level: 0, tasks: {} },
    { name: "Profi", logo: "🚀", level: 1, tasks: {} },
  ],
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: (...args: unknown[]) => mockUpdateBadgeState(...args),
}));

jest.mock("#/components/Icons", () => ({
  CheckboxIcon: jest.fn(() => null),
  CircleIcon: jest.fn(() => null),
}));

// The global setup stubs useFocusEffect into a no-op, which would leave the
// on-focus refresh untested. Mirror the real hook instead: it runs its callback
// from an effect, not during render (running it inline would set state mid-
// render and never settle).
jest.mock("expo-router", () => ({
  __esModule: true,
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));

const level = (overrides: Partial<LevelType> = {}): LevelType => ({
  name: "Einsteiger",
  logo: "🌱",
  level: 0,
  tasks: {
    read: { name: "read", verbose: "Artikel lesen", value: true },
    share: { name: "share", verbose: "Artikel teilen", value: false },
  },
  ...overrides,
});

describe("AchievementComponent", () => {
  beforeEach(() => {
    mockGetCurrentAchievements.mockReset();
    mockUpdateBadgeState.mockReset();
    mockGetCurrentAchievements.mockResolvedValue(level());
  });

  it("lists every task of the current level", async () => {
    const { getByText } = await render(<AchievementComponent />);
    await waitFor(() => {
      expect(getByText("Artikel lesen")).toBeTruthy();
    });
    expect(getByText("Artikel teilen")).toBeTruthy();
  });

  // Levels are stored zero-based but shown one-based; an off-by-one here is
  // visible on the action tab.
  it("shows the level one-based, with the name from the config", async () => {
    mockGetCurrentAchievements.mockResolvedValue(level({ level: 1 }));
    const { getByText } = await render(<AchievementComponent />);
    await waitFor(() => {
      expect(getByText("Level 2: Profi")).toBeTruthy();
    });
  });

  it("renders the logo of the current level", async () => {
    mockGetCurrentAchievements.mockResolvedValue(level({ level: 1 }));
    const { getByText } = await render(<AchievementComponent />);
    await waitFor(() => {
      expect(getByText("🚀")).toBeTruthy();
    });
  });

  it("renders the static Mission heading before data arrives", async () => {
    const { getByText } = await render(<AchievementComponent />);
    expect(getByText("Mission")).toBeTruthy();
  });

  // The action tab's badge marks unseen progress; showing this component is
  // what counts as "seen", so the badge has to be cleared on focus.
  it("clears the action badge and refetches when the screen gains focus", async () => {
    await render(<AchievementComponent />);
    await waitFor(() => {
      expect(mockUpdateBadgeState).toHaveBeenCalledWith({ action: false });
    });
    // Once from the mount effect, once from the focus effect.
    expect(mockGetCurrentAchievements.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("copes with a level that has no tasks", async () => {
    mockGetCurrentAchievements.mockResolvedValue(level({ tasks: {} }));
    const { queryByText } = await render(<AchievementComponent />);
    await waitFor(() => {
      expect(mockGetCurrentAchievements).toHaveBeenCalled();
    });
    expect(queryByText("Artikel lesen")).toBeNull();
  });
});
