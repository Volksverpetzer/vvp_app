import { Image } from "expo-image";
import type { ActivityIndicatorProps, ViewStyle } from "react-native";
import { ActivityIndicator } from "react-native";

import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { AppImages } from "#/helpers/AppImages";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

type UiSpinnerProperties = ActivityIndicatorProps & {
  containerStyle?: ViewStyle;
  text?: string;
};

const UiSpinner = (props: UiSpinnerProperties) => {
  const { containerStyle, text, ...indicatorProps } = props;
  const corporate = useCorporateColor();
  return (
    <View style={[globalStyles.centered, { width: "100%" }, containerStyle]}>
      {AppImages.loadingAnimation ? (
        <Image
          source={AppImages.loadingAnimation}
          style={{ width: 100, height: 100 }}
        />
      ) : (
        <ActivityIndicator color={corporate} {...indicatorProps} />
      )}
      {text && <UiText>{text}</UiText>}
    </View>
  );
};

export default UiSpinner;
