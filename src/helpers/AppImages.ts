import { isVolksverpetzer } from "#/helpers/utils/variant";

import VVPShopButton from "#assets/images/button_vvp_shop.webp";
import VVPLogoAnimation from "#assets/images/logo_animated.gif";

export const AppImages = {
  /** Shop button overlay image, or null if variant has no shop configured */
  shopButton: isVolksverpetzer ? VVPShopButton : null,
  /** Loading animation, or null to fall back to ActivityIndicator */
  loadingAnimation: isVolksverpetzer ? VVPLogoAnimation : null,
} as const;
