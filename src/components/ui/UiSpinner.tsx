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
};

const UiSpinner = (props: UiSpinnerProperties) => {
  const { containerStyle, text, ...indicatorProps } = props;
  const corporate = useCorporateColor();
  const colorScheme = useAppColorScheme();
  return (
    <View
      style={[
        globalStyles.centered,
        {
          width: "100%",
          gap: 12,
          backgroundColor: Colors[colorScheme].background,
        },
        containerStyle,
      ]}
    >
      {AppImages.loadingAnimation ? (
        <Image
          source={AppImages.loadingAnimation}
          style={{ width: 100, height: 100 }}
        />
      ) : (
        <ActivityIndicator color={corporate} {...indicatorProps} />
      )}
      {text && <UiText style={{ textAlign: "center" }}>{text}</UiText>}
    </View>
  );
};

export default UiSpinner;
