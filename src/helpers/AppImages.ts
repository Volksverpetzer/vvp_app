import { isVolksverpetzer } from "#/helpers/utils/variant";

import VVPLogoAnimation from "#assets/images/logo_animated.gif";
import MimikamaShopButton from "#assets/images/mimikama/button_shop.webp";
import VVPShopButton from "#assets/images/volksverpetzer/button_shop.webp";
import VVPMascot from "#assets/images/volksverpetzer/einhorn.webp";

export const AppImages = {
  /** Mascot peeking out behind the announcement card, or null for no mascot */
  announcementMascot: isVolksverpetzer ? VVPMascot : null,
  /** Shop button overlay image */
  shopButton: isVolksverpetzer ? VVPShopButton : MimikamaShopButton,
  /** Loading animation, or null to fall back to ActivityIndicator */
  loadingAnimation: isVolksverpetzer ? VVPLogoAnimation : null,
} as const;
