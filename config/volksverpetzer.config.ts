import type { ExpoConfig } from "@expo/config";

import type { ExtraConfigType, colorSchemeType } from "#/types";

const colorScheme: colorSchemeType = {
  light: {
    background: "#FFF",
    primary: "#1B7194",
    primaryTint: "#3893C0",
    errorBackground: "#C62828",
    errorText: "#FFF",
    muted: "#DDD",
    textMuted: "#AAA",
    textHeading: "#1B7194",
    accent: "#DB2685",
    inputBackground: "#BADDE8",
    surface: "#E2F0F5",
    iconMuted: "#AAA",
    iconOnPrimary: "#FFF",
    text: "#111",
  },
  dark: {
    background: "#050D0f",
    primary: "#3893C0",
    primaryTint: "#1B7194",
    errorBackground: "#7F1D1D",
    errorText: "#FEE2E2",
    muted: "#333",
    textMuted: "#AAA",
    textHeading: "#8EC9E1",
    accent: "#D31C74",
    inputBackground: "#777",
    surface: "#142228",
    iconMuted: "#777",
    iconOnPrimary: "#FFF",
    text: "#F7F7F7",
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
  wpUrl: "https://volksverpetzer.de",
  aboutUrl: "https://volksverpetzer.de/ueber-uns/",
  sourceUrl: "https://github.com/Volksverpetzer/vvp_app",
  dataProtectionUrl: "https://volksverpetzer.de/datenschutzerklaerung/",
  imprintUrl: "https://volksverpetzer.de/impressum-volksverpetzer/",
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
    stripePublishableKey:
      "pk_live_51MAUglFricedKvSmI93lGEtbVgTLl3ng0X0CIKMacMDSmgSLtiRZYGDSTWLHvUuQHnONs4hvFUAfH5cmDkZ4wAvF00WDS1HasH", // cspell:disable-line
    steady: "https://steadyhq.com/volksverpetzer",
    support: "https://volksverpetzer.de/unterstutzen/",
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
    wp: [
      {
        handle: "https://www.volksverpetzer.de",
        label: "Artikel",
        enabled: true,
      },
      {
        handle: "https://pruefpunkt.org",
        label: "Prüfpunkt Artikel",
        sourceName: "Prüfpunkt",
        enabled: true,
      },
    ],
    insta: [
      {
        handle: "volksverpetzer",
        label: "Instagram Slides",
        enabled: true,
      },
      {
        handle: "pruefpunkt",
        label: "Prüfpunkt Instagram",
        enabled: true,
      },
    ],
    yt: { enabled: true },
    bsky: { handle: "volksverpetzer.de", enabled: true },
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
  audioCdnUrl: "https://vvpaudio.b-cdn.net/audio",
};

const appName = "Volksverpetzer";

const slug = "vvp_App";

const packageName = "de.volksverpetzer.app";

const googleServicesFile = process.env.google_services;

// Both the www and apex hosts are registered so deep links resolve regardless
// of which form the link uses (the site is moving off the www subdomain, but
// previously shared links and the redirect still use www).
//
// Match only the app's deep-linkable shapes — a 1-segment page like
// `/impressum-volksverpetzer/` (rendered in-app via the category webview) and a
// 2-segment article `/{category}/{slug}` (route src/app/[category]/[slug].tsx),
// each with an optional trailing slash. This deliberately does NOT match
// `/wp-content/uploads/…` files (3+ segments), which should download in the
// browser instead. Advanced glob has no grouping, so the 1- and 2-segment cases
// are two separate patterns.
//
// `pathAdvancedPattern` is honored on Android 12+ (API 31); on older versions it
// is ignored and the filter falls back to matching all paths, where the in-app
// fallback (src/app/external-link.tsx) opens uploads externally instead.
const ARTICLE_PATH_PATTERNS = [
  "/[^/]+/{0,1}", // 1 segment, e.g. /impressum-volksverpetzer/
  "/[^/]+/[^/]+/{0,1}", // 2 segments, e.g. /aktuelles/slug/
];

const DEEP_LINK_HOSTS = [
  "www.volksverpetzer.de",
  "volksverpetzer.de",
  "www.pruefpunkt.org",
  "pruefpunkt.org",
];

const AndroidIntentFilters: ExpoConfig["android"]["intentFilters"][number]["data"] =
  DEEP_LINK_HOSTS.flatMap((host) =>
    ARTICLE_PATH_PATTERNS.map((pathAdvancedPattern) => ({
      scheme: "https",
      host,
      pathAdvancedPattern,
    })),
  );

const iOSAssociatedDomains = [
  "applinks:www.volksverpetzer.de",
  "applinks:volksverpetzer.de",
  "applinks:www.pruefpunkt.org",
  "applinks:pruefpunkt.org",
];

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
