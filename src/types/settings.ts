import type { InstaFeedKey, WpFeedKey } from "./feeds";

export type SettingType = {
  value: boolean;
  name: string;
};

export type ContentSettingType = {
  reddit: SettingType;
  yt: SettingType;
  tiktok: SettingType;
  bsky: SettingType;
  bot: SettingType;
} & {
  // One entry per configured WordPress feed, keyed by getWpFeedKey()
  [key: WpFeedKey]: SettingType;
} & {
  // One entry per configured Instagram feed, keyed by getInstaFeedKey()
  [key: InstaFeedKey]: SettingType;
};

export type NotificationSettingType = {
  new_post: SettingType;
  new_fact_check: SettingType;
  new_pruefpunkt: SettingType;
};

export type AdvancedSettingType = {
  advancedReporting: SettingType;
  alwaysDarkMode: SettingType;
};
