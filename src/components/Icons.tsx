import Lucide, {
  type LucideIconName,
} from "@react-native-vector-icons/lucide/static";
import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { radii } from "#/constants/BorderRadius";
import { iconSizes } from "#/constants/IconSizes";

type LucideProps = Omit<ComponentProps<typeof Lucide>, "name">;

export type { LucideIconName };

export type ChevronDirection = "left" | "right" | "up" | "down";

// The Lucide font only ships outlined glyphs, so filled variants and brand
// marks (Lucide has no GitHub logo) are drawn with react-native-svg instead.
type SvgGlyphProps = Pick<LucideProps, "size" | "color">;

const FilledGlyph = ({
  d,
  size,
  color,
  stroked,
}: SvgGlyphProps & { d: string; stroked?: boolean }) => (
  <Svg
    viewBox="0 0 24 24"
    width={size ?? iconSizes.lg}
    height={size ?? iconSizes.lg}
    fill={color}
    stroke={stroked ? color : "none"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d={d} />
  </Svg>
);

const LUCIDE_STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";
const LUCIDE_HEART_PATH =
  "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5";
const GITHUB_MARK_PATH =
  "M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.19 1.78 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.07.78 2.15 0 1.55-.01 2.81-.01 3.19 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z";

export const ArticleViewIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="eye" />
);

export const CheckboxIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="check" />
);

export const ClockIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="clock" />
);

export const CodeIcon = ({ size, color }: SvgGlyphProps) => (
  <FilledGlyph d={GITHUB_MARK_PATH} size={size} color={color} />
);

export const ChevronIcon = ({
  direction,
  size,
  ...rest
}: LucideProps & { direction: ChevronDirection }) => {
  return (
    <Lucide
      {...rest}
      name={`chevron-${direction}`}
      size={size ?? iconSizes.lg}
    />
  );
};

export const CircleIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="circle" />
);

export const CloseIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide {...rest} name="x" size={size ?? iconSizes.lg} />
);

export const DeleteIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="trash-2" />
);

export const DownloadIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="download" />
);

export const EditIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="pencil" />
);

export const ErrorIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="triangle-alert" />
);

export const ExternalLinkIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide size={size ?? iconSizes.xs} {...rest} name="external-link" />
);

export const FeedbackIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="message-square-warning" />
);

export const FeedIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="rows-3" />
);

export const GiveIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="gift" />
);

export const HomeIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="house" />
);

export const InfoIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="info" />
);

export const HeartIcon = ({ size, color }: SvgGlyphProps) => (
  <FilledGlyph stroked d={LUCIDE_HEART_PATH} size={size} color={color} />
);

export const ImprintIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="file-badge" />
);

export const LinkIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide {...rest} name="link" size={size ?? iconSizes.lg} />
);

export const LockIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="lock" />
);

export const NotificationIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="bell" />
);

export const PlayIcon = ({
  style,
  size = iconSizes.lg,
  ...rest
}: Omit<LucideProps, "style"> & { style?: StyleProp<ViewStyle> }) => (
  <View
    style={[
      {
        backgroundColor: "rgba(0,0,0,0.85)",
        borderRadius: radii.full,
        justifyContent: "center",
        alignItems: "center",
      },
      style,
    ]}
  >
    <Lucide {...rest} name="play" size={size} />
  </View>
);

export const MailIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="mail" />
);

export const ReportIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="message-square-warning" />
);

export const SafetyIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide {...rest} name="shield-check" size={size ?? iconSizes.lg} />
);

export const SearchIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide {...rest} name="search" size={size ?? iconSizes.lg} />
);

export const SettingsIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide {...rest} name="settings" size={size ?? iconSizes.lg} />
);

export const ThemeIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide {...rest} name="sun-moon" size={size ?? iconSizes.lg} />
);

export const ShareIcon = ({ size, ...rest }: LucideProps) => (
  <Lucide
    {...rest}
    name={Platform.OS === "ios" ? "share" : "share-2"}
    size={size ?? iconSizes.lg}
  />
);

export const StarIcon = ({
  filled = false,
  size,
  ...rest
}: LucideProps & { filled?: boolean }) =>
  filled ? (
    <FilledGlyph stroked d={LUCIDE_STAR_PATH} size={size} color={rest.color} />
  ) : (
    <Lucide {...rest} name="star" size={size ?? iconSizes.lg} />
  );

export const StatisticsIcon = (
  properties: LucideProps & { name: LucideIconName },
) => <Lucide {...properties} />;

export const SuccessIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="circle-check" />
);

export const TrophyIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="trophy" />
);

export const WorldIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="globe" />
);

export const UploadIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="upload" />
);

export const PauseIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="pause" />
);

export const UnmuteIcon = ({ ...rest }: LucideProps) => (
  <Lucide {...rest} name="volume-2" />
);
