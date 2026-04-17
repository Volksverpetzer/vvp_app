# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm start            # Start Expo dev server
pnpm ios              # Run on iOS simulator
pnpm android          # Run on Android emulator

# Lint & Type Checking
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + Prettier autofix
pnpm check:ts         # TypeScript type check (no emit)
pnpm check            # Both type check and spell check

# Tests
pnpm test             # Jest (all tests)
pnpm test -- --testPathPattern=IframeRenderer  # Run single test file

# EAS Builds
pnpm android:local    # Local APK build
pnpm android:submit   # Build + submit to store
```

## Architecture

**Volksverpetzer** is a German fact-checking news aggregator app (React Native 0.83 / Expo 55, TypeScript). It supports two app variants: Volksverpetzer and Mimikama, selected via `APP` env var in `app.config.ts`.

### Directory Structure

```
src/
├── app/              # Expo Router file-based routes
│   ├── (tabs)/       # Bottom tab screens (home, personal, action, report, settings)
│   ├── [category]/   # Dynamic article routes
│   ├── game/         # Quiz game screens
│   ├── bsky/, insta/ # Social media detail screens
│   └── _layout.tsx   # Root layout — wraps all providers
├── components/       # Shared UI components
├── screens/          # Full-screen feature implementations
│   └── Home/fetchers/  # Per-feed data fetchers
├── helpers/
│   ├── Stores/       # AsyncStorage persistence layer
│   ├── network/      # Axios API clients (ServerAPI.ts, WordPressAPI.ts)
│   ├── provider/     # React Context providers
│   └── utils/        # Shared utilities
├── hooks/            # Custom React hooks
└── constants/        # Colors and app-wide constants
__tests__/            # Jest tests mirroring src/ structure
config/               # Per-variant config (volksverpetzer.config, mimikama.config)
plugins/              # Custom Expo config plugins
```

### State Management

Context API + AsyncStorage — no Redux or Zustand.

- `SettingsProvider` — user content/advanced settings, auto-synced to AsyncStorage
- `BadgeProvider` — tab badge counts, persisted via `BadgeStore`
- All stores extend a `BaseStore` wrapper around `@react-native-async-storage/async-storage`

### Navigation

Expo Router with file-based routing. Bottom tabs defined in `src/app/(tabs)/`. Dynamic routes like `/[category]/[slug]` handle article detail pages. Deep link / share intent handled via `src/app/handle-share.tsx`.

### Network Layer

- `src/helpers/utils/networking.ts` — `createClient(baseURL)` factory, `fetchWithTimeout()`, typed `get<T>()` / `post<T, D>()` wrappers, custom User-Agent header
- `src/helpers/network/ServerAPI.ts` — all backend endpoints (feeds, reporting, search, payments, notifications)
- `src/helpers/network/WordPressAPI.ts` — WordPress REST API for articles
- Home feed data is fetched by individual fetchers in `src/screens/Home/fetchers/`, each returning normalized `Post` objects

### Path Aliases

Defined in `babel.config.cts` and `tsconfig.json`:

- `#/*` → `src/*`
- `#assets/*` → `assets/*`
- `#tests/*` → `__tests__/*`

## Creating a New Release

When bumping the app version for a new release, update **both** fields in `package.json`:

```json
"version": "X.Y.Z",
"versionCode": XXXXXXXXXX,
```

**`versionCode`** must be a unique integer that is strictly greater than the previous one. The fdroid bot reads both fields from `package.json` via the `UpdateCheckData` directive in `fdroiddata/metadata/de.volksverpetzer.app.yml`. If `versionCode` is missing or not incremented, fdroid will not detect the new release.

A good convention is a date-based code like `YYYYMMDDNN` (e.g. `2026041701` for the first release on 2026-04-17).

After updating `package.json`, also update the fdroid metadata file (`fdroiddata/metadata/de.volksverpetzer.app.yml`):

- Add a new entry under `Builds:` with the matching `versionName` and `versionCode`
- Update `CurrentVersion` and `CurrentVersionCode` at the bottom

### Code Style

- Arrow functions, 2-space indent, Prettier with sorted imports (enforced by lint-staged on commit)
- PascalCase for components, camelCase for hooks/utils
- TypeScript non-strict (no `strict: true`); avoid adding `any` types
- Pre-commit hooks via Husky run Prettier formatting automatically (lint-staged)
