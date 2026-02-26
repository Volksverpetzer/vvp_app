import { Image } from "expo-image";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ViewStyle,
} from "react-native";

import View from "#/components/design/View";
import { styles } from "#/constants/Styles";
import { isVolksverpetzer } from "#/helpers/utils/variant";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

import LogoAnimation from "#assets/images/logo_animated.gif";

/**
 * UiSpinner renders a loading indicator or animated image depending on the app
 * name. On Volksverpetzer it shows a GIF, otherwise a native ActivityIndicator.
 * @param props - Props forwarded to the underlying ActivityIndicator.
 *                Optionally accepts `containerStyle` to override the outer view.
 * @returns React element displaying the loading animation.
 */
const UiSpinner = (
  props: ActivityIndicatorProps & { containerStyle?: ViewStyle },
) => {
  const { containerStyle, ...indicatorProps } = props;
  const corporate = useCorporateColor();
  return (
    <View style={[{ width: "100%", ...styles.centered }, containerStyle]}>
      {isVolksverpetzer ? (
        <Image source={LogoAnimation} style={{ width: 100, height: 100 }} />
      ) : (
        <ActivityIndicator color={corporate} {...indicatorProps} />
      )}
    </View>
  );
};

export default UiSpinner;
