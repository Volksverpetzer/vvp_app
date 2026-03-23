// Icon browser: https://oblador.github.io/react-native-vector-icons/#Octicons
import { Octicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, View } from "react-native";

type OcticonsProps = Omit<ComponentProps<typeof Octicons>, "name">;

export type OcticonsIconName = keyof typeof Octicons.glyphMap;

export type ChevronDirection = "left" | "right" | "up" | "down";

export const ArticleViewIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="eye" />
);

export const CheckboxIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="check" />
);

export const ChevronIcon = ({
  direction,
  size,
  ...rest
}: OcticonsProps & { direction: ChevronDirection }) => {
  return <Octicons {...rest} name={`chevron-${direction}`} size={size ?? 32} />;
};

export const CircleIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="circle" />
);

export const CloseIcon = ({ size, ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="x" size={size ?? 32} />
);

export const DeleteIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="trash" />
);

export const ErrorIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="alert" />
);

export const ExternalLinkIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="link-external" />
);

export const FeedbackIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="report" />
);

export const FeedIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="rows" />
);

export const GiveIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="gift" />
);

export const HomeIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="home" />
);

export const TrophyIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="trophy" />
);

export const HeartIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="heart-fill" />
);

export const LinkIcon = ({ size, ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="link" size={size ?? 32} />
);

export const LockIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="lock" />
);

export const NotificationIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="bell" />
);

export const PlayIcon = ({
  style,
  size = 30,
  ...rest
}: Omit<OcticonsProps, "style"> & { style?: StyleProp<ViewStyle> }) => (
  <View
    style={[
      {
        backgroundColor: "rgba(0,0,0,0.85)",
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
      },
      style,
    ]}
  >
    <Octicons {...rest} name="play" size={size} />
  </View>
);

export const ReportIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="report" />
);

export const ReportStatusIcon = ({
  status,
  ...rest
}: OcticonsProps & { status: "error" | "posted" | "pending" }) => (
  <Octicons
    {...rest}
    name={
      status === "error" ? "info" : status === "posted" ? "check" : "hourglass"
    }
  />
);

export const SafetyIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="shield-check" />
);

export const SearchIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="search" />
);

export const SettingsIcon = ({ size, ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="gear" size={size ?? 32} />
);

export const ShareIcon = ({ size, ...rest }: OcticonsProps) => (
  <Octicons
    {...rest}
    name={Platform.OS === "ios" ? "share" : "share-android"}
    size={size ?? 32}
  />
);

export const StarIcon = ({
  filled = false,
  size,
  ...rest
}: OcticonsProps & { filled?: boolean }) => (
  <Octicons {...rest} name={filled ? "star-fill" : "star"} size={size ?? 32} />
);

export const StatisticsIcon = (
  properties: OcticonsProps & { name: OcticonsIconName },
) => <Octicons {...properties} />;

export const SuccessIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="feed-issue-closed" />
);

export const WorldIcon = ({ ...rest }: OcticonsProps) => (
  <Octicons {...rest} name="globe" />
);
