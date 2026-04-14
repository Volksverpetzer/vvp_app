import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import tsESLintPlugin from "@typescript-eslint/eslint-plugin";
import expoConfig from "eslint-config-expo/flat.js";
import importAlias from "eslint-plugin-import-alias";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import { fileURLToPath } from "node:url";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig([
  expoConfig,
  cspellESLintPluginRecommended,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      "**/pnpm-lock.yaml",
      "android/**",
      "ios/**",
      "expo-env.d.ts",
      "src/screens/Settings/components/licenses/data.tsx",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    plugins: {
      "@typescript-eslint": tsESLintPlugin,
      "import-alias": importAlias,
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "import-alias/import-alias": [
        "error",
        {
          relativeDepth: 0, // 0 means avoid all relative paths if an alias exists
          aliases: [
            { alias: "#assets", matcher: "^assets" }, // Maps '#assets' to any path starting with 'assets'
            { alias: "#tests", matcher: "^__tests__" }, // Maps '#tests' to any path starting with '__tests__'
            { alias: "#", matcher: "^src" }, // Maps '#' to any path starting with 'src'
          ],
        },
      ],
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": "off",
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" },
      ],
      "react/function-component-definition": [
        2,
        { namedComponents: "arrow-function" },
      ],
      "require-await": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
