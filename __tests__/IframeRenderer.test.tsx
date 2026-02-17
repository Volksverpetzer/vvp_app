import { act, render } from "@testing-library/react-native";
import React from "react";
import type { CustomRendererProps, TBlock } from "react-native-render-html";

import IframeRenderer from "../src/screens/Home/components/article/renderer/IframeRenderer";

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
jest.mock("@native-html/iframe-plugin", () => ({
  useHtmlIframeProps: () => ({
    htmlAttribs: { src: "https://example.com/embed" },
  }),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
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
});
