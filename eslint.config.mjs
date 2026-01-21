import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import expoConfig from "eslint-config-expo/flat.js";
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
    rules: {
      "react/function-component-definition": [
        2,
        { namedComponents: "arrow-function" },
      ],
    },
  },
]);
