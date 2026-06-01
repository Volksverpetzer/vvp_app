import { useMemo } from "react";
import type { GestureResponderEvent } from "react-native";
import { StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

import type { OnBoardingData } from "./Flatboard";

interface StandardStepperProperties {
  step: number;
  data: OnBoardingData[];
  onFinish: (event: GestureResponderEvent) => void;
  previousStep: (event: GestureResponderEvent) => void;
  nextStep: (event: GestureResponderEvent) => void;
  accentColor?: string;
  buttonTitle?: string;
  hideIndicator?: boolean;
}

const StandardStepper = (properties: StandardStepperProperties) => {
  const {
    step,
    data,
    onFinish,
    previousStep,
    nextStep,
    accentColor,
    buttonTitle,
  } = properties;
  const corporate = useCorporateColor();
  return useMemo(
    () => (
      <View style={stepperStyles.stepper}>
        {step === 0 ? (
          <View style={{ width: 89 }} />
        ) : (
          <UiPressable accessibilityRole="button" onPress={previousStep}>
            <UiText style={stepperStyles.nextButton}>Zurück</UiText>
          </UiPressable>
        )}
        {[...Array.from({ length: data.length }).keys()].map((_, index) => {
          const opacity = step === index ? 1 : 0.3;
          return (
            <View
              key={String(index)} // we will use i for the key because no two (or more) elements in an array will have the same index
              style={{
                opacity,
                height: 5,
                width: 5,
                backgroundColor: accentColor,
                marginHorizontal: 3,
                marginVertical: 10,
                borderRadius: 5,
              }}
            />
          );
        })}
        {step < data.length - 1 ? (
          <UiPressable accessibilityRole="button" onPress={nextStep}>
            <UiText style={stepperStyles.nextButton}>Weiter</UiText>
          </UiPressable>
        ) : (
          <UiPressable
            accessibilityRole="button"
            onPress={onFinish}
            style={[
              stepperStyles.skipButton,
              { backgroundColor: accentColor || corporate },
            ]}
          >
            <UiText style={globalStyles.whiteText}>
              {buttonTitle || "Get Started"}
            </UiText>
          </UiPressable>
        )}
      </View>
    ),
    [
      accentColor,
      buttonTitle,
      corporate,
      data.length,
      nextStep,
      onFinish,
      previousStep,
      step,
    ],
  );
};

const stepperStyles = StyleSheet.create({
  nextButton: {
    borderRadius: 24,
    minWidth: 90,
    padding: 10,
    textAlign: "center",
  },
  skipButton: {
    alignItems: "center",
    borderRadius: 5,
    justifyContent: "center",
    minWidth: 90,
    padding: 10,
  },
  stepper: {
    alignItems: "center",
    bottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 50,
    position: "absolute",
    width: "100%",
    zIndex: 100,
  },
});

export default StandardStepper;
