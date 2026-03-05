import { ExpoConfig } from "@expo/config";

import { ExtraConfigType, colorSchemeType } from "#/types";

const colorScheme: colorSchemeType = {
  light: {
    text: "#111",
    heading: "#1B7194",
    background: "#fff",
    secondaryBackground: "#E2F0F5",
    errorBackground: "#C62828",
    errorText: "#FFFFFF",
    tint: "#3893C0",
    tabIconDefault: "#aaa",
    grayedOut: "#bbb",
    grayedOutText: "#aaa",
    tabIconSelected: "#3893C0",
    inputBackground: "#BADDE8",
    highlight: "#DB2685",
    corporate: "#1b7194",
  },
  dark: {
    text: "#F7F7F7",
    heading: "#8EC9E1",
    background: "#142228",
    secondaryBackground: "#050d0f",
    errorBackground: "#7F1D1D",
    errorText: "#FEE2E2",
    grayedOut: "#333",
    grayedOutText: "#aaa",
    tint: "#fff",
    tabIconDefault: "#777",
    tabIconSelected: "#fff",
    inputBackground: "#777",
    highlight: "#D31C74",
    corporate: "#3893c0",
  },
};

const assets = {
  icon: "./assets/images/volksverpetzer/adaptive-icon.png",
  iconMono: "./assets/images/volksverpetzer/adaptive-icon-mono.png",
  notificationIcon: "./assets/images/volksverpetzer/notification-icon.png",
  splash: "./assets/images/volksverpetzer/splash.png",
};

const extraConfig: ExtraConfigType = {
  instagramAppId: "1064021441903778",
  apiUrl: "https://volksverpetzer-app.de",
  aiUrl: "https://ai.volksverpetzer-app.de",
  wpUrl: "https://www.volksverpetzer.de",
  aboutUrl: "https://www.volksverpetzer.de/ueber-uns/",
  dataProtectionUrl: "https://www.volksverpetzer.de/datenschutzerklaerung/",
  eas: {
    projectId: "fd591077-fcb9-48ce-88d9-8bdff41c5564",
  },
  donations: {
    account: {
      bank: "Stadtsparkasse Augsburg",
      holder: "Volksverpetzer VVP gUG",
      IBAN: "DE67 7205 0000 0251 7976 92",
      note: "Spende",
    },
    merchantIdentifier: "merchant.volksverpetzer.de",
    steady: "https://steadyhq.com/volksverpetzer",
    support: "https://www.volksverpetzer.de/unterstutzen/",
    paypal: "https://www.paypal.com/donate/?hosted_button_id=8LXQZGF3BDWVU",
    paypalEmail: "laschyk@volksverpetzer.de",
    paypalMatrix: [
      {
        amount: 5,
        url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-3EK05986WS3518310NES3K6Y",
      },
      {
        amount: 10,
        url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-0AC07809C0492902LNEGL2WQ",
      },
      {
        amount: 25,
        url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-4SA39003FK0169640NEYAM5A",
      },
      {
        amount: 50,
        url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-1NB38861SP703751DNEYANMI",
      },
      {
        amount: 100,
        url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8CV89346WC861732XNEYAZBY",
      },
    ],
    shop: "https://volksverpetzer-shop.de/",
    platformPay: true,
  },
  enableActions: true,
  enableAnalytics: true,
  enableEngagement: true,
  feeds: {
    reddit: { enabled: true },
    wp: { enabled: true },
    insta: { enabled: true },
    yt: { enabled: true },
    tiktok: { enabled: true },
    bsky: { handle: "volksverpetzer.de", enabled: true },
    bot: { handle: "volksverpetzer.de", enabled: true },
  },
  colorScheme: colorScheme,
  themeColor: "#1b7194",
  assets: assets,
  about: `
    Diese Aufgabe ist bei der hohen Geschwindigkeit der sozialen Medien, sowie der starken Emotionalisierung der politischen Auseinandersetzungen, mehr als notwendig!
    Darin sehen wir unsere Aufgabe: Falschmeldungen entlarven, Desinformationen kenntlich machen, auf Manipulationen hinweisen, die Menschen auf Social Media begleiten und eine Hilfestellung bieten.
    `,
  importantCats: {
    23: "Aktuelles",
    16: "Analyse",
    6474: "Serie",
    6463: "Faktencheck",
    2934: "Satire",
  },
};

const appName = "Volksverpetzer";

const slug = "vvp_App";

const packageName = "de.volksverpetzer.app";

const googleServicesFile = process.env.google_services;

const AndroidIntentFilters: ExpoConfig["android"]["intentFilters"][number]["data"] =
  [
    {
      scheme: "https",
      host: "www.volksverpetzer.de",
      pathPattern: "/.*/.*",
    },
  ];

const iOSAssociatedDomains = ["applinks:www.volksverpetzer.de"];

const config = {
  extraConfig,
  packageName,
  AndroidIntentFilters,
  merchantIdentifier: "merchant.volksverpetzer.de",
  iOSAssociatedDomains,
  appName,
  slug,
  googleServicesFile,
  assets,
};

export default config;
