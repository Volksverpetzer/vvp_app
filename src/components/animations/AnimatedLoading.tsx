import { ActivityIndicator, Image } from "react-native";

import View from "#/components/design/View";
import { styles } from "#/constants/Styles";
import { isVolksverpetzer } from "#/helpers/utils/variant";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

import LogoAnimation from "#assets/images/LogoAnimation4_1.gif";

/**
 * AnimatedLoading renders a loading indicator or animated image
 * depending on the app name. On Volksverpetzer it shows a GIF,
 * otherwise a native ActivityIndicator.
 * @returns React element displaying the loading animation.
 */
const AnimatedLoading = () => {
  const corporate = useCorporateColor();
  return (
    <View
      style={{ backgroundColor: undefined, width: "100%", ...styles.centered }}
    >
      {isVolksverpetzer ? (
        <Image source={LogoAnimation} style={{ width: 100, height: 100 }} />
      ) : (
        <ActivityIndicator size="large" color={corporate} />
      )}
    </View>
  );
};

export default AnimatedLoading;
