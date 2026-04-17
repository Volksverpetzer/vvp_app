# AGENTS.md — Quick guide for coding agents working on this repository

This file gives focused, actionable facts an AI coding agent needs to be productive in the vvp_app codebase.

What this doc contains (quick checklist)

- Read the big-picture architecture notes and service boundaries.
- Follow the verified developer workflows (start, build, tests, lint, FOSS build).
- Use project-specific conventions (component style, import ordering, files to touch for variants).
- Check integration points (fetchers, analytics, native config) before changing behavior.

Big picture (1–2 lines)

- Expo + TypeScript mobile app (Expo SDK 55 / React Native 0.83) using expo-router. Main entry: `expo-router/entry` (see `package.json`).
- Two app variants controlled by `APP` env var and `app.config.ts` + `config/*.ts` (Volksverpetzer vs Mimikama).

Key directories / responsibilities

- `src/app/` — router-backed screens (expo-router). Modify routes here.
- `src/components/` — UI building blocks (animations, buttons, popups). Components are arrow functions and exported default.
- `src/helpers/` — utilities, network clients (`network/ServerAPI.ts`, `network/WordPressAPI.ts`), providers, stores.
- `src/screens/Home/fetchers/` — per-feed fetchers (WordPress, Instagram, YouTube, Bluesky, etc.). All fetchers normalize to `Post` objects.
- `src/screens/` — full-screen feature implementations (e.g. `Home/` with per-feed fetchers).
- `src/hooks/` — reusable hooks (eg. notification & feed hooks).
- `config/` — app-variant configs (`volksverpetzer.config.ts`, `mimikama.config.ts`).

Important files to read before changing behavior (examples)

- `package.json` — scripts and dependency versions. Useful scripts: `pnpm start`, `pnpm android|ios|web`, `pnpm test`, `pnpm lint`, `pnpm lint:fix`, `pnpm check`.
- `app.config.ts` — picks variant config via `APP` env var.
- `src/helpers/AppImages.ts` — central registry for variant-specific assets; guard against `null` values.
- `src/screens/Home/fetchers/` — all feed fetchers; they return normalized `Post` objects.
- `src/helpers/Networking/Analytics` — analytics helpers.
- `tsconfig.json` — `strict: false` (type checking is relaxed in this repo).
- `jest.config.ts` and `jest-setup.ts` — how tests are configured (use `jest-expo`).

Project-specific conventions (do these exactly)

- Components: use arrow functions and PascalCase filenames (example patterns present across `src/components/*`).
- Indentation: 2 spaces (see `.editorconfig` + README). Keep imports sorted via Prettier plugin `@trivago/prettier-plugin-sort-imports`.
- Import order: sorted automatically by `@trivago/prettier-plugin-sort-imports` on commit; use path aliases (`#/*`) over deep relative imports.
- Tests live in `__tests__/` and mirror `src/` structure (use `@testing-library/react-native`).

Dev workflows & commands (copyable)

- Install: `pnpm install`
- Start (Metro/Expo): `pnpm start`
- Run platform: `pnpm ios`, `pnpm android`, `pnpm web`
- Tests: `pnpm test` (Jest / jest-expo)
- Type check & spelling: `pnpm check` (`tsc --noEmit` + cspell)
- Lint: `pnpm lint` and auto-fix: `pnpm lint:fix`
- F-Droid / FOSS prebuild: `BUILD_FOSS_ONLY=true npx expo prebuild --platform android --no-install`

Integration points & external dependencies to be careful about

- Native / build plugins: `plugins/*.ts` and `expo` config in `app.config.ts`. Changing native modules or config may require `expo prebuild` / native rebuilds.
- Google / Firebase config: `google-services.json` and `google-services-mimikama.json` exist in the repo — do NOT commit new secrets. CI uses Gitleaks.
- Analytics & feeds: modify only in `src/helpers/Networking/` and `src/screens/Home/fetchers/` — these functions return normalized objects consumed app-wide.

Path aliases (defined in `babel.config.cts` and `tsconfig.json`)

- `#/*` → `src/*`
- `#assets/*` → `assets/*`
- `#tests/*` → `__tests__/*`

Creating a new release

- Update **both** `version` (SemVer) and `versionCode` (integer) in `package.json`. `versionCode` must be strictly greater than the previous value — use `YYYYMMDDNN` convention (e.g. `2026041701`).
- The F-Droid bot reads both fields via `fdroiddata/metadata/de.volksverpetzer.app.yml`. Also update that file: add a new `Builds:` entry and update `CurrentVersion` / `CurrentVersionCode` at the bottom.

Agent best practices (project-specific)

- Always run `pnpm check` + `pnpm test` after behavioural edits. CI runs checks and tolerates some TS errors; but local `tsc --noEmit` should pass for PRs.
- If adding assets for variant-specific UI, update `src/helpers/AppImages.ts` and guard null where README shows examples.
- When changing routing, edit `src/app/` routes and ensure `expo-router` entry remains unchanged.
- For performance-sensitive UI, look at `src/components/animations/` and `rive/` assets (Rive animations). Heavy JS work should be profiled in device/emulator.

Where to update this doc / who to ask

- Keep `AGENTS.md` in repo root. When changing global conventions (import order, formatting), update `.editorconfig`, `prettier.config.mts`, and mention in this file.

Quick references (paths and examples)

- Variant config: `config/volksverpetzer.config.ts`
- Asset registry: `src/helpers/AppImages.ts`
- Fetchers: `src/screens/Home/fetchers/*` (normalizes Post objects)
- Analytics: `src/helpers/Networking/Analytics/*`
- Tests & mocks: `__tests__/` and `__tests__/mocks/`
- Build scripts: `scripts/prepare-fdroid.mjs` and `package.json` scripts

Limitations of this doc

- This is a practical aide for coding agents, not an exhaustive architecture doc. For platform-specific native issues read `android/` or `ios/` and `plugins/` before edits.

---

Last updated: generated automatically — confirm facts by opening referenced files.
