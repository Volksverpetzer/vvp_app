export type SettingType = {
  value: boolean;
  name: string;
};

export type ContentSettingType = {
  reddit: SettingType;
  wp: SettingType;
  insta: SettingType;
  yt: SettingType;
  tiktok: SettingType;
  bsky: SettingType;
  bot: SettingType;
};

export type NotificationSettingType = {
  new_post: SettingType;
  new_fact_check: SettingType;
};

export type AdvancedSettingType = {
  //advancedReporting: SettingType;
  alwaysDarkMode: SettingType;
};
