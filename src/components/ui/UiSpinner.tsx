import { Image } from "expo-image";
import type {
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { ActivityIndicator, View } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { AppImages } from "#/helpers/AppImages";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";

type UiSpinnerProperties = ActivityIndicatorProps & {
  containerStyle?: StyleProp<ViewStyle>;
  text?: string;
  card?: boolean;
};

const UiSpinner = (props: UiSpinnerProperties) => {
  const { containerStyle, text, card, ...indicatorProps } = props;
  const corporate = useCorporateColor();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  const content = (
    <>
      {AppImages.loadingAnimation ? (
        <Image
          source={AppImages.loadingAnimation}
          style={{ width: 100, height: 100 }}
        />
      ) : (
        <ActivityIndicator color={corporate} {...indicatorProps} />
      )}
      {text && <UiText style={{ textAlign: "center" }}>{text}</UiText>}
    </>
  );

  if (card) {
    return (
      <View
        style={[
          globalStyles.centered,
          { alignSelf: "stretch" },
          containerStyle,
        ]}
      >
        <View
          style={{
            backgroundColor,
            borderRadius: 20,
            padding: 20,
            gap: 12,
            alignItems: "center",
            marginHorizontal: 20,
            alignSelf: "stretch",
          }}
        >
          {content}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        globalStyles.centered,
        {
          width: "100%",
          gap: 12,
          backgroundColor,
        },
        containerStyle,
      ]}
    >
      {content}
    </View>
  );
};

export default UiSpinner;
