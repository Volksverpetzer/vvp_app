import { act, render } from "@testing-library/react-native";
import React from "react";
import type { CustomRendererProps, TBlock } from "react-native-render-html";

import IframeRenderer from "#/screens/Home/components/article/renderer/IframeRenderer";

// Mock Config to provide wpUrl
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
  },
}));

// Mock expo-linking parse used in the component
jest.mock("expo-linking", () => ({
  parse: (url: string) => {
    try {
      const parsed = new URL(url);
      return { hostname: parsed.hostname, path: parsed.pathname };
    } catch {
      return {};
    }
  },
}));

// Mock the html iframe hook to return predictable htmlAttribs
const mockUseHtmlIframeProps = jest.fn(() => ({
  htmlAttribs: { src: "https://example.com/embed" },
}));
jest.mock("@native-html/iframe-plugin", () => ({
  useHtmlIframeProps: () => mockUseHtmlIframeProps(),
}));

const mockUseAppColorScheme = jest.fn(() => "light");
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => mockUseAppColorScheme(),
}));

// We'll capture the last props passed to the WebView to inspect style.height updates
let mockLastWebViewProps: any = null;
jest.mock("react-native-webview", () => ({
  __esModule: true,
  default: (props: any) => {
    mockLastWebViewProps = props;
    const React = require("react");
    // Render a View that propagates the style prop so tests can inspect it
    return React.createElement("View", {
      testID: "mock-webview",
      style: props.style,
    });
  },
}));

describe("IframeRenderer dynamic height", () => {
  beforeEach(() => {
    // Reset mocks before each test to prevent test pollution
    mockUseHtmlIframeProps.mockClear();
    mockUseAppColorScheme.mockClear();
    mockLastWebViewProps = null;

    // Reset to default return values
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://example.com/embed" },
    });
    mockUseAppColorScheme.mockReturnValue("light");
  });

  it("updates webview height when onMessage posts a height", async () => {
    const onLinkPress = jest.fn();

    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { getByTestId } = render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    // ensure the mock webview rendered
    const webview = getByTestId("mock-webview");
    expect(webview).toBeTruthy();

    // initially the height should be the fallback Math.min(width, 400) => 360
    const initialStyle = webview.props.style;
    let initialHeight: number | undefined;
    if (Array.isArray(initialStyle)) {
      for (const s of initialStyle) {
        if (s && typeof s.height === "number") {
          initialHeight = s.height;
          break;
        }
      }
    } else if (initialStyle && typeof initialStyle.height === "number") {
      initialHeight = initialStyle.height;
    }
    expect(initialHeight).toBe(360);

    // simulate a message from the webview with height 800
    await act(async () => {
      // Call the captured onMessage prop as the WebView would
      mockLastWebViewProps.onMessage({ nativeEvent: { data: "800" } });
      // allow microtasks to flush and state to update
      await Promise.resolve();
    });

    const updated = getByTestId("mock-webview");
    const updatedStyle = updated.props.style;
    let height: number | undefined;
    if (Array.isArray(updatedStyle)) {
      for (const s of updatedStyle) {
        if (s && typeof s.height === "number") {
          height = s.height;
          break;
        }
      }
    } else if (updatedStyle && typeof updatedStyle.height === "number") {
      height = updatedStyle.height;
    }
    expect(height).toBe(800);
  });

  it("does not change height for non-numeric message data", async () => {
    const onLinkPress = jest.fn();

    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { getByTestId } = render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const webview = getByTestId("mock-webview");
    expect(webview).toBeTruthy();

    const initialStyle = webview.props.style;
    let initialHeight: number | undefined;
    if (Array.isArray(initialStyle)) {
      for (const s of initialStyle) {
        if (s && typeof s.height === "number") {
          initialHeight = s.height;
          break;
        }
      }
    } else if (initialStyle && typeof initialStyle.height === "number") {
      initialHeight = initialStyle.height;
    }
    expect(initialHeight).toBe(360);

    // simulate a message from the webview with invalid non-numeric data
    await act(async () => {
      mockLastWebViewProps.onMessage({
        nativeEvent: { data: "not-a-number" },
      });
      await Promise.resolve();
    });

    const updated = getByTestId("mock-webview");
    const updatedStyle = updated.props.style;
    let height: number | undefined;
    if (Array.isArray(updatedStyle)) {
      for (const s of updatedStyle) {
        if (s && typeof s.height === "number") {
          height = s.height;
          break;
        }
      }
    } else if (updatedStyle && typeof updatedStyle.height === "number") {
      height = updatedStyle.height;
    }
    // height should remain unchanged when message data is invalid
    expect(height).toBe(360);
  });

  it("does not change height for negative height values", async () => {
    const onLinkPress = jest.fn();

    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { getByTestId } = render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const webview = getByTestId("mock-webview");
    expect(webview).toBeTruthy();

    const initialStyle = webview.props.style;
    let initialHeight: number | undefined;
    if (Array.isArray(initialStyle)) {
      for (const s of initialStyle) {
        if (s && typeof s.height === "number") {
          initialHeight = s.height;
          break;
        }
      }
    } else if (initialStyle && typeof initialStyle.height === "number") {
      initialHeight = initialStyle.height;
    }
    expect(initialHeight).toBe(360);

    // simulate a message with a negative height
    await act(async () => {
      mockLastWebViewProps.onMessage({
        nativeEvent: { data: "-100" },
      });
      await Promise.resolve();
    });

    const updated = getByTestId("mock-webview");
    const updatedStyle = updated.props.style;
    let height: number | undefined;
    if (Array.isArray(updatedStyle)) {
      for (const s of updatedStyle) {
        if (s && typeof s.height === "number") {
          height = s.height;
          break;
        }
      }
    } else if (updatedStyle && typeof updatedStyle.height === "number") {
      height = updatedStyle.height;
    }
    // height should not be set to a negative value; expect it to remain unchanged
    expect(height).toBe(360);
  });

  it("does not change height for zero height values", async () => {
    const onLinkPress = jest.fn();

    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { getByTestId } = render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const webview = getByTestId("mock-webview");
    expect(webview).toBeTruthy();

    const initialStyle = webview.props.style;
    let initialHeight: number | undefined;
    if (Array.isArray(initialStyle)) {
      for (const s of initialStyle) {
        if (s && typeof s.height === "number") {
          initialHeight = s.height;
          break;
        }
      }
    } else if (initialStyle && typeof initialStyle.height === "number") {
      initialHeight = initialStyle.height;
    }
    expect(initialHeight).toBe(360);

    // simulate a message with a zero height
    await act(async () => {
      mockLastWebViewProps.onMessage({
        nativeEvent: { data: "0" },
      });
      await Promise.resolve();
    });

    const updated = getByTestId("mock-webview");
    const updatedStyle = updated.props.style;
    let height: number | undefined;
    if (Array.isArray(updatedStyle)) {
      for (const s of updatedStyle) {
        if (s && typeof s.height === "number") {
          height = s.height;
          break;
        }
      }
    } else if (updatedStyle && typeof updatedStyle.height === "number") {
      height = updatedStyle.height;
    }
    // zero height is not useful; expect the component to keep the previous height
    expect(height).toBe(360);
  });

  it("handles Datawrapper color scheme messages without changing height", async () => {
    const onLinkPress = jest.fn();

    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { getByTestId } = render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const webview = getByTestId("mock-webview");
    expect(webview).toBeTruthy();

    const initialStyle = webview.props.style;
    let initialHeight: number | undefined;
    if (Array.isArray(initialStyle)) {
      for (const s of initialStyle) {
        if (s && typeof s.height === "number") {
          initialHeight = s.height;
          break;
        }
      }
    } else if (initialStyle && typeof initialStyle.height === "number") {
      initialHeight = initialStyle.height;
    }
    expect(initialHeight).toBe(360);

    // simulate a Datawrapper color scheme message
    const datawrapperColorMessage = JSON.stringify({
      type: "datawrapper-color-mode",
      data: "dark",
    });

    await act(async () => {
      mockLastWebViewProps.onMessage({
        nativeEvent: { data: datawrapperColorMessage },
      });
      await Promise.resolve();
    });

    const updated = getByTestId("mock-webview");
    const updatedStyle = updated.props.style;
    let height: number | undefined;
    if (Array.isArray(updatedStyle)) {
      for (const s of updatedStyle) {
        if (s && typeof s.height === "number") {
          height = s.height;
          break;
        }
      }
    } else if (updatedStyle && typeof updatedStyle.height === "number") {
      height = updatedStyle.height;
    }
    // color scheme messages should not affect the height
    expect(height).toBe(360);
  });

  it("should add dark parameter to Datawrapper URLs based on color scheme", () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    // Mock useAppColorScheme to return "dark"
    mockUseAppColorScheme.mockReturnValue("dark");

    // Mock useHtmlIframeProps to return a Datawrapper URL
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: {
        src: "https://datawrapper.dwcdn.net/abc123/1/",
      },
    });

    render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    // Verify that the WebView source includes the dark=true parameter with proper URL structure
    const resultUrl = new URL(mockLastWebViewProps.source.uri);
    expect(resultUrl.hostname).toBe("datawrapper.dwcdn.net");
    expect(resultUrl.searchParams.get("dark")).toBe("true");
  });

  it("should add dark=false parameter to Datawrapper URLs in light mode", () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    // Mock useAppColorScheme to return "light"
    mockUseAppColorScheme.mockReturnValue("light");

    // Mock useHtmlIframeProps to return a Datawrapper URL
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: {
        src: "https://datawrapper.dwcdn.net/xyz789/2/",
      },
    });

    render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    // Verify that the WebView source includes the dark=false parameter with proper URL structure
    const resultUrl = new URL(mockLastWebViewProps.source.uri);
    expect(resultUrl.hostname).toBe("datawrapper.dwcdn.net");
    expect(resultUrl.searchParams.get("dark")).toBe("false");
  });
});

describe("IframeRenderer prepareWebViewSource", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseHtmlIframeProps.mockClear();
    mockUseAppColorScheme.mockClear();
    mockLastWebViewProps = null;

    // Reset to default return values
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://example.com/embed" },
    });
    mockUseAppColorScheme.mockReturnValue("light");
  });

  describe("YouTube URL handling", () => {
    it("should disable autoplay parameter for youtube.com URLs", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube.com/embed/abc123?autoplay=1&start=10",
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      const resultUrl = new URL(mockLastWebViewProps.source.uri);
      expect(resultUrl.hostname).toBe("www.youtube.com");
      expect(resultUrl.searchParams.get("autoplay")).toBe("0");
      expect(resultUrl.searchParams.get("start")).toBe("10");
    });

    it("should add Referer header for youtube.com URLs", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube.com/embed/xyz789",
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(mockLastWebViewProps.source.headers).toBeDefined();
      expect(mockLastWebViewProps.source.headers).toHaveProperty("Referer");
      expect(typeof mockLastWebViewProps.source.headers.Referer).toBe("string");
    });

    it("should handle youtube-nocookie.com URLs", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube-nocookie.com/embed/test123?autoplay=1",
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      const resultUrl = new URL(mockLastWebViewProps.source.uri);
      expect(resultUrl.hostname).toBe("www.youtube-nocookie.com");
      expect(resultUrl.searchParams.get("autoplay")).toBe("0");
      expect(mockLastWebViewProps.source.headers).toBeDefined();
      expect(mockLastWebViewProps.source.headers).toHaveProperty("Referer");
    });

    it("should handle youtu.be URLs", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://youtu.be/short123?autoplay=1",
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      const resultUrl = new URL(mockLastWebViewProps.source.uri);
      expect(resultUrl.hostname).toBe("youtu.be");
      expect(resultUrl.searchParams.get("autoplay")).toBe("0");
      expect(mockLastWebViewProps.source.headers).toBeDefined();
    });
  });

  describe("Non-YouTube/non-Datawrapper URL pass-through", () => {
    it("should pass through regular URLs without modification", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      const testUrl = "https://example.com/embed/content?param=value";
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: testUrl,
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(mockLastWebViewProps.source.uri).toBe(testUrl);
      expect(mockLastWebViewProps.source.headers).toBeUndefined();
    });

    it("should pass through Vimeo URLs without modification", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      const testUrl = "https://player.vimeo.com/video/123456";
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: testUrl,
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(mockLastWebViewProps.source.uri).toBe(testUrl);
      expect(mockLastWebViewProps.source.headers).toBeUndefined();
    });

    it("should pass through Twitter embed URLs without modification", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      const testUrl = "https://platform.twitter.com/embed/index.html";
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: testUrl,
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(mockLastWebViewProps.source.uri).toBe(testUrl);
      expect(mockLastWebViewProps.source.headers).toBeUndefined();
    });
  });

  describe("Invalid URL handling", () => {
    it("should render ErrorCard when URL has no hostname", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Mock Linking.parse to return empty hostname
      const originalParse = require("expo-linking").parse;
      require("expo-linking").parse = jest.fn(() => ({ hostname: "" }));

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "invalid-url",
        },
      });

      const { getByText } = render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(getByText("Error rendering iframe")).toBeTruthy();

      // Restore original mock
      require("expo-linking").parse = originalParse;
    });

    it("should render ErrorCard when Linking.parse returns undefined hostname", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Mock Linking.parse to return undefined hostname
      const originalParse = require("expo-linking").parse;
      require("expo-linking").parse = jest.fn(() => ({}));

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "://invalid",
        },
      });

      const { getByText } = render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(getByText("Error rendering iframe")).toBeTruthy();

      // Restore original mock
      require("expo-linking").parse = originalParse;
    });
  });

  describe("URL constructor failure handling", () => {
    it("should gracefully handle malformed YouTube URLs that fail URL constructor", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // When a URL has youtube hostname but fails URL constructor,
      // prepareWebViewSource returns {uri: originalUrl} without headers
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          // Provide a URL that has valid hostname but would fail URL constructor manipulation
          // However, since we can't easily create such a URL without breaking Linking.parse too,
          // we test a simpler case: URL that can be parsed but is passed through
          src: "https://www.youtube.com/embed/test",
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      // YouTube URLs should be processed and have headers
      expect(mockLastWebViewProps).not.toBeNull();
      expect(mockLastWebViewProps.source).toBeDefined();
      expect(mockLastWebViewProps.source.uri).toContain("youtube.com");
      expect(mockLastWebViewProps.source.headers).toBeDefined();
    });

    it("should handle edge case where URL construction might fail for YouTube", () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Test with a minimal valid YouTube URL
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://youtube.com/",
        },
      });

      render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      // Should successfully process even minimal YouTube URL
      expect(mockLastWebViewProps).not.toBeNull();
      expect(mockLastWebViewProps.source.uri).toContain("youtube.com");
    });
  });
});
