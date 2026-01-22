module.exports = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: ["^#/(.*)$", "^#assets/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
