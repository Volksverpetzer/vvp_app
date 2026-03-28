import type { colorSchemeType } from "./colors";
import type { FeedsConfig } from "./feeds";

export type HttpsUrl = `https://${string}`;

/**
 * Represents the extra configuration of the app as defined in the app.json
 */
export interface ExtraConfigType {
  instagramAppId?: string;
  apiUrl: HttpsUrl;
  aiUrl?: HttpsUrl;
  dataProtectionUrl: HttpsUrl;
  eas: {
    projectId: string;
  };
  wpUrl: HttpsUrl; // URL to the WordPress site
  analyticsUrl?: HttpsUrl; // URL to the analytics site
  aboutUrl: HttpsUrl; // URL to the about page
  sourceUrl: HttpsUrl; // URL to the source code repository
  colorScheme: colorSchemeType; // color scheme for the app is defined with type colorSchemeType
  assets: {
    splash: string;
    icon: string;
    iconMono: string;
  };
  feeds: FeedsConfig; // feeds configuration
  enableActions: boolean; // enables actions tab
  enableAnalytics: boolean; // enables analytics collection and analytics UI
  enableEngagement: boolean; // enables engagement features (favorites, views, shares, link tracking, and related UI)
  about: string; // URL to about page
  themeColor: string; // special color for the app
  donations: {
    account: {
      bank: string; // Bank name
      holder: string; // Account holder
      IBAN: string; // IBAN number
      note: string; // Verwendungszweck
    };
    steady: HttpsUrl; // URL to Steady donation
    paypal: `https://www.paypal.com/donate/?hosted_button_id${string}`; // URL to paypal donation
    paypalEmail: string; // email for paypal donations
    paypalMatrix: { amount: number; url: HttpsUrl }[]; // predefined amounts for paypal donations
    support: HttpsUrl; // URL to support page
    shop?: HttpsUrl;
    platformPay: boolean; // enables Apple Pay and Google Pay
    merchantIdentifier?: string; // required for Apple Pay, can be obtained from Apple Developer Account
  };
  importantCats: Record<number, string>;
  isFoss?: boolean; // true when built as a FOSS variant (Stripe and other proprietary modules are excluded)
}
