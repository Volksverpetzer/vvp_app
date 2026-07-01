import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import AnnouncementCard from "#/components/posts/AnnouncementCard";
import type { AnnouncementEntry } from "#/constants/Announcements";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush }),
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

  it("renders the announcement message", () => {
    const { getByText } = render(
      <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
    );
    expect(getByText(announcement.message)).toBeTruthy();
  });

  it("renders both action buttons", () => {
    const { getByText } = render(
      <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
    );
    expect(getByText("Verstanden")).toBeTruthy();
    expect(getByText("Zu den Einstellungen")).toBeTruthy();
  });

  it("dismisses without navigating when 'Verstanden' is pressed", () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <AnnouncementCard announcement={announcement} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByText("Verstanden"));
    expect(onDismiss).toHaveBeenCalledWith(announcement.id);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("dismisses and navigates when the action button is pressed", () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <AnnouncementCard announcement={announcement} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByText("Zu den Einstellungen"));
    expect(onDismiss).toHaveBeenCalledWith(announcement.id);
    expect(mockPush).toHaveBeenCalledWith(announcement.route);
  });
});
