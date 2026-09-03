import { act, fireEvent, render } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import { Dimensions } from "react-native";
import type { CustomRendererProps, TBlock } from "react-native-render-html";

import { ColorScheme, useAppColorScheme } from "#/hooks/useAppColorScheme";
import IframeRenderer from "#/screens/Home/components/article/renderer/IframeRenderer";

// Mock Config to provide wpUrl
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
  },
}));

// Mock expo-linking parse used in the component. `path` mirrors the real
// expo-linking behavior of omitting the leading slash (extractSlug below
// relies on that: path.split("/")[1] is the slug for a "/category/slug/..."
// permalink).
jest.mock("expo-linking", () => ({
  parse: (url: string) => {
    try {
      const parsed = new URL(url);
      return {
        hostname: parsed.hostname,
        path: parsed.pathname.replace(/^\/+/, ""),
      };
    } catch {
      return {};
    }
  },
}));

// Mock WordPressAPI.getPost so the wp-embedded-content fallback-card tests
// can simulate a slug LoadArticlePost can't resolve (deleted/renamed, or a
// non-"post" content type such as a WordPress "project" page).
const mockGetPost = jest.fn();
jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getPost: (...args: unknown[]) => mockGetPost(...args),
    create: jest.fn(() => ({
      getPost: (...args: unknown[]) => mockGetPost(...args),
    })),
    convertLoadProps: jest.fn((data) => data),
  },
}));

// Mock the Open Graph preview fetch used by LoadOpenGraphCard (the fallback
// card for a wp-embedded-content embed LoadArticlePost couldn't resolve) so
// its network call doesn't need a real fetch client in this test.
const mockFetchOpenGraphPreview = jest.fn();
jest.mock("#/helpers/utils/openGraph", () => ({
  fetchOpenGraphPreview: (...args: unknown[]) =>
    mockFetchOpenGraphPreview(...args),
}));

// Mock the html iframe hook to return predictable htmlAttribs
const mockUseHtmlIframeProps = jest.fn(() => ({
  htmlAttribs: { src: "https://example.com/embed" },
}));
jest.mock("@native-html/iframe-plugin", () => ({
  useHtmlIframeProps: () => mockUseHtmlIframeProps(),
}));

const mockUseAppColorScheme = useAppColorScheme as jest.Mock;

// We'll capture the last props passed to the WebView to inspect style.height updates
let mockLastWebViewProps: any = null;
jest.mock("react-native-webview", () => {
  const MockWebViewComponent = (props: any) => {
    mockLastWebViewProps = props;
    const ReactRuntime = jest.requireActual("react");
    return ReactRuntime.createElement("View", {
      testID: "mock-webview",
      style: props.style,
    });
  };
  return {
    __esModule: true,
    default: MockWebViewComponent,
    WebView: MockWebViewComponent,
  };
});

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
    mockUseAppColorScheme.mockReturnValue(ColorScheme.light);
  });

  it("updates webview height when onMessage posts a height", async () => {
    const onLinkPress = jest.fn();

    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { getByTestId } = await render(
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

    const { getByTestId } = await render(
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

    const { getByTestId } = await render(
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

    const { getByTestId } = await render(
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

    const { getByTestId } = await render(
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

  it("should add dark parameter to Datawrapper URLs based on color scheme", async () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    // Mock useAppColorScheme to return "dark"
    mockUseAppColorScheme.mockReturnValue(ColorScheme.dark);

    // Mock useHtmlIframeProps to return a Datawrapper URL
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: {
        src: "https://datawrapper.dwcdn.net/abc123/1/",
      },
    });

    await render(
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

  it("should add dark=false parameter to Datawrapper URLs in light mode", async () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    // Mock useAppColorScheme to return "light"
    mockUseAppColorScheme.mockReturnValue(ColorScheme.light);

    // Mock useHtmlIframeProps to return a Datawrapper URL
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: {
        src: "https://datawrapper.dwcdn.net/xyz789/2/",
      },
    });

    await render(
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
    mockUseAppColorScheme.mockReturnValue(ColorScheme.light);
  });

  describe("YouTube URL handling", () => {
    it("should disable autoplay parameter for youtube.com URLs", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube.com/embed/abc123?autoplay=1&start=10",
        },
      });

      await render(
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

    it("should add Referer header for youtube.com URLs", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube.com/embed/xyz789",
        },
      });

      await render(
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

    it("should handle youtube-nocookie.com URLs", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube-nocookie.com/embed/test123?autoplay=1",
        },
      });

      await render(
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

    it("should handle youtu.be URLs", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://youtu.be/short123?autoplay=1",
        },
      });

      await render(
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
    it("should pass through regular URLs without modification", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      const testUrl = "https://example.com/embed/content?param=value";
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: testUrl,
        },
      });

      await render(
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

    it("should pass through Vimeo URLs without modification", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      const testUrl = "https://player.vimeo.com/video/123456";
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: testUrl,
        },
      });

      await render(
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

    it("should pass through Twitter embed URLs without modification", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      const testUrl = "https://platform.twitter.com/embed/index.html";
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: testUrl,
        },
      });

      await render(
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
    it("should render ErrorCard when URL has no hostname", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Mock Linking.parse to return empty hostname
      const parseSpy = jest.spyOn(Linking, "parse").mockImplementation(() => ({
        scheme: null,
        hostname: "",
        path: null,
        queryParams: {},
      }));

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "invalid-url",
        },
      });

      const { getByText } = await render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(getByText("Error rendering iframe")).toBeTruthy();

      parseSpy.mockRestore();
    });

    it("should render ErrorCard when Linking.parse returns undefined hostname", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Mock Linking.parse to return undefined hostname
      const parseSpy = jest.spyOn(Linking, "parse").mockImplementation(() => ({
        scheme: null,
        hostname: undefined,
        path: null,
        queryParams: {},
      }));

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "://invalid",
        },
      });

      const { getByText } = await render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(getByText("Error rendering iframe")).toBeTruthy();

      parseSpy.mockRestore();
    });

    it("should render ErrorCard instead of crashing when src is missing and Linking.parse throws", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // htmlAttribs is typed as Record<string, string>, but a malformed
      // <iframe> with no src attribute at all genuinely yields undefined at
      // runtime. The real expo-linking Linking.parse throws for such
      // "cannot be empty"/unparseable input rather than returning a tolerant
      // fallback (unlike this test file's own mock), so simulate that here.
      const parseSpy = jest.spyOn(Linking, "parse").mockImplementation(() => {
        throw new Error("Invalid URL: cannot be empty");
      });

      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {} as { src: string },
      });

      const { getByText } = await render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      expect(getByText("Error rendering iframe")).toBeTruthy();

      parseSpy.mockRestore();
    });
  });

  describe("URL constructor failure handling", () => {
    it("should handle valid YouTube URLs correctly", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Test with a standard YouTube URL to verify normal processing
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://www.youtube.com/embed/test",
        },
      });

      await render(
        <IframeRenderer
          renderProps={renderProps}
          width={360}
          maxWidth={700}
          onLinkPress={onLinkPress}
        />,
      );

      // YouTube URLs should be processed with autoplay disabled and headers added
      expect(mockLastWebViewProps).not.toBeNull();
      expect(mockLastWebViewProps.source).toBeDefined();
      expect(mockLastWebViewProps.source.uri).toContain("youtube.com");
      expect(mockLastWebViewProps.source.uri).toContain("autoplay=0");
      expect(mockLastWebViewProps.source.headers).toBeDefined();
    });

    it("should handle minimal valid YouTube URLs", async () => {
      const onLinkPress = jest.fn();
      const renderProps = {} as unknown as CustomRendererProps<TBlock>;

      // Test with a minimal but valid YouTube URL
      mockUseHtmlIframeProps.mockReturnValue({
        htmlAttribs: {
          src: "https://youtube.com/",
        },
      });

      await render(
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
      expect(mockLastWebViewProps.source.uri).toContain("autoplay=0");
    });
  });
});

describe("IframeRenderer video embed sizing", () => {
  beforeEach(() => {
    mockUseHtmlIframeProps.mockClear();
    mockUseAppColorScheme.mockClear();
    mockLastWebViewProps = null;
    mockUseAppColorScheme.mockReturnValue(ColorScheme.light);
  });

  const getHeight = (props: any): number | undefined => {
    const style = props?.style;
    if (Array.isArray(style)) {
      for (const s of style) {
        if (s && typeof s.height === "number") return s.height;
      }
      return undefined;
    }
    return style && typeof style.height === "number" ? style.height : undefined;
  };

  it("sizes a YouTube embed to a fixed 16:9 height derived from width and ignores postMessage height", async () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://www.youtube.com/embed/abc123" },
    });

    await render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const expectedHeight = Math.round(360 * (9 / 16));
    expect(getHeight(mockLastWebViewProps)).toBe(expectedHeight);

    // A postMessage height (e.g. from the injected script, or a runaway
    // measurement) must not override the fixed 16:9 height for video.
    await act(async () => {
      mockLastWebViewProps.onMessage({ nativeEvent: { data: "9000" } });
      await Promise.resolve();
    });

    expect(getHeight(mockLastWebViewProps)).toBe(expectedHeight);
  });

  it("sizes a Vimeo embed to a fixed 16:9 height derived from width", async () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://player.vimeo.com/video/123456" },
    });

    await render(
      <IframeRenderer
        renderProps={renderProps}
        width={400}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    expect(getHeight(mockLastWebViewProps)).toBe(Math.round(400 * (9 / 16)));
  });

  it("derives the 16:9 height from the capped rendered width, not the raw width, on wide screens", async () => {
    // Regression: the WebView's own style caps its width at maxWidth + 40.
    // On a wide screen where width exceeds that cap, the height must be
    // derived from the capped width the WebView actually renders at, or the
    // video ends up taller than a correct 16:9 box for its real width.
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://www.youtube.com/embed/abc123" },
    });

    await render(
      <IframeRenderer
        renderProps={renderProps}
        width={1200}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    expect(getHeight(mockLastWebViewProps)).toBe(Math.round(740 * (9 / 16)));
  });

  it("does not treat a lookalike hostname as a video embed", async () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;
    // "notyoutube.com" contains "youtube.com" as a substring, which a naive
    // hostname.includes() check would wrongly match.
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://notyoutube.com/embed/abc123" },
    });

    await render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    // Falls back to the generic fallback height, not the 16:9 video height.
    expect(getHeight(mockLastWebViewProps)).toBe(360);

    await act(async () => {
      mockLastWebViewProps.onMessage({ nativeEvent: { data: "500" } });
      await Promise.resolve();
    });

    // Unlike video embeds, a postMessage height does update the size here.
    expect(getHeight(mockLastWebViewProps)).toBe(500);
  });
});

describe("IframeRenderer non-video height cap", () => {
  beforeEach(() => {
    mockUseHtmlIframeProps.mockClear();
    mockUseAppColorScheme.mockClear();
    mockLastWebViewProps = null;
    mockUseAppColorScheme.mockReturnValue(ColorScheme.light);
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: "https://example.com/embed" },
    });
  });

  it("caps an oversized postMessage height instead of growing without bound", async () => {
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    await render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const maxHeight = Dimensions.get("window").height * 4;

    await act(async () => {
      mockLastWebViewProps.onMessage({
        nativeEvent: { data: String(maxHeight + 5000) },
      });
      await Promise.resolve();
    });

    const style = mockLastWebViewProps.style;
    const height = Array.isArray(style)
      ? style.find((s: any) => s && typeof s.height === "number")?.height
      : style?.height;
    expect(height).toBe(maxHeight);
  });
});

describe("IframeRenderer wp-embedded-content fallback", () => {
  const embedSource =
    "https://www.volksverpetzer.de/project/landtagswahl-sachsen-anhalt/embed/#?secret=abc";
  const pageUrl =
    "https://www.volksverpetzer.de/project/landtagswahl-sachsen-anhalt/";

  beforeEach(() => {
    mockUseHtmlIframeProps.mockClear();
    mockUseAppColorScheme.mockClear();
    mockUseAppColorScheme.mockReturnValue(ColorScheme.light);
    mockGetPost.mockClear();
    mockFetchOpenGraphPreview.mockClear();
    mockUseHtmlIframeProps.mockReturnValue({
      htmlAttribs: { src: embedSource, class: "wp-embedded-content" },
    } as unknown as ReturnType<typeof mockUseHtmlIframeProps>);
    // e.g. a WordPress "project" page linked via "Sonst schau auch hier
    // vorbei:" — its REST endpoint isn't public, so getPost never resolves it.
    mockGetPost.mockResolvedValue(null);
  });

  it("shows an Open Graph preview card and links out to the real page", async () => {
    mockFetchOpenGraphPreview.mockResolvedValue({
      title: "Sachsen-Anhalt: Landtagswahl 2026",
      description: "Warum sich Wählen lohnt.",
      image: "https://www.volksverpetzer.de/preview.jpg",
    });
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { findByText } = await render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    expect(mockFetchOpenGraphPreview).toHaveBeenCalledWith(
      pageUrl,
      expect.anything(),
    );

    const title = await findByText("Sachsen-Anhalt: Landtagswahl 2026");
    expect(await findByText("Warum sich Wählen lohnt.")).toBeTruthy();

    fireEvent.press(title);

    expect(onLinkPress).toHaveBeenCalledWith(expect.anything(), pageUrl);
  });

  it("falls back to a humanized slug title when no Open Graph preview is available", async () => {
    mockFetchOpenGraphPreview.mockResolvedValue(null);
    const onLinkPress = jest.fn();
    const renderProps = {} as unknown as CustomRendererProps<TBlock>;

    const { findByText } = await render(
      <IframeRenderer
        renderProps={renderProps}
        width={360}
        maxWidth={700}
        onLinkPress={onLinkPress}
      />,
    );

    const title = await findByText("Landtagswahl Sachsen Anhalt");
    fireEvent.press(title);

    expect(onLinkPress).toHaveBeenCalledWith(expect.anything(), pageUrl);
  });
});
