import { useRouter } from "expo-router";
import { View } from "react-native";

import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import type { AnnouncementEntry } from "#/constants/Announcements";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

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
  const iconOnPrimary = Colors[colorScheme].iconOnPrimary;

  const handleAction = () => {
    onDismiss(announcement.id);
    router.push(announcement.route);
  };

  return (
    <UiCard>
      <UiText style={{ fontSize: 16, lineHeight: 22 }}>
        {announcement.message}
      </UiText>
      <UiSpace size={16} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <UiPressable
          accessibilityRole="button"
          onPress={() => onDismiss(announcement.id)}
          style={{
            alignItems: "center",
            backgroundColor: surface,
            borderRadius: 12,
            flex: 1,
            paddingVertical: 12,
          }}
        >
          <UiText
            style={{
              color: text,
              fontFamily: "SourceSansProBold",
              fontSize: 15,
            }}
          >
            Verstanden
          </UiText>
        </UiPressable>
        <UiPressable
          accessibilityRole="button"
          onPress={handleAction}
          style={{
            alignItems: "center",
            backgroundColor: corporate,
            borderRadius: 12,
            flex: 1,
            paddingVertical: 12,
          }}
        >
          <UiText
            style={{
              color: iconOnPrimary,
              fontFamily: "SourceSansProBold",
              fontSize: 15,
            }}
          >
            {announcement.actionLabel}
          </UiText>
        </UiPressable>
      </View>
    </UiCard>
  );
};

export default AnnouncementCard;
