import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import SettingsStore from "#/helpers/Stores/SettingsStore";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import ThemeSetting from "#/screens/Settings/components/ThemeSetting";
import type { ThemePreference } from "#/types";

const renderWith = (
  themePreference: ThemePreference,
  setThemePreference = jest.fn(),
) =>
  render(
    <SettingsContext.Provider
      value={{
        contentSettings: SettingsStore.defaultContentSettings,
        advancedSettings: SettingsStore.defaultAdvancedSettings,
        setContentSettings: jest.fn(),
        setAdvancedSettings: jest.fn(),
        themePreference,
        setThemePreference,
      }}
    >
      <ThemeSetting />
    </SettingsContext.Provider>,
  );

describe("ThemeSetting", () => {
  it("marks the current preference as checked", async () => {
    const { getByTestId } = await renderWith("dark");

    expect(
      getByTestId("themeOption-dark").props.accessibilityState.checked,
    ).toBe(true);
    expect(
      getByTestId("themeOption-system").props.accessibilityState.checked,
    ).toBe(false);
  });

  it("sets the preference when an option is pressed", async () => {
    const setThemePreference = jest.fn();
    const { getByTestId } = await renderWith("system", setThemePreference);

    await fireEvent.press(getByTestId("themeOption-light"));

    expect(setThemePreference).toHaveBeenCalledWith("light");
  });
});
