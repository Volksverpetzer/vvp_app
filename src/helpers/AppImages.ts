import { isVolksverpetzer } from "src/helpers/utils/variant";

import VVPShopButton from "#assets/images/button_vvp_shop.webp";
import VVPLogoAnimation from "#assets/images/logo_animated.gif";

// Add new variant assets here as needed (mimikama, future apps)

export const AppImages = {
  /** Shop button overlay image, or null if variant has none */
  shopButton: isVolksverpetzer ? VVPShopButton : null,
  /** Loading animation, or null to fall back to ActivityIndicator */
  loadingAnimation: isVolksverpetzer ? VVPLogoAnimation : null,
} as const;
