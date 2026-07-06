import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ContactScreen from "#/app/(tabs)/contact";
import API from "#/helpers/network/ServerAPI";

let mockParameters: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => mockParameters),
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "2.3.0",
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("expo-constants", () => ({
  expoConfig: { name: "Volksverpetzer" },
}));

jest.mock("#/constants/Config", () => ({
  wpUrl: "https://example.com",
}));

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: { postContact: jest.fn() },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: {
    accent: "#e63312",
    errorBackground: "#c00",
    muted: "#999",
    inputBackground: "#eee",
    surface: "#fff",
    text: "#000",
  },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { container: {}, content: {}, input: {}, whiteText: {} },
}));

jest.mock("#/components/animations/AnimatedHeader", () => jest.fn(() => null));
jest.mock("#/components/animations/AnimatedSuccess", () => jest.fn(() => null));
jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));
jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiSpace", () => jest.fn(() => null));
jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, ...props }: any) => (
    <Pressable {...props}>{children}</Pressable>
  ));
});
jest.mock("#/components/ui/UiTextInput", () => {
  const { TextInput } = require("react-native");
  return jest.fn((props: any) => <TextInput {...props} />);
});
jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));

const postContact = API.postContact as jest.Mock;

describe("ContactScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParameters = {};
    (postContact as jest.Mock<any>).mockResolvedValue({
      success: true,
      id: "abc",
    });
  });

  it("defaults to the fake-report category with a URL field", async () => {
    const { getByText } = await render(<ContactScreen />);
    expect(getByText("Fake melden")).toBeTruthy();
    expect(getByText("Link zum Fake")).toBeTruthy();
  });

  it("switches labels when another category is selected", async () => {
    const { getByText } = await render(<ContactScreen />);
    // open the dropdown, then pick app feedback
    await fireEvent.press(getByText("Fake melden"));
    await fireEvent.press(getByText("Feedback zur App"));
    expect(getByText("Betreff")).toBeTruthy();
    expect(getByText("Dein Feedback")).toBeTruthy();
  });

  it("pre-selects the category from route params", async () => {
    mockParameters = { category: "other" };
    const { getByText } = await render(<ContactScreen />);
    expect(getByText("Anderes Anliegen")).toBeTruthy();
    expect(getByText("Deine Nachricht")).toBeTruthy();
  });

  it("rejects a fake report without a link", async () => {
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput] = getAllByPlaceholderText("...");
    await fireEvent.changeText(titleInput, "kein link");
    await fireEvent.changeText(messageInput, "Das ist ein Fake, ehrlich.");
    await fireEvent.press(getByText("Senden"));

    expect(getByText("Bitte einen Link zum Fake eingeben")).toBeTruthy();
    expect(postContact).not.toHaveBeenCalled();
  });

  it("submits a valid request with app metadata", async () => {
    mockParameters = { category: "app_feedback" };
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput] = getAllByPlaceholderText("...");
    await fireEvent.changeText(titleInput, "Dark mode");
    await fireEvent.changeText(messageInput, "Der Dark Mode ist zu hell.");
    await fireEvent.press(getByText("Senden"));

    await waitFor(() =>
      expect(postContact).toHaveBeenCalledWith({
        category: "app_feedback",
        title: "Dark mode",
        message: "Der Dark Mode ist zu hell.",
        app_variant: "Volksverpetzer",
        app_version: "2.3.0",
        platform: expect.any(String),
      }),
    );
  });

  it("shows an error and allows retrying when submission fails", async () => {
    mockParameters = { category: "other" };
    (postContact as jest.Mock<any>).mockRejectedValue(new Error("network"));
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput] = getAllByPlaceholderText("...");
    await fireEvent.changeText(titleInput, "Betreff");
    await fireEvent.changeText(
      messageInput,
      "Eine ausreichend lange Nachricht.",
    );
    await fireEvent.press(getByText("Senden"));

    await waitFor(() =>
      expect(
        getByText("Senden fehlgeschlagen. Bitte versuche es später erneut."),
      ).toBeTruthy(),
    );

    // The button is re-enabled, so a retry triggers another request
    (postContact as jest.Mock<any>).mockResolvedValue({
      success: true,
      id: "abc",
    });
    await fireEvent.press(getByText("Senden"));
    await waitFor(() => expect(postContact).toHaveBeenCalledTimes(2));
  });
});
