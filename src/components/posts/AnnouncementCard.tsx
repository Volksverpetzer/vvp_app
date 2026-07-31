import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { View } from "react-native";

import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import type { AnnouncementEntry } from "#/constants/Announcements";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { AppImages } from "#/helpers/AppImages";
import { onLinkPress } from "#/helpers/Linking";
import { parseInlineMarkdown } from "#/helpers/utils/inlineMarkdown";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

// Designer spec: the mascot sits centered behind the card, with roughly its
// top half — head and happily raised arms — peeking out above the tile, and
// shifted up a bit further so it overlaps the header-gradient boundary above
// the feed. 600x871 is the intrinsic size of einhorn.webp.
const MASCOT_WIDTH = 160;
const MASCOT_HEIGHT = Math.round(MASCOT_WIDTH * (871 / 600));
const MASCOT_PEEK = Math.round(MASCOT_HEIGHT / 2);
const MASCOT_OVERLAP = 28;

interface AnnouncementCardProperties {
  announcement: AnnouncementEntry;
  onDismiss: (id: string) => void;
}

const AnnouncementCard = ({
  announcement,
  onDismiss,
}: AnnouncementCardProperties) => {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const surface = Colors[colorScheme].surface;
  const text = Colors[colorScheme].text;
  const onPrimary = Colors[colorScheme].onPrimary;

  const handleAction = () => {
    onDismiss(announcement.id);
    router.push(announcement.route);
  };

  const mascot = AppImages.announcementMascot;

  return (
    <View style={mascot ? { paddingTop: MASCOT_PEEK } : undefined}>
      {mascot && (
        <Image
          source={mascot}
          accessible={false}
          pointerEvents="none"
          style={{
            alignSelf: "center",
            height: MASCOT_HEIGHT,
            position: "absolute",
            top: -MASCOT_OVERLAP,
            width: MASCOT_WIDTH,
          }}
        />
      )}
      <UiCard>
        <UiText size="base" style={{ lineHeight: 22 }}>
          {parseInlineMarkdown(announcement.message).map((token, index) => {
            const key = String(index);
            switch (token.type) {
              case "bold":
                return (
                  <UiText key={key} style={{ fontFamily: "SourceSansProBold" }}>
                    {token.content}
                  </UiText>
                );
              case "italic":
                return (
                  <UiText
                    key={key}
                    style={{ fontFamily: "SourceSansProItalic" }}
                  >
                    {token.content}
                  </UiText>
                );
              case "link": {
                // The tokenizer accepts any URL inside (…); only treat it as a
                // real link if it is actually https, otherwise render plain text
                // rather than casting an unvalidated string to HttpsUrl.
                if (!token.url.startsWith("https://")) {
                  return <UiText key={key}>{token.content}</UiText>;
                }
                const url = token.url as HttpsUrl;
                return (
                  <UiText
                    key={key}
                    onPress={() => onLinkPress(url, router)}
                    style={{
                      color: corporate,
                      textDecorationLine: "underline",
                    }}
                  >
                    {token.content}
                  </UiText>
                );
              }
              default:
                return token.content;
            }
          })}
        </UiText>
        <UiSpace size={16} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <UiPressable
            accessibilityRole="button"
            onPress={() => onDismiss(announcement.id)}
            style={{
              alignItems: "center",
              backgroundColor: surface,
              borderRadius: radii.md,
              flex: 1,
              paddingVertical: 12,
            }}
          >
            <UiText
              size="base"
              style={{
                color: text,
                fontFamily: "SourceSansProBold",
              }}
            >
              Alles klar!
            </UiText>
          </UiPressable>
          <UiPressable
            accessibilityRole="button"
            onPress={handleAction}
            style={{
              alignItems: "center",
              backgroundColor: corporate,
              borderRadius: radii.md,
              flex: 1,
              paddingVertical: 12,
            }}
          >
            <UiText
              size="base"
              style={{
                color: onPrimary,
                fontFamily: "SourceSansProBold",
              }}
            >
              {announcement.actionLabel}
            </UiText>
          </UiPressable>
        </View>
      </UiCard>
    </View>
  );
};

export default AnnouncementCard;
