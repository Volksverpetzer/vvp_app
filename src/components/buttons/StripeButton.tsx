interface StripeButtonProperties {
  amount?: number;
  onSuccess?: () => void;
}

/**
 * We only use stripe on ios (google doesn't like donations via google pay) and web doesn't need a button component
 * @constructor
 * @param _props
 */
const StripeButton = (_props: StripeButtonProperties) => {
  return null;
};

export default StripeButton;
