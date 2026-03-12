import type { ExpoConfig } from "@expo/config";

import type { ExtraConfigType, colorSchemeType } from "#/types";

const colorScheme: colorSchemeType = {
  light: {
    text: "#000",
    heading: "#313131",
    background: "#fff",
    secondaryBackground: "#eee",
    errorBackground: "#B71C1C",
    errorText: "#FFFFFF",
    tint: "#313131",
    tabIconDefault: "#aaa",
    grayedOut: "#bbb",
    grayedOutText: "#f7f7f7",
    tabIconSelected: "#313131",
    inputBackground: "#a1a1a1",
    highlight: "#414141",
    corporate: "#db0301",
  },
  dark: {
    text: "#F7F7F7",
    heading: "#8EC9E1",
    background: "#212121",
    secondaryBackground: "#333",
    errorBackground: "#6E1111",
    errorText: "#FEE2E2",
    grayedOut: "#333",
    grayedOutText: "#aaa",
    tint: "#fff",
    tabIconDefault: "#777",
    tabIconSelected: "#fff",
    inputBackground: "#15202b",
    highlight: "#111111",
    corporate: "#db0301",
  },
};

const assets = {
  icon: "./assets/images/mimikama/adaptive-icon.png",
  iconMono: "./assets/images/mimikama/adaptive-icon-mono.png",
  notificationIcon: "./assets/images/mimikama/notification-icon.png",
  splash: "./assets/images/mimikama/splash_mimikama.png",
};

const extraConfig: ExtraConfigType = {
  apiUrl: "https://mimikamaserver.azurewebsites.net",
  wpUrl: "https://www.mimikama.org",
  aboutUrl: "https://www.mimikama.org/ueber-uns/",
  dataProtectionUrl: "https://www.mimikama.org/datenschutzbestimmungen/",
  eas: {
    projectId: "4b724abf-ec92-4eb0-8cdf-ed25835b5825",
  },
  donations: {
    account: {
      bank: "Bank Austria",
      holder: "Mimikama – Verein zur Aufklärung über Internetmissbrauch",
      IBAN: "AT461200052999199621",
      note: "Spende Mimikama",
    },
    merchantIdentifier: "merchant.volksverpetzer.de",
    steady: "https://steadyhq.com/de/mimikama/",
    support: "https://www.mimikama.org/unterstuetze-uns-bitte/",
    paypal: "https://www.paypal.com/donate/?hosted_button_id=DFR6BRAK8YB2J",
    paypalEmail: "buero@mimikama.at",
    paypalMatrix: [
      {
        amount: 3,
        url: "https://www.paypal.com/donate?business=buero@mimikama.at&no_recurring=0&item_name=unabhängige%20Berichterstattung&amount=3&currency_code=EUR",
      },
      {
        amount: 5,
        url: "https://www.paypal.com/donate?business=buero@mimikama.at&no_recurring=0&item_name=unabhängige%20Berichterstattung&amount=5&currency_code=EUR",
      },
      {
        amount: 10,
        url: "https://www.paypal.com/donate?business=buero@mimikama.at&no_recurring=0&item_name=unabhängige%20Berichterstattung&amount=10&currency_code=EUR",
      },
      {
        amount: 25,
        url: "https://www.paypal.com/donate?business=buero@mimikama.at&no_recurring=0&item_name=unabhängige%20Berichterstattung&amount=25&currency_code=EUR",
      },
      {
        amount: 50,
        url: "https://www.paypal.com/donate?business=buero@mimikama.at&no_recurring=0&item_name=unabhängige%20Berichterstattung&amount=50&currency_code=EUR",
      },
      {
        amount: 100,
        url: "https://www.paypal.com/donate?business=buero@mimikama.at&no_recurring=0&item_name=unabhängige%20Berichterstattung&amount=100&currency_code=EUR",
      },
    ],
    platformPay: false,
  },
  enableActions: false,
  enableAnalytics: false,
  enableEngagement: false,
  feeds: {
    wp: { enabled: true },
    insta: { enabled: true },
  },
  colorScheme: colorScheme,
  assets: assets,
  themeColor: "#db0301",
  about: `
    Diese Aufgabe ist bei der hohen Geschwindigkeit der sozialen Medien, sowie der starken Emotionalisierung der politischen Auseinandersetzungen, mehr als notwendig!
    Darin sehen wir unsere Aufgabe: Falschmeldungen entlarven, Desinformationen kenntlich machen, auf Manipulationen hinweisen, die Menschen auf Social Media begleiten und eine Hilfestellung bieten.
    `,
  importantCats: {
    16: "Analyse",
  },
};

const appName = "Mimikama";

const slug = "mimikamaapp";

const packageName = "de.mimikama.app";

const googleServicesFile = process.env.google_services_mimikama;

const AndroidIntentFilters: ExpoConfig["android"]["intentFilters"][number]["data"] =
  [
    {
      scheme: "https",
      host: "*.mimikama.org",
      pathPrefix: "/*/*/",
    },
  ];

const iOSAssociatedDomains = ["applinks:www.mimikama.org"];

const config = {
  extraConfig,
  packageName,
  AndroidIntentFilters,
  iOSAssociatedDomains,
  appName,
  slug,
  googleServicesFile,
  assets,
};

export default config;
