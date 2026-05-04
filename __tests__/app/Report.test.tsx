import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import ReportScreen from "#/app/(tabs)/report";

let mockIsFocused = true;

jest.mock("@react-navigation/native", () => ({
  useIsFocused: jest.fn(() => mockIsFocused),
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success" },
}));

const mockSearchParams: Record<string, string | undefined> = {};
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => mockSearchParams),
}));

jest.mock("#/components/animations/AnimatedHeader", () => jest.fn(() => null));
jest.mock("#/components/animations/AnimatedSuccess", () => jest.fn(() => null));
jest.mock("#/components/design/Checkbox", () => {
  const { TouchableOpacity } = require("react-native");
  return jest.fn(({ checked, onChange, children }: any) => (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
    >
      {children}
    </TouchableOpacity>
  ));
});
jest.mock("#/components/design/Space", () => jest.fn(() => null));
jest.mock("#/components/design/TextInput", () => {
  const { TextInput } = require("react-native");
  return jest.fn((props: any) => <TextInput {...props} />);
});
jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});
jest.mock("#/screens/ReportTab/components/ReportStatusList", () =>
  jest.fn(() => null),
);

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  ColorScheme: { light: "light", dark: "dark" },
}));

jest.mock("#/constants/Colors", () => ({
  light: {
    accent: "#e63312",
    errorBackground: "#ff0000",
    muted: "#aaa",
    inputBackground: "#f5f5f5",
    surface: "#fff",
    text: "#000",
  },
}));

jest.mock("#/constants/Styles", () => ({
  styles: { container: {}, content: {}, input: {}, whiteText: {} },
}));

jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));

const mockGetReports = jest.fn<() => Promise<any[]>>(() => Promise.resolve([]));
const mockSetReports = jest.fn<(r: any) => Promise<void>>(() =>
  Promise.resolve(),
);
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getReports: () => mockGetReports(),
    setReports: (r: any) => mockSetReports(r),
  },
}));

const mockReportFake = jest.fn<(data: any) => Promise<{ id: string }>>(() =>
  Promise.resolve({ id: "report-1" }),
);
jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: { reportFake: (data: any) => mockReportFake(data) },
}));

describe("ReportScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused = true;
    delete mockSearchParams.url;
    delete mockSearchParams.index;
    mockGetReports.mockResolvedValue([]);
    mockSetReports.mockResolvedValue(undefined);
    mockReportFake.mockResolvedValue({ id: "report-1" });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("isFocused guard", () => {
    it("renders null when not focused", () => {
      mockIsFocused = false;
      const { toJSON } = render(<ReportScreen />);
      expect(toJSON()).toBeNull();
    });

    it("renders the form when focused", () => {
      const { getByText } = render(<ReportScreen />);
      expect(getByText("Zusammenfassung")).not.toBeNull();
    });
  });
});
