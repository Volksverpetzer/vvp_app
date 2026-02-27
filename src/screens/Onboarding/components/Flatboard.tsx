import { Image } from "expo-image";
import type { FC } from "react";
import React, { useMemo, useRef, useState } from "react";
import type {
  GestureResponderEvent,
  ImageRequireSource,
  TextStyle,
} from "react-native";
import { FlatList, useWindowDimensions } from "react-native";

import { Logo } from "#/components/Icons";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import { styles } from "#/constants/Styles";
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
  accentColor?: string;
  buttonTitle?: string;
  variant?: "standard" | "modern";
  hideIndicator?: boolean;
  headingStyle?: TextStyle;
  descriptionStyle?: TextStyle;
}

const FlatBoard = (properties: FlatBoardProperties) => {
  const [step, setStep] = useState(0);
  const { height, width } = useWindowDimensions();
  const {
    data,
    onFinish,
    accentColor,
    buttonTitle,
    headingStyle,
    descriptionStyle,
  } = properties;
  const swipeReference = useRef<FlatList>(null);

  const nextStep = () => {
    setStep(step + 1);
    swipeReference.current &&
      swipeReference.current.scrollToIndex({
        animated: true,
        index: step + 1,
      });
  };

  const previousStep = () => {
    setStep(step - 1);
    swipeReference.current &&
      swipeReference.current.scrollToIndex({
        animated: true,
        index: step - 1,
      });
  };

  const ListItem = (properties: OnBoardingData) => {
    const corporate = useCorporateColor();
    const { title, description, icon, Component, TopComponent } = properties;
    return (
      <View>
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
        <View style={{ ...styles.centered, width, marginBottom: 100 }}>
          <Text
            style={{
              ...headingStyle,
              fontSize: height < 600 ? 22 : 24,
              paddingVertical: 10,
              color: corporate,
            }}
          >
            {title}
          </Text>
          {icon && (
            <Image
              style={{ height: height / 3, width: height / 3 }}
              source={icon}
            />
          )}
          {TopComponent && height > 600 && (
            <View
              style={{
                height: "auto",
                paddingVertical: 20,
                width: 200,
                ...styles.centered,
              }}
            >
              <TopComponent />
            </View>
          )}

          <Text
            style={{
              fontSize: 18,
              paddingVertical: 10,
              ...descriptionStyle,
              textAlign: "center",
              paddingHorizontal: 30,
            }}
          >
            {description.replace("\n", "").replaceAll(/\s+/g, " ").trim()}
          </Text>
          {Component && height > 600 && (
            <View style={{ width: 300, height: "auto" }}>
              <Component />
            </View>
          )}
        </View>
      </View>
    );
  };

  const MemoListItem = React.memo(ListItem);

  const onScrollEnd = (event) => {
    const index = Math.floor(
      Math.floor(event.nativeEvent.contentOffset.x) /
        Math.floor(event.nativeEvent.layoutMeasurement.width),
    );
    setStep(index);
  };

  return (
    <View style={{ flex: 1 }}>
      {useMemo(() => {
        return (
          <FlatList<OnBoardingData>
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item: OnBoardingData) => String(item.id)}
            ref={swipeReference}
            pagingEnabled
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onScrollEnd}
            data={data}
            renderItem={({ item }) => (
              <MemoListItem
                icon={item.icon}
                description={item.description}
                title={item.title}
                id={item.id}
                Component={item.Component}
                TopComponent={item.TopComponent}
              />
            )}
            contentContainerStyle={{ marginTop: "0%" }}
          />
        );
      }, [MemoListItem, data])}
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
