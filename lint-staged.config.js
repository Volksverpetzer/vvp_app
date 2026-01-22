/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{js,jsx,json,md,mjs,ts,tsx,yml,yaml}": "prettier --write",
};
