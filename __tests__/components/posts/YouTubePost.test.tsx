import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import YouTubePost from "#/components/posts/YouTubePost";
import type { YouTubePostProperties } from "#/types";

jest.mock("@react-native-vector-icons/octicons/static", () => "Octicons");

jest.mock("expo-image", () => ({
  __esModule: true,
  Image: "Image",
}));

jest.mock("react-native-webview", () => ({ WebView: "WebView" }));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { enableEngagement: true, wpUrl: "https://example.com" },
}));

jest.mock("#/helpers/network/Analytics", () => ({
  __esModule: true,
  registerPostInteraction: jest.fn(),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
  useCorporateColor: () => "#1B7194",
}));

const thumb = { url: "https://example.com/t.jpg", width: 1, height: 1 };
const video: YouTubePostProperties = {
  id: "vid1",
  player: { embedHtml: "", embedHeight: "480", embedWidth: "854" },
  snippet: {
    publishedAt: "2026-06-26T04:00:00Z",
    channelId: "c",
    title: "Testvideo",
    description: "",
    thumbnails: { standard: thumb, high: thumb, default: thumb },
  },
  inView: true,
};

describe("YouTubePost view count", () => {
  it("shows the formatted view count when statistics are present", async () => {
    const { getByText } = await render(
      <YouTubePost {...video} statistics={{ viewCount: "12345" }} />,
    );
    expect(getByText("12.345")).toBeTruthy();
  });

  it("shows no badge when statistics are missing", async () => {
    const { queryByLabelText } = await render(<YouTubePost {...video} />);
    expect(queryByLabelText(/Aufrufe/)).toBeNull();
  });

  it("shows no badge for a zero count", async () => {
    const { queryByLabelText } = await render(
      <YouTubePost {...video} statistics={{ viewCount: "0" }} />,
    );
    expect(queryByLabelText(/Aufrufe/)).toBeNull();
  });

  it("shows no badge when the post is out of view", async () => {
    const { queryByLabelText } = await render(
      <YouTubePost
        {...video}
        inView={false}
        statistics={{ viewCount: "500" }}
      />,
    );
    expect(queryByLabelText(/Aufrufe/)).toBeNull();
  });
});
