import { StripeProvider } from "@stripe/stripe-react-native";
import type { ReactElement } from "react";

import Config from "#/constants/Config";

const StripeWrapper = ({ children }: { children: ReactElement }) => (
  <StripeProvider
    publishableKey={Config.donations.stripePublishableKey ?? ""}
    merchantIdentifier={Config.donations.merchantIdentifier}
  >
    {children}
  </StripeProvider>
);

export default StripeWrapper;
