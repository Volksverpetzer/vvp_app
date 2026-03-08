import type { Configuration } from "lint-staged";

const config: Configuration = {
  "*.{js,jsx,json,md,mjs,ts,tsx,yml,yaml}": "prettier --write",
};

export default config;
