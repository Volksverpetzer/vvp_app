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

const mockRegisterAnnouncementEvent = jest.fn((..._args: unknown[]) =>
  Promise.resolve(),
);
jest.mock("#/helpers/network/Analytics", () => ({
  __esModule: true,
  registerAnnouncementEvent: (...args: unknown[]) =>
    mockRegisterAnnouncementEvent(...args),
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
      onPrimary: "#fff",
    },
    dark: {
      primary: "#000",
      surface: "#eee",
      text: "#111",
      onPrimary: "#fff",
    },
  },
}));

let mockMascot: number | null = null;
jest.mock("#/helpers/AppImages", () => ({
  get AppImages() {
    return { announcementMascot: mockMascot };
  },
}));

const announcement: AnnouncementEntry = {
  id: "pruefpunkt-feed-2026-07",
  message: "Wusstest du schon? Wir haben jetzt auch Prüfpunkt in unserer App!",
  actionLabel: "Zu den Einstellungen",
  route: "/settings",
};

describe("AnnouncementCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMascot = null;
  });

  it("renders no mascot when the variant has none", async () => {
    const { queryByTestId } = await render(
      <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
    );
    expect(queryByTestId("announcementMascot")).toBeNull();
  });

  it("renders the mascot without intercepting touches", async () => {
    mockMascot = 1;
    const { getByTestId } = await render(
      <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
    );
    expect(getByTestId("announcementMascot").props.style).toEqual(
      expect.objectContaining({ pointerEvents: "none" }),
    );
  });

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

  it("dismisses and opens the url via onLinkPress for an external action", async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(
      <AnnouncementCard
        announcement={{
          id: "external",
          message: "Jetzt abstimmen!",
          actionLabel: "Abstimmen",
          route: "https://example.org/vote",
        }}
        onDismiss={onDismiss}
      />,
    );
    await fireEvent.press(getByText("Abstimmen"));
    expect(onDismiss).toHaveBeenCalledWith("external");
    expect(mockOnLinkPress).toHaveBeenCalledWith(
      "https://example.org/vote",
      expect.anything(),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  describe("analytics", () => {
    it("reports an impression only once per announcement per session", async () => {
      const shown = { ...announcement, id: "impression-once" };
      const { rerender } = await render(
        <AnnouncementCard key="a" announcement={shown} onDismiss={jest.fn()} />,
      );
      // A new key forces a re-mount, as a feed refresh or tab switch would.
      await rerender(
        <AnnouncementCard key="b" announcement={shown} onDismiss={jest.fn()} />,
      );
      const impressions = mockRegisterAnnouncementEvent.mock.calls.filter(
        ([event]) => event === "Announcement Shown",
      );
      expect(impressions).toEqual([["Announcement Shown", "impression-once"]]);
    });

    it("reports a dismissal when 'Alles klar!' is pressed", async () => {
      const { getByText } = await render(
        <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
      );
      await fireEvent.press(getByText("Alles klar!"));
      expect(mockRegisterAnnouncementEvent).toHaveBeenCalledWith(
        "Announcement Dismissed",
        announcement.id,
      );
      expect(mockRegisterAnnouncementEvent).not.toHaveBeenCalledWith(
        "Announcement Action",
        expect.anything(),
        expect.anything(),
      );
    });

    it("reports a button action", async () => {
      const { getByText } = await render(
        <AnnouncementCard announcement={announcement} onDismiss={jest.fn()} />,
      );
      await fireEvent.press(getByText("Zu den Einstellungen"));
      expect(mockRegisterAnnouncementEvent).toHaveBeenCalledWith(
        "Announcement Action",
        announcement.id,
        { source: "button" },
      );
    });

    it("reports an inline link tap as a link action", async () => {
      const { getByText } = await render(
        <AnnouncementCard
          announcement={{
            ...announcement,
            message: "mehr auf [Prüfpunkt](https://pruefpunkt.org)",
          }}
          onDismiss={jest.fn()}
        />,
      );
      await fireEvent.press(getByText("Prüfpunkt"));
      expect(mockRegisterAnnouncementEvent).toHaveBeenCalledWith(
        "Announcement Action",
        announcement.id,
        { source: "link" },
      );
    });
  });
});
