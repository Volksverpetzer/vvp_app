import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import expoConfig from "eslint-config-expo/flat.js";
import importAlias from "eslint-plugin-import-alias";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";

export default defineConfig([
  expoConfig,
  cspellESLintPluginRecommended,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      "**/pnpm-lock.yaml",
      "src/screens/Settings/components/licenses/data.tsx",
    ],
    plugins: { "import-alias": importAlias },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "import-alias/import-alias": [
        "error",
        {
          relativeDepth: 0, // 0 means avoid all relative paths if an alias exists
          aliases: [
            { alias: "#assets", matcher: "^assets" }, // Maps '@' to any path starting with 'src'
            { alias: "#", matcher: "^src" }, // Maps '@' to any path starting with 'src'
          ],
        },
      ],
      "react/function-component-definition": [
        2,
        { namedComponents: "arrow-function" },
      ],
    },
  },
]);
