import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import expoConfig from "eslint-config-expo/flat.js";
import importAlias from "eslint-plugin-import-alias";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import { fileURLToPath } from "node:url";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig([
  expoConfig,
  cspellESLintPluginRecommended,
  eslintPluginPrettierRecommended,
  {
    // Cherry-picked unicorn rules — the recommended preset is too noisy for
    // React Native (filename-case, no-null, prevent-abbreviations, prefer-module
    // all fight RN conventions). We opt in to the correctness/modernization
    // rules that carry their weight instead.
    plugins: { unicorn: eslintPluginUnicorn },
    rules: {
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/no-array-push-push": "error",
      "unicorn/no-useless-undefined": "error",
      "unicorn/prefer-date-now": "error",
      "unicorn/throw-new-error": "error",
      "unicorn/error-message": "error",
      "unicorn/no-instanceof-builtins": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prefer-string-slice": "error",
      "unicorn/prefer-string-replace-all": "error",
      // NOTE: prefer-node-protocol is intentionally omitted — Metro can't
      // resolve the `node:` protocol for polyfilled builtins (e.g. node:buffer
      // in src/hooks/useAISearch.ts), which breaks the bundle / EAS export.
      "unicorn/prefer-set-has": "error",
      "unicorn/no-useless-fallback-in-spread": "error",
      "unicorn/no-useless-spread": "error",
      "unicorn/consistent-existence-index-check": "error",
      "unicorn/prefer-global-this": "error",
    },
  },
  {
    // The `import` plugin can't parse eslint-plugin-unicorn's dist (it uses
    // import attributes / `with` syntax), producing false positives when this
    // config file imports it. Disable those rules for the config file only.
    files: ["eslint.config.mjs"],
    rules: {
      "import/namespace": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
    },
  },
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
    // react-hooks v7 added React Compiler rules to "recommended" that weren't
    // in v5. Disable the ones that produce false positives in React Native
    // (refs for Animated.Value patterns) or flag intentional patterns at scale.
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
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
