import { StripeProvider } from "@stripe/stripe-react-native";
import type { ReactElement } from "react";

import Config from "#/constants/Config";

const StripeWrapper = ({ children }: { children: ReactElement }) => (
  <StripeProvider
    publishableKey="pk_live_51MAUglFricedKvSmI93lGEtbVgTLl3ng0X0CIKMacMDSmgSLtiRZYGDSTWLHvUuQHnONs4hvFUAfH5cmDkZ4wAvF00WDS1HasH" // cspell:disable-line
    merchantIdentifier={Config.donations.merchantIdentifier}
  >
    {children}
  </StripeProvider>
);

export default StripeWrapper;
