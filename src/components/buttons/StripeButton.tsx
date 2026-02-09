interface StripeButtonProperties {
  amount: number;
  onSuccess?: () => void;
}

/**
 * We only use stripe on ios (google doesn't like donations via google pay) and web doesn't need a button component
 * @param props
 * @constructor
 */
const StripeButton = (props: StripeButtonProperties) => {
  return null;
};

export default StripeButton;
