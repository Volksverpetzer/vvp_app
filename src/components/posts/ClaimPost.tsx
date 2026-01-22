import * as WebBrowser from "expo-web-browser";
import { TouchableOpacity } from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import useColorScheme from "#/hooks/useColorScheme";

interface Review {
  publisher: {
    name: string;
    site: string;
  };
  url: string;
  title: string;
  reviewDate: string;
  textualRating: string;
  languageCode: string;
}

/**
 * Represents the properties of a fact check as fetched from the Google Fact Check API
 */
export interface ClaimProperties {
  text: string;
  claimant: string;
  claimDate: string;
  claimReview: Review[];
  count: number;
  id: number;
}

/**
 * Renders Short Post for Googles Claim Review
 */
const ClaimPost = (properties: ClaimProperties) => {
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme].grayedOutText;
  const handleSelectClaim = () => {
    WebBrowser.openBrowserAsync(properties.claimReview[0].url);
  };

  const review: Review = properties.claimReview[0];
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
