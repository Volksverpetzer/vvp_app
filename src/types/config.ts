import { colorSchemeType } from "./colors";
import { FeedsConfig } from "./feeds";

export type HttpsUrl = `https://${string}`;

/**
 * Represents the extra configuration of the app as defined in the app.json
 */
export interface ExtraConfigType {
  instagramAppId?: string;
  enabledActions: boolean; // enables actions tab
  apiUrl: string;
  aiUrl?: string;
  dataProtectionUrl: string;
  eas: {
    projectId: string;
  };
  wpUrl: `https://${string}`; // URL to the Wordpress site
  analyticsUrl?: `https://${string}`; // URL to the analytics site
  aboutUrl: string; // URL to the about page
  colorScheme: colorSchemeType; // color scheme for the app is defined with type colorSchemeType
  assets: {
    splash: string;
    icon: string;
    iconMono: string;
  };
  feeds?: FeedsConfig; // feeds configuration
  analytics: boolean; // enables analytics
  about: string; // URL to about page
  themeColor: string; // special color for the app
  donations: {
    account: {
      bank: string; // Bank name
      holder: string; // Account holder
      IBAN: string; // IBAN number
      note: string; // Verwendungszweck
    };
    steady: `https://${string}`; // URL to Steady donation
    paypal: `https://www.paypal.com/donate/?hosted_button_id${string}`; // URL to paypal donation
    paypalEmail: string; // email for paypal donations
    paypalMatrix: { amount: number; url: `https://${string}` }[]; // predefined amounts for paypal donations
    support: `https://${string}`; // URL to support page
    shop?: `https://${string}`;
    platformPay: boolean; // enables Apple Pay and Google Pay
  };
  importantCats: Record<number, string>;
}
