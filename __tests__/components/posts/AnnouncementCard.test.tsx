import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import AnnouncementCard from "#/components/posts/AnnouncementCard";
import type { AnnouncementEntry } from "#/constants/Announcements";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush }),
}));

const mockOnLinkPress = jest.fn();
jest.mock("#/helpers/Linking", () => ({
  __esModule: true,
  onLinkPress: (...args: unknown[]) => mockOnLinkPress(...args),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: {
      primary: "#000",
      surface: "#eee",
      text: "#111",
      iconOnPrimary: "#fff",
    },
    dark: {
      primary: "#000",
      surface: "#eee",
      text: "#111",
      iconOnPrimary: "#fff",
    },
  },
}));

const announcement: AnnouncementEntry = {
  id: "pruefpunkt-feed-2026-07",
  message: "Wusstest du schon? Wir haben jetzt auch Prüfpunkt in unserer App!",
  actionLabel: "Zu den Einstellungen",
  route: "/settings",
};

describe("AnnouncementCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the announcement message", async () => {
    const { getByText } = await render(
      <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
    );
    expect(getByText(announcement.message)).toBeTruthy();
  });

  it("renders **bold** segments without the markers", async () => {
    const { getByText, queryByText } = await render(
      <AnnouncementCard
        announcement={{ ...announcement, message: "**Neu**: hallo" }}
        onDismiss={jest.fn()}
      />,
    );
    expect(getByText("Neu")).toBeTruthy();
    expect(queryByText("**Neu**: hallo")).toBeNull();
  });

  it("opens links via onLinkPress without rendering the markdown syntax", async () => {
    const { getByText, queryByText } = await render(
      <AnnouncementCard
        announcement={{
          ...announcement,
          message: "mehr auf [Prüfpunkt](https://pruefpunkt.org)",
        }}
        onDismiss={jest.fn()}
      />,
    );
    expect(queryByText(/\[Prüfpunkt\]/)).toBeNull();
    await fireEvent.press(getByText("Prüfpunkt"));
    expect(mockOnLinkPress).toHaveBeenCalledWith(
      "https://pruefpunkt.org",
      expect.anything(),
    );
  });

  it("renders both action buttons", async () => {
    const { getByText } = await render(
      <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
    );
    expect(getByText("Alles klar!")).toBeTruthy();
    expect(getByText("Zu den Einstellungen")).toBeTruthy();
  });

  it("dismisses without navigating when 'Alles klar!' is pressed", async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(
      <AnnouncementCard announcement={announcement} onDismiss={onDismiss} />,
    );
    await fireEvent.press(getByText("Alles klar!"));
    expect(onDismiss).toHaveBeenCalledWith(announcement.id);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("dismisses and navigates when the action button is pressed", async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(
      <AnnouncementCard announcement={announcement} onDismiss={onDismiss} />,
    );
    await fireEvent.press(getByText("Zu den Einstellungen"));
    expect(onDismiss).toHaveBeenCalledWith(announcement.id);
    expect(mockPush).toHaveBeenCalledWith(announcement.route);
  });
});
