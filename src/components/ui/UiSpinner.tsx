import { Image } from "expo-image";
import type {
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { ActivityIndicator, View } from "react-native";

import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { AppImages } from "#/helpers/AppImages";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

type UiSpinnerProperties = ActivityIndicatorProps & {
  containerStyle?: StyleProp<ViewStyle>;
  text?: string;
};

// Branded loading image size per named spinner size: double React Native's
// stock ActivityIndicator sizes (small ~20, large ~36) so the image reads at a
// comparable visual weight to the old fixed 100px.
const IMAGE_SIZE = { small: 40, large: 72 } as const;

const UiSpinner = (props: UiSpinnerProperties) => {
  const { containerStyle, text, ...indicatorProps } = props;
  const corporate = useCorporateColor();
  const imageSize =
    typeof indicatorProps.size === "number"
      ? indicatorProps.size
      : IMAGE_SIZE[indicatorProps.size ?? "small"];
  return (
    <View
      style={[
        globalStyles.centered,
        { width: "100%", gap: 12 },
        containerStyle,
      ]}
    >
      {AppImages.loadingAnimation ? (
        <Image
          source={AppImages.loadingAnimation}
          style={{ width: imageSize, height: imageSize }}
        />
      ) : (
        <ActivityIndicator color={corporate} {...indicatorProps} />
      )}
      {text && <UiText style={{ textAlign: "center" }}>{text}</UiText>}
    </View>
  );
};

export default UiSpinner;
