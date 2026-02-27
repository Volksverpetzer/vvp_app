import * as WebBrowser from "expo-web-browser";
import { TouchableOpacity } from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ClaimProperties } from "#/types";

/**
 * Renders Short Post for Googles Claim Review
 */
const ClaimPost = (properties: ClaimProperties) => {
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].grayedOutText;
  const handleSelectClaim = () => {
    WebBrowser.openBrowserAsync(properties.claimReview[0].url);
  };

  const review = properties.claimReview[0];
  return (
    <TouchableOpacity accessibilityRole="button" onPress={handleSelectClaim}>
      <View style={{ paddingBottom: 0, flex: 1 }}>
        <Text
          style={{
            fontFamily: "SourceSansProBold",
            paddingHorizontal: 30,
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "left",
            paddingTop: 20,
          }}
        >
          {review.publisher.name}: {review.title}
        </Text>
        <Text style={{ paddingHorizontal: 30, paddingVertical: 5, color }}>
          {review.publisher.name} | {review.reviewDate?.split("T")[0]}
        </Text>
        <Text style={{ paddingHorizontal: 30 }}>{review.textualRating}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ClaimPost;
