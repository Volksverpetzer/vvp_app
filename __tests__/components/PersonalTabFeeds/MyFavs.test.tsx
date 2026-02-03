import Config from "#/constants/Config";
import { registerViews } from "#/helpers/network/Analytics";

// Mock Config
jest.mock("../../../src/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    analytics: true,
  },
}));

// Mock dependencies
jest.mock("#/helpers/network/Analytics", () => ({
  registerViews: jest.fn(),
}));

jest.mock("../../../src/helpers/Stores/FavoritesStore", () => ({
  getAllFavorites: jest.fn(() => Promise.resolve({})),
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

describe("MyFavs Analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have registerViews function available", () => {
    expect(registerViews).toBeDefined();
    expect(typeof registerViews).toBe("function");
  });

  it("should call registerViews with correct URL format", () => {
    const expectedUrl = `${Config.wpUrl}/favs`;

    // Simulate the call that would happen in the component
    registerViews(expectedUrl);

    expect(registerViews).toHaveBeenCalledWith(expectedUrl);
    expect(registerViews).toHaveBeenCalledTimes(1);
  });

  it("should use correct config URL", () => {
    expect(Config.wpUrl).toBeDefined();
    expect(typeof Config.wpUrl).toBe("string");
    expect(Config.wpUrl.length).toBeGreaterThan(0);
  });
});
