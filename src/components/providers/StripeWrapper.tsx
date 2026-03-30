import type { PropsWithChildren } from "react";

// Stripe is iOS-only (Apple Pay). On Android and web this is a no-op wrapper.
const StripeWrapper = ({ children }: PropsWithChildren) => children;

export default StripeWrapper;
