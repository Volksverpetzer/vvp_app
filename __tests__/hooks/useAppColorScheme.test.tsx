import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import SettingsStore from "#/helpers/Stores/SettingsStore";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ThemePreference } from "#/types";

// jest-setup mocks this hook globally; test the real implementation here.
jest.unmock("#/hooks/useAppColorScheme");

const mockUseColorScheme = jest.fn<() => "light" | "dark">();

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

const renderWith = (
  themePreference: ThemePreference,
  deviceScheme: "light" | "dark",
) => {
  mockUseColorScheme.mockReturnValue(deviceScheme);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsContext.Provider
      value={{
        contentSettings: SettingsStore.defaultContentSettings,
        advancedSettings: SettingsStore.defaultAdvancedSettings,
        setContentSettings: jest.fn(),
        setAdvancedSettings: jest.fn(),
        themePreference,
        setThemePreference: jest.fn(),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
  return renderHook(() => useAppColorScheme(), { wrapper });
};

describe("useAppColorScheme", () => {
  it("follows the device scheme on 'system'", async () => {
    expect((await renderWith("system", "dark")).result.current).toBe("dark");
    expect((await renderWith("system", "light")).result.current).toBe("light");
  });

  it("forces light even when the device is dark", async () => {
    const { result } = await renderWith("light", "dark");
    expect(result.current).toBe("light");
  });

  it("forces dark even when the device is light", async () => {
    const { result } = await renderWith("dark", "light");
    expect(result.current).toBe("dark");
  });
});
