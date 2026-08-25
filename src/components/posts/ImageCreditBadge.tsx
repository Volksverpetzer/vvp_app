import { useState } from "react";

import { InfoIcon } from "#/components/Icons";
import ImageCreditModal from "#/components/popups/ImageCreditModal";
import { iconSizes } from "#/constants/IconSizes";
import type { ImageCredit } from "#/types";

import Badge, { type BadgePosition } from "./Badge";

interface ImageCreditBadgeProperties {
  credit?: ImageCredit;
  position: BadgePosition;
}

/**
 * Small "i" badge overlaid on an image; tapping it opens a modal with the
 * Image Source Control credit (photographer/agency, licence, source link).
 * Renders nothing when there's no credit to show (e.g. self-shot images).
 */
const ImageCreditBadge = ({ credit, position }: ImageCreditBadgeProperties) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!credit) return null;

  return (
    <>
      <Badge
        position={position}
        color="transparent"
        accessibilityLabel="Bildquelle anzeigen"
        onPress={() => setIsVisible(true)}
      >
        <InfoIcon size={iconSizes.xs} color="#999" />
      </Badge>
      <ImageCreditModal
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        credit={credit}
      />
    </>
  );
};

export default ImageCreditBadge;
