import { fireEvent, render } from "@testing-library/react-native";

import type { OnBoardingData } from "#/screens/Onboarding/components/Flatboard";
import StandardStepper from "#/screens/Onboarding/components/Stepper";

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#e63312"),
  ColorScheme: { light: "light", dark: "dark" },
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = jest.requireActual("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = jest.requireActual("react-native");
  return jest.fn(({ children, onPress, ...props }: any) => (
    <Pressable onPress={onPress} {...props}>
      {children}
    </Pressable>
  ));
});

const makeData = (count: number): OnBoardingData[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Step ${i + 1}`,
    description: `Description ${i + 1}`,
  }));

const defaultHandlers = {
  onFinish: jest.fn(),
  previousStep: jest.fn(),
  nextStep: jest.fn(),
};

describe("StandardStepper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("back button", () => {
    it("hides the back button on the first step", async () => {
      const { queryByText } = await render(
        <StandardStepper step={0} data={makeData(3)} {...defaultHandlers} />,
      );
      expect(queryByText("Zurück")).toBeNull();
    });

    it("shows the back button on steps after the first", async () => {
      const { getByText } = await render(
        <StandardStepper step={1} data={makeData(3)} {...defaultHandlers} />,
      );
      expect(getByText("Zurück")).toBeTruthy();
    });

    it("calls previousStep when the back button is pressed", async () => {
      const { getByText } = await render(
        <StandardStepper step={2} data={makeData(4)} {...defaultHandlers} />,
      );
      await fireEvent.press(getByText("Zurück"));
      expect(defaultHandlers.previousStep).toHaveBeenCalledTimes(1);
    });
  });

  describe("next button", () => {
    it("shows Weiter on steps before the last", async () => {
      const { getByText } = await render(
        <StandardStepper step={0} data={makeData(3)} {...defaultHandlers} />,
      );
      expect(getByText("Weiter")).toBeTruthy();
    });

    it("calls nextStep when Weiter is pressed", async () => {
      const { getByText } = await render(
        <StandardStepper step={1} data={makeData(3)} {...defaultHandlers} />,
      );
      await fireEvent.press(getByText("Weiter"));
      expect(defaultHandlers.nextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe("finish button", () => {
    it("shows the finish button on the last step instead of Weiter", async () => {
      const { getByText, queryByText } = await render(
        <StandardStepper step={2} data={makeData(3)} {...defaultHandlers} />,
      );
      expect(getByText("Get Started")).toBeTruthy();
      expect(queryByText("Weiter")).toBeNull();
    });

    it("uses buttonTitle prop when provided", async () => {
      const { getByText } = await render(
        <StandardStepper
          step={2}
          data={makeData(3)}
          buttonTitle="Jetzt starten"
          {...defaultHandlers}
        />,
      );
      expect(getByText("Jetzt starten")).toBeTruthy();
    });

    it("calls onFinish when the finish button is pressed", async () => {
      const { getByText } = await render(
        <StandardStepper step={2} data={makeData(3)} {...defaultHandlers} />,
      );
      await fireEvent.press(getByText("Get Started"));
      expect(defaultHandlers.onFinish).toHaveBeenCalledTimes(1);
    });
  });
});
