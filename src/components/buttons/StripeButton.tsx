interface StripeButtonProperties {
  amount: number;
  onSuccess: () => void;
  onSupportChecked?: (isSupported: boolean) => void;
}

/**
 * Non-iOS stub implementation of the Stripe donate button.
 * Stripe donations are currently only implemented on iOS; on Android and web this
 * component is intentionally a no-op and renders nothing.
 * @constructor
 * @param _props - Unused props for the stub implementation.
 */
const StripeButton = (_props: StripeButtonProperties) => {
  return null;
};

export default StripeButton;
