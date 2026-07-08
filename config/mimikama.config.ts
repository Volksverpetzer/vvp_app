import type { ExpoConfig } from "@expo/config";

import type { ExtraConfigType, colorSchemeType } from "#/types";

const colorScheme: colorSchemeType = {
  light: {
    background: "#FFF",
    surface: "#EEE",
    surfaceInput: "#A1A1A1",
    surfaceDisabled: "#BBB",
    surfaceError: "#B71C1C",
    text: "#000",
    textMuted: "#666",
    onPrimary: "#FFF",
    onError: "#FFF",
    primary: "#DB0301",
    primaryMuted: "#313131",
    accent: "#414141",
    error: "#B71C1C",
  },
  dark: {
    background: "#212121",
    surface: "#333",
    surfaceInput: "#15202B",
    surfaceDisabled: "#444",
    surfaceError: "#6E1111",
    text: "#E1C9E1",
    textMuted: "#AAA",
    onPrimary: "#E1C9E1",
    onError: "#FEE2E2",
    primary: "#DB0301",
    primaryMuted: "#E1C9E1",
    accent: "#757575",
    error: "#FF8A80",
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
  sourceUrl: "https://github.com/Volksverpetzer/vvp_app",
  dataProtectionUrl: "https://www.mimikama.org/datenschutzbestimmungen/",
  imprintUrl: "https://www.mimikama.org/impressum/",
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
    shop: "https://www.mimikama.org/webshop/",
    platformPay: false,
  },
  enableActions: false,
  enableAnalytics: false,
  enableEngagement: false,
  feeds: {
    wp: [
      { handle: "https://www.mimikama.org", label: "Artikel", enabled: true },
    ],
    insta: [
      { handle: "mimikama.at", label: "Instagram Slides", enabled: true },
    ],
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

// Match a 1-segment page and a 2-segment article `/{category}/{slug}` (each with
// an optional trailing slash) so the OS does not open the app for
// `/wp-content/uploads/…` files (3+ segments), which should download in the
// browser instead. Advanced glob has no grouping, so the two cases are separate
// patterns. `pathAdvancedPattern` is honored on Android 12+; on older versions
// the in-app fallback opens uploads externally.
const AndroidIntentFilters: ExpoConfig["android"]["intentFilters"][number]["data"] =
  ["/[^/]+/{0,1}", "/[^/]+/[^/]+/{0,1}"].map((pathAdvancedPattern) => ({
    scheme: "https",
    host: "*.mimikama.org",
    pathAdvancedPattern,
  }));

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
