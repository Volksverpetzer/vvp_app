import { isVolksverpetzer } from "#/helpers/utils/variant";

import VVPLogoAnimation from "#assets/images/logo_animated.gif";
import MimikamaShopButton from "#assets/images/mimikama/button_shop.webp";
import VVPShopButton from "#assets/images/volksverpetzer/button_shop.webp";

export const AppImages = {
  /** Shop button overlay image, or null if variant has no shop configured */
  shopButton: isVolksverpetzer ? VVPShopButton : MimikamaShopButton,
  /** Loading animation, or null to fall back to ActivityIndicator */
  loadingAnimation: isVolksverpetzer ? VVPLogoAnimation : null,
} as const;
