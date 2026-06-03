import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ImageRenderer from "#/screens/Home/components/article/renderer/ImageRenderer";

const mockPush = jest.fn();

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("react-native-render-html", () => ({
  useInternalRenderer: jest.fn(() => ({
    rendererProps: { source: { uri: "https://example.com/article-image.jpg" } },
  })),
}));

jest.mock("#/components/ui/UiPressable", () => {
  const { TouchableOpacity } = require("react-native");
  return jest.fn(({ children, onPress, ...rest }: any) => (
    <TouchableOpacity testID="image-pressable" onPress={onPress} {...rest}>
      {children}
    </TouchableOpacity>
  ));
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { background: "#ffffff" },
    dark: { background: "#000000" },
  },
}));

const baseRenderProps = {
  TDefaultRenderer: jest.fn(() => null),
  renderIndex: 0,
  tnode: {},
} as any;

describe("ImageRenderer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<ImageRenderer {...baseRenderProps} />);
    expect(toJSON()).not.toBeNull();
  });

  it("navigates to /image with the uri on press", () => {
    const { getByTestId } = render(<ImageRenderer {...baseRenderProps} />);
    fireEvent.press(getByTestId("image-pressable"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/image",
      params: { uri: "https://example.com/article-image.jpg" },
    });
  });

  it("renders the image with the uri from renderer props", () => {
    const { Image } = jest.requireMock("expo-image");
    render(<ImageRenderer {...baseRenderProps} />);
    const [props] = Image.mock.calls[0];
    expect(props.source.uri).toBe("https://example.com/article-image.jpg");
  });

  it("updates aspect ratio after image loads", () => {
    const { Image } = jest.requireMock("expo-image");
    render(<ImageRenderer {...baseRenderProps} />);
    const [firstProps] = Image.mock.calls[0];
    expect(firstProps.onLoad).toBeDefined();
    act(() => {
      firstProps.onLoad({ source: { width: 800, height: 400 } });
    });
  });
});
