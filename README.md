# Volksverpetzer App

<a href="https://github.com/Volksverpetzer/vvp_app/releases/latest">
  <img src="https://img.shields.io/github/v/release/Volksverpetzer/vvp_app?color=3893C0&logo=github&style=for-the-badge&labelColor=1b7194" alt="Latest release"/>
</a>

[![Check Test and Lint](https://github.com/Volksverpetzer/vvp_app/actions/workflows/check-test-and-lint.yml/badge.svg)](https://github.com/Volksverpetzer/vvp_app/actions/workflows/check-test-and-lint.yml)
[![codecov](https://codecov.io/gh/Volksverpetzer/vvp_app/graph/badge.svg)](https://codecov.io/gh/Volksverpetzer/vvp_app)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![Gitleaks](https://img.shields.io/badge/protected%20by-gitleaks-blue)](https://github.com/gitleaks/gitleaks-action)
[![F-Droid release](https://img.shields.io/f-droid/v/de.volksverpetzer.app.svg?logo=F-Droid)](https://f-droid.org/en/packages/de.volksverpetzer.app/)

Official mobile app for Volksverpetzer (build with Expo + TypeScript).

## Requirements

- [node.js](https://nodejs.org/en/download/current) v24.x or higher
- [pnpm](https://pnpm.io/)

## Quick start

- Clone the repository:
  - `git clone https://github.com/Volksverpetzer/vvp_app.git`

- Change into project directory:
  - `cd vvp_app`

- Install dependencies:
  - `pnpm install`

- Start development server:
  - `pnpm start`

## Configuration

The app expects a `./.env` file in the project root for some minor configuration.

See `.env.example` for reference.

## App variants

The app supports two variants — **Volksverpetzer** and **Mimikama** — selected via the `APP` environment variable (see `app.config.ts`).

### Variant-specific images (`AppImages`)

`src/helpers/AppImages.ts` is the central registry for assets that differ between variants. Instead of importing image files directly in components, always go through `AppImages`:

```tsx
import { AppImages } from "#/helpers/AppImages";

// Some AppImages entries can be null — guard before use (see table below)
if (!AppImages.loadingAnimation) return null;
<Image source={AppImages.loadingAnimation} ... />
```

**Available entries**

| Key                | Volksverpetzer asset path                       | Mimikama asset path                       |
| ------------------ | ----------------------------------------------- | ----------------------------------------- |
| `shopButton`       | `assets/images/volksverpetzer/button_shop.webp` | `assets/images/mimikama/button_shop.webp` |
| `loadingAnimation` | `assets/images/logo_animated.gif`               | `null`                                    |

**Adding a new variant asset**

1. Place the asset file(s) under `assets/images/`.
2. Import them in `AppImages.ts` and add a new key using the `isVolksverpetzer` flag:

   ```ts
   import { isVolksverpetzer } from "#/helpers/utils/variant";

   import MimikamaMyAsset from "#assets/images/mimikama_my_asset.webp";
   import VVPMyAsset from "#assets/images/my_asset.webp";

   export const AppImages = {
     // ...existing keys
     myAsset: isVolksverpetzer ? VVPMyAsset : MimikamaMyAsset,
   } as const;
   ```

3. Use `AppImages.myAsset` in your component. If a variant has no asset, use `null` and guard against it in the component.

## Icons

Icons are sourced from the **Octicons** icon set via `@expo/vector-icons`. Use the [icon browser](https://oblador.github.io/react-native-vector-icons/#Octicons) to find available icon names. Standard UI icons should go through `src/components/Icons.tsx`, while custom SVG icons (e.g. logos, place icons) are provided via `src/components/SvgIcons.tsx`.

## Running the App

For platform-specific runs:

- `pnpm ios`
- `pnpm android`
- `pnpm web`

## EAS Build Profiles

| Profile       | `distribution`  | Used for                                                                            |
| ------------- | --------------- | ----------------------------------------------------------------------------------- |
| `development` | `internal`      | Dev builds with `expo-dev-client` for the team (`dev:*` scripts)                    |
| `preview`     | `internal`      | Direct APK sharing with designers (`preview:build`)                                 |
| `internal`    | store (default) | Beta store submission — Play Store + App Store (`expo-release-beta.yml`)            |
| `production`  | store (default) | Stable store submission + GitHub release APK (`expo-release.yml`, default profile)  |
| `local-apk`   | `internal`      | Local Android APK build — run via `pnpm android:local` or `expo-release(-beta).yml` |
| `local-ios`   | `internal`      | Local iOS simulator build — run via `pnpm ios:local`                                |
| `mimikama`    | store (default) | Mimikama variant store submission                                                   |
| `fdroid`      | `internal`      | F-Droid / FOSS local build (no push notifications)                                  |

## Development Builds (EAS)

Development builds include `expo-dev-client` and support full native modules — unlike Expo Go. They are built via EAS and can be shared with the team via a URL.

```bash
pnpm dev:android   # Android
pnpm dev:ios       # iOS
pnpm dev:all       # Both platforms at once
```

After the build finishes, EAS generates a shareable URL. Team members can open it on their device to download and install directly, or use:

```bash
pnpx eas-cli build:run --profile development
```

**iOS notes:**

- iOS 16+: enable Developer Mode on the device (_Settings → Privacy & Security → Developer Mode_)
- Devices must be registered in your Apple Developer account — EAS will prompt you to register new ones via QR code during the build
- To add a new device without a full rebuild: `pnpx eas-cli build:resign`

After installing the build, start the dev server as usual:

```bash
pnpm start
```

## Preview Builds (Internal Distribution)

Preview builds are standalone release builds intended for sharing with testers or designers who are **not on the same network**. Unlike development builds, they do not require a running dev server.

```bash
pnpm preview:build   # Build Android APK via EAS (internal distribution)
```

When the build finishes, EAS generates a shareable install link with a QR code — no Expo account required for the recipient. Testers just open the link on their Android device and install the APK.

**iOS:** Apple requires either TestFlight (invite testers by email, recommended) or ad-hoc distribution (device UDIDs must be registered in your Apple Developer account first). There is no equivalent one-click install link for iOS.

### Iterating without a full rebuild (OTA updates)

For JS-only changes (UI, fonts, copy) you can push an over-the-air update to everyone who already has the preview build installed — no reinstall needed:

```bash
pnpm preview:update
```

This publishes the current branch's JS bundle to the `preview` channel. The app picks it up silently on next launch.

**Typical workflow when sharing a branch with designers:**

```bash
# First time — send them the install link EAS prints
pnpm preview:build

# Every subsequent change on the same branch
pnpm preview:update
```

## Releasing

### Beta release

Beta releases target the Play Store internal track and TestFlight, and produce a GitHub prerelease with APK artifacts. They are triggered by a tag on the `prerelease` branch.

Feature branches are merged into `prerelease` via GitHub PRs as soon as they are ready, using **squash merge**.

When enough features have accumulated to warrant a beta:

1. **Bump the version** in `package.json` — both `version` (e.g. `1.2.3-beta.1`) and `versionCode` (use `YYYYMMDDNN`, must be strictly greater than the previous value):

   ```json
   { "version": "1.2.3-beta.1", "versionCode": 2026051201 }
   ```

2. **Refresh license data** if any dependencies were added, removed, or updated since the last release. Skip this step if `package.json` dependencies are unchanged.

   Run locally and include the result in the same prep commit:

   ```bash
   pnpm prepare:licenses
   ```

   Alternatively, trigger it via GitHub Actions without a local checkout: go to **Actions → Update license data → Run workflow**, select the `prerelease` branch, and click **Run workflow**. The workflow commits the updated file directly to the branch — pull before tagging.

   Commit both changes together and push to `prerelease`:

   ```bash
   git add package.json src/screens/Settings/components/licenses/data.tsx
   git commit -m "chore: prepare 1.2.3-beta.1"
   git push origin prerelease
   ```

3. **Tag and push** — the tag triggers `expo-release-beta.yml`:

   ```bash
   git tag 1.2.3-beta.1
   git push origin 1.2.3-beta.1
   ```

   The workflow runs lint/tests, submits to both stores, and creates a GitHub prerelease with the APK attached.

---

### Stable release

Stable releases target the public Play Store and App Store tracks and produce a GitHub release.

1. **Open a PR** on GitHub from `prerelease` into `main`, titled **"Release vX.Y.Z"**, and merge it with a **regular merge commit** (not squash).

2. **Tag and push** — the tag triggers `expo-release.yml`:

   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

3. **Update the F-Droid metadata** in the separate `fdroiddata` repository:
   - Add a new entry under `Builds:` in `metadata/de.volksverpetzer.app.yml` with the matching `versionName` and `versionCode`.
   - Update `CurrentVersion` and `CurrentVersionCode` at the bottom of that file.

---

## Other useful scripts

- Run tests: `pnpm test`
- Lint: `pnpm lint`
- Fix lint issues: `pnpm lint:fix`
- Check types and spelling: `pnpm check`

## F-Droid / FOSS build (no push notifications)

F-Droid builds should avoid bundling non-free Google/Firebase libraries. This project supports a
FOSS variant by excluding `expo-notifications` from Android autolinking and by disabling the
notifications config plugin when `BUILD_FOSS_ONLY=true`.

- Build with FOSS mode enabled: `BUILD_FOSS_ONLY=true npx expo prebuild --platform android --no-install` (or your preferred Android build command)

## Debugging

### Configure a React Native Debugger in WebStorm

Set up the WebStorm run configuration to attach its debugger to your running app:

1. Go to Run | Edit Configurations....
2. Click the + icon in the top left corner and select React Native from the list.
3. Name the configuration (e.g., "Debug Expo Hermes").
4. In the configuration settings:
   - Ensure the "Hermes engine is enabled" checkbox is selected.
   - Unselect the "Build and launch application" checkbox, as your app is already running from Step 1.
   - Set the Bundler host to 127.0.0.1.
   - Ensure the Bundler port is the one your Metro bundler is using (default is 8081, but Expo Go often uses 19000).
   - In the "Before launch" section, you may want to remove the "Start React Native Bundler" task if you started it manually.
   - Click OK to save the configuration.

### Attach the WebStorm Debugger

Now, you can start the debugging session from within WebStorm:

1.  Set breakpoints in your code by clicking in the gutter next to the line numbers where you want execution to pause.
2.  Select your newly created "Debug Expo Hermes" configuration from the dropdown menu in the top-right corner of the IDE.
3.  Click the Debug (bug) button next to the Run button. The Debug tool window will open.
4.  On your physical device or emulator, open the Developer Menu (shake the device, press Ctrl + Cmd + Z on iOS simulator, or Ctrl + M on Android emulator).
5.  Select "Enable Local DevTools" or "Open JS Debugger" from the menu to connect the app to the WebStorm debugger session.
6.  Once connected, your breakpoints should be triggered, and you can inspect variables, the call stack, and step through your code in the WebStorm Debug tool window.

### How to check that assets are properly bundled

Download the latest release from GitHub (the APK), and run the following commands in the project root:

- `unzip -p vvp-app-XXXX.apk assets/app.manifest > app.manifest`
- `npx expo export --dump-assetmap`
- `npx expo-updates assets:verify -b app.manifest -a dist/assetmap.json -e dist/metadata.json -p android`
