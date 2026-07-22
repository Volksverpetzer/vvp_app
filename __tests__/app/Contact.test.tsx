import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ContactScreen from "#/app/(tabs)/contact";
import API from "#/helpers/network/ServerAPI";
import { FetchError } from "#/helpers/utils/networking";

let mockParameters: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => mockParameters),
  useFocusEffect: jest.fn((callback: () => void) => callback()),
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
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
    surfaceError: "#c00",
    error: "#c00",
    surfaceDisabled: "#999",
    surfaceInput: "#eee",
    surface: "#fff",
    text: "#000",
  },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { container: {}, content: {}, input: {}, whiteText: {} },
  INPUT_FONT_SIZE: 18,
}));

jest.mock("#/components/animations/AnimatedHeader", () => jest.fn(() => null));
jest.mock("#/components/animations/AnimatedSuccess", () => jest.fn(() => null));
jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));
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

  it("defaults to the feedback category with a title field", async () => {
    const { getByText } = await render(<ContactScreen />);
    expect(getByText("Feedback")).toBeTruthy();
    expect(getByText("Betreff")).toBeTruthy();
  });

  it("shows all category pills and switches labels on selection", async () => {
    const { getByText } = await render(<ContactScreen />);
    expect(getByText("Feedback")).toBeTruthy();
    expect(getByText("Fake reporten")).toBeTruthy();
    expect(getByText("Sonstiges")).toBeTruthy();

    await fireEvent.press(getByText("Fake reporten"));
    expect(getByText("Link zum Fake")).toBeTruthy();
    expect(getByText("Was ist daran falsch?")).toBeTruthy();
  });

  it("pre-selects the category from route params", async () => {
    mockParameters = { category: "other" };
    const { getByText } = await render(<ContactScreen />);
    expect(getByText("Sonstiges")).toBeTruthy();
    expect(getByText("Deine Nachricht")).toBeTruthy();
  });

  it("defaults a url without category to the fake-report category", async () => {
    mockParameters = { url: "https://example.com/fake" };
    const { getByText, getByDisplayValue } = await render(<ContactScreen />);
    expect(getByText("Fake reporten")).toBeTruthy();
    expect(getByDisplayValue("https://example.com/fake")).toBeTruthy();
  });

  it("prefills article feedback with the url in the message text", async () => {
    mockParameters = {
      category: "app_feedback",
      url: "https://example.com/artikel",
      title: "Ein echter Titel",
      index: "3",
    };
    const { getByText, getByDisplayValue } = await render(<ContactScreen />);
    expect(getByText("Feedback")).toBeTruthy();
    expect(getByDisplayValue("Artikel: Ein echter Titel")).toBeTruthy();
    expect(
      getByDisplayValue("https://example.com/artikel\nAbsatz 3\n\n"),
    ).toBeTruthy();
  });

  it("rejects a fake report without a link", async () => {
    mockParameters = { category: "report_fake" };
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput] = getAllByPlaceholderText("...");
    await fireEvent.changeText(messageInput, "Das ist ein Fake, ehrlich.");

    // Not a link at all, and a scheme the server would reject with 400
    for (const invalidUrl of ["kein link", "httpx://example.com"]) {
      await fireEvent.changeText(titleInput, invalidUrl);
      await fireEvent.press(getByText("Senden"));
      expect(getByText("Bitte einen Link zum Fake eingeben")).toBeTruthy();
    }
    // The offending input is highlighted with the error border
    expect(titleInput).toHaveStyle({ borderColor: "#c00" });
    expect(messageInput).not.toHaveStyle({ borderColor: "#c00" });
    expect(postContact).not.toHaveBeenCalled();

    // Editing the field clears the error indication again
    await fireEvent.changeText(titleInput, "https://example.com/fake");
    expect(titleInput).not.toHaveStyle({ borderColor: "#c00" });
  });

  it("rejects a too short message with the minimum length in the error", async () => {
    mockParameters = { category: "other" };
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput] = getAllByPlaceholderText("...");
    await fireEvent.changeText(titleInput, "Betreff");
    await fireEvent.changeText(messageInput, "zu kurz");
    await fireEvent.press(getByText("Senden"));

    expect(
      getByText("Bitte eine kurze Nachricht eingeben (mindestens 10 Zeichen)"),
    ).toBeTruthy();
    expect(messageInput).toHaveStyle({ borderColor: "#c00" });
    expect(postContact).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    mockParameters = { category: "other" };
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput, emailInput] =
      getAllByPlaceholderText("...");
    await fireEvent.changeText(titleInput, "Betreff");
    await fireEvent.changeText(
      messageInput,
      "Eine ausreichend lange Nachricht.",
    );
    await fireEvent.changeText(emailInput, "kein-at-zeichen");
    await fireEvent.press(getByText("Senden"));

    expect(
      getByText("Bitte eine gültige E-Mail-Adresse eingeben"),
    ).toBeTruthy();
    expect(emailInput).toHaveStyle({ borderColor: "#c00" });
    expect(postContact).not.toHaveBeenCalled();
  });

  it("submits a valid request with app metadata", async () => {
    mockParameters = { category: "app_feedback" };
    const { getByText, getAllByPlaceholderText } = await render(
      <ContactScreen />,
    );
    const [titleInput, messageInput, emailInput] =
      getAllByPlaceholderText("...");
    await fireEvent.changeText(titleInput, "Dark mode");
    await fireEvent.changeText(messageInput, "Der Dark Mode ist zu hell.");
    await fireEvent.changeText(emailInput, "user@example.com");
    await fireEvent.press(getByText("Senden"));

    await waitFor(() =>
      expect(postContact).toHaveBeenCalledWith({
        category: "app_feedback",
        title: "Dark mode",
        message: "Der Dark Mode ist zu hell.",
        email: "user@example.com",
        app_variant: "Volksverpetzer",
        app_version: "2.3.0",
        platform: expect.any(String),
      }),
    );
  });

  it("omits the email field when left blank", async () => {
    mockParameters = { category: "other" };
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

    await waitFor(() => expect(postContact).toHaveBeenCalledTimes(1));
    expect((postContact.mock.calls[0] as unknown[])[0]).not.toHaveProperty(
      "email",
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

  it("shows a rate-limit message when submission fails with 429", async () => {
    mockParameters = { category: "other" };
    (postContact as jest.Mock<any>).mockRejectedValue(
      new FetchError("Too Many Requests", {
        status: 429,
        statusText: "Too Many Requests",
        url: "https://example.com/contact",
        body: null,
      }),
    );
    const { getByText, queryByText, getAllByPlaceholderText } = await render(
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
        getByText(
          "Zu viele Anfragen. Bitte warte eine Minute und versuche es dann erneut.",
        ),
      ).toBeTruthy(),
    );
    expect(
      queryByText("Senden fehlgeschlagen. Bitte versuche es später erneut."),
    ).toBeNull();
  });
});
