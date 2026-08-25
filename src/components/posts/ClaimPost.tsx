import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { LINE_HEIGHTS } from "#/constants/FontSizes";
import { POST_PADDING_HORIZONTAL } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ClaimProperties } from "#/types";

/**
 * Renders Short Post for Googles Claim Review
 */
const ClaimPost = (properties: ClaimProperties) => {
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].textMuted;
  const handleSelectClaim = () => {
    WebBrowser.openBrowserAsync(properties.claimReview[0].url);
  };

  const review = properties.claimReview[0];
  return (
    <UiPressable accessibilityRole="button" onPress={handleSelectClaim}>
      <View style={{ paddingBottom: 0, flex: 1 }}>
        <UiText
          size="xl"
          bold
          style={{
            paddingHorizontal: POST_PADDING_HORIZONTAL,
            lineHeight: LINE_HEIGHTS.xl,
            textAlign: "left",
            paddingTop: spacing.xl,
          }}
        >
          {review.publisher.name}: {review.title}
        </UiText>
        <UiText
          style={{
            paddingHorizontal: POST_PADDING_HORIZONTAL,
            paddingVertical: spacing.xs,
            color,
          }}
        >
          {review.publisher.name} | {review.reviewDate?.split("T")[0]}
        </UiText>
        <UiText style={{ paddingHorizontal: POST_PADDING_HORIZONTAL }}>
          {review.textualRating}
        </UiText>
      </View>
    </UiPressable>
  );
};

export default ClaimPost;
