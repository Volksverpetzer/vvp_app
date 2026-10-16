import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiCard from "#/components/ui/UiCard";
import UiText from "#/components/ui/UiText";
import type { AnnouncementEntry } from "#/constants/Announcements";
import Colors from "#/constants/Colors";
import { fontFamily } from "#/constants/FontFamily";
import { LINE_HEIGHTS } from "#/constants/FontSizes";
import { spacing } from "#/constants/Spacing";
import { AppImages } from "#/helpers/AppImages";
import { onLinkPress } from "#/helpers/Linking";
import { registerAnnouncementEvent } from "#/helpers/network/Analytics";
import { parseInlineMarkdown } from "#/helpers/utils/inlineMarkdown";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

// Designer spec: the mascot sits centered behind the card, with roughly its
// top half — head and happily raised arms — peeking out above the tile, and
// shifted up a bit further so it overlaps the header-gradient boundary above
// the feed. 524x833 is the intrinsic size of einhorn.webp.
const MASCOT_WIDTH = 160;
const MASCOT_HEIGHT = Math.round(MASCOT_WIDTH * (833 / 524));
const MASCOT_PEEK = Math.round(MASCOT_HEIGHT / 2);
const MASCOT_OVERLAP = 28;

// Ids already reported as shown in this app session, so a re-mount (feed
// refresh, tab switch) doesn't count the same card again and inflate the
// impressions the click-through rate is measured against.
const reportedImpressions = new Set<string>();

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
  const linkColor = Colors[colorScheme].linkText;

  useEffect(() => {
    if (reportedImpressions.has(announcement.id)) return;
    reportedImpressions.add(announcement.id);
    void registerAnnouncementEvent("Announcement Shown", announcement);
    // Keyed on the id only: a new object for the same card is not a new impression.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcement.id]);

  const handleDismiss = () => {
    void registerAnnouncementEvent("Announcement Dismissed", announcement);
    onDismiss(announcement.id);
  };

  const handleAction = () => {
    void registerAnnouncementEvent("Announcement Action", announcement, {
      source: "button",
    });
    onDismiss(announcement.id);
    const { route } = announcement;
    if (typeof route === "string" && route.startsWith("https://")) {
      onLinkPress(route as HttpsUrl, router);
    } else {
      router.push(route);
    }
  };

  const mascot = AppImages.announcementMascot;

  return (
    <View style={mascot ? { paddingTop: MASCOT_PEEK } : undefined}>
      {mascot && (
        // expo-image's style type has no pointerEvents, so the wrapper
        // carries it (and the positioning).
        <View
          testID="announcementMascot"
          style={{
            pointerEvents: "none",
            alignSelf: "center",
            height: MASCOT_HEIGHT,
            position: "absolute",
            top: -MASCOT_OVERLAP,
            width: MASCOT_WIDTH,
          }}
        >
          <Image
            source={mascot}
            accessible={false}
            style={{ height: "100%", width: "100%" }}
          />
        </View>
      )}
      <UiCard style={{ gap: spacing.lg }}>
        <UiText size="base" style={{ lineHeight: LINE_HEIGHTS.base }}>
          {parseInlineMarkdown(announcement.message).map((token, index) => {
            const key = String(index);
            switch (token.type) {
              case "bold":
                return (
                  <UiText key={key} bold>
                    {token.content}
                  </UiText>
                );
              case "italic":
                return (
                  <UiText key={key} style={{ fontFamily: fontFamily.italic }}>
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
                    onPress={() => {
                      void registerAnnouncementEvent(
                        "Announcement Action",
                        announcement,
                        { source: "link" },
                      );
                      onLinkPress(url, router);
                    }}
                    style={{
                      color: linkColor,
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
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <UiButton
            label="Alles klar!"
            variant="secondary"
            onPress={handleDismiss}
            style={{ flex: 1 }}
          />
          <UiButton
            label={announcement.actionLabel}
            variant="primary"
            onPress={handleAction}
            style={{ flex: 1 }}
          />
        </View>
      </UiCard>
    </View>
  );
};

export default AnnouncementCard;
