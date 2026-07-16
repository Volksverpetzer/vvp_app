import { Image } from "expo-image";
import type { FC } from "react";
import React, { useRef, useState } from "react";
import type {
  ColorValue,
  GestureResponderEvent,
  ImageRequireSource,
  LayoutChangeEvent,
  TextStyle,
} from "react-native";
import { Platform, View, useWindowDimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import type { ICarouselInstance } from "react-native-reanimated-carousel";

import { Logo } from "#/components/SvgIcons";
import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { isVolksverpetzer } from "#/helpers/utils/variant";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

import Stepper from "./Stepper";

export type OnBoardingData = {
  id: number;
  title: string;
  description: string;
  icon?: ImageRequireSource;
  Component?: FC;
  TopComponent?: FC | undefined;
};

interface FlatBoardProperties {
  data: OnBoardingData[];
  onFinish: (event: GestureResponderEvent) => void;
  accentColor?: ColorValue;
  buttonTitle?: string;
  variant?: "standard" | "modern";
  hideIndicator?: boolean;
  headingStyle?: TextStyle;
  descriptionStyle?: TextStyle;
}

interface SlideProps extends OnBoardingData {
  width: number;
  height: number;
  headingStyle?: TextStyle;
  descriptionStyle?: TextStyle;
}

const Slide = ({
  title,
  description,
  icon,
  Component,
  TopComponent,
  width,
  height,
  headingStyle,
  descriptionStyle,
}: SlideProps) => {
  const corporate = useCorporateColor();
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 100,
          marginTop: height / 20,
          alignItems: "center",
          width,
        }}
      >
        {isVolksverpetzer && <Logo color={corporate} />}
      </View>
      <View style={[globalStyles.centered, { width, marginBottom: 100 }]}>
        <UiText
          size="xxl"
          style={{
            ...headingStyle,
            paddingVertical: 10,
            color: corporate,
          }}
        >
          {title}
        </UiText>
        {icon && (
          <Image
            style={{ height: height / 3, width: height / 3 }}
            source={icon}
          />
        )}
        {TopComponent && height > 600 && (
          <View
            style={[
              globalStyles.centered,
              { height: "auto", paddingVertical: 20, width: 200 },
            ]}
          >
            <TopComponent />
          </View>
        )}
        <UiText
          size="lg"
          style={{
            paddingVertical: 10,
            ...descriptionStyle,
            textAlign: "center",
            paddingHorizontal: 30,
          }}
        >
          {description.replace("\n", "").replaceAll(/\s+/g, " ").trim()}
        </UiText>
        {Component && height > 600 && (
          <View style={{ width: 300, height: "auto" }}>
            <Component />
          </View>
        )}
      </View>
    </View>
  );
};

const MemoSlide = React.memo(Slide);

const FlatBoard = (properties: FlatBoardProperties) => {
  const [step, setStep] = useState(0);
  const targetStepRef = useRef(0);
  const { height, width } = useWindowDimensions();
  const [containerHeight, setContainerHeight] = useState(height);
  const {
    data,
    onFinish,
    accentColor,
    buttonTitle,
    headingStyle,
    descriptionStyle,
  } = properties;
  const carouselRef = useRef<ICarouselInstance>(null);

  const nextStep = () => {
    const next = Math.min(targetStepRef.current + 1, data.length - 1);
    targetStepRef.current = next;
    setStep(next);
    carouselRef.current?.scrollTo({ index: next, animated: true });
  };

  const previousStep = () => {
    const prev = Math.max(targetStepRef.current - 1, 0);
    targetStepRef.current = prev;
    setStep(prev);
    carouselRef.current?.scrollTo({ index: prev, animated: true });
  };

  const onSnapToItem = (index: number) => {
    targetStepRef.current = index;
    setStep(index);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  // On web the first render happens before the window is measured, and the
  // carousel throws on width 0; the dimensions update triggers a re-render
  if (!width) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {Platform.OS === "web" ? (
        // The reanimated carousel doesn't paint its items reliably on web;
        // the stepper drives navigation via the step state anyway, so web
        // only loses the swipe gesture
        <View style={{ flex: 1 }}>
          <MemoSlide
            {...data[step]}
            width={width}
            height={containerHeight}
            headingStyle={headingStyle}
            descriptionStyle={descriptionStyle}
          />
        </View>
      ) : (
        <Carousel
          ref={carouselRef}
          width={width}
          height={containerHeight}
          data={data}
          loop={false}
          onSnapToItem={onSnapToItem}
          renderItem={({ item }) => (
            <MemoSlide
              {...item}
              width={width}
              height={containerHeight}
              headingStyle={headingStyle}
              descriptionStyle={descriptionStyle}
            />
          )}
        />
      )}
      <Stepper
        step={step}
        data={data}
        onFinish={onFinish}
        accentColor={accentColor}
        previousStep={previousStep}
        nextStep={nextStep}
        buttonTitle={buttonTitle}
      />
    </View>
  );
};

export default React.memo(FlatBoard);
