import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import SettingsSection from "#/screens/Settings/components/SettingsSection";

describe("SettingsSection", () => {
  it("shows the description and content once expanded", async () => {
    const { getByText, queryByText } = await render(
      <SettingsSection
        icon={null}
        title="Darstellung"
        description="Wähle, ob die App hell oder dunkel angezeigt wird."
      >
        <Text>Inhalt</Text>
      </SettingsSection>,
    );

    expect(queryByText("Inhalt")).toBeNull();
    await fireEvent.press(getByText("Darstellung"));

    expect(
      getByText("Wähle, ob die App hell oder dunkel angezeigt wird."),
    ).toBeTruthy();
    expect(getByText("Inhalt")).toBeTruthy();
  });

  it("renders without a description", async () => {
    const { getByText } = await render(
      <SettingsSection icon={null} title="Erweitert">
        <Text>Inhalt</Text>
      </SettingsSection>,
    );

    await fireEvent.press(getByText("Erweitert"));

    expect(getByText("Inhalt")).toBeTruthy();
  });
});
