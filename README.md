# Volksverpetzer App

<a href="https://github.com/Volksverpetzer/vvp_app/releases/latest">
  <img src="https://img.shields.io/github/v/release/Volksverpetzer/vvp_app?color=3893C0&logo=github&style=for-the-badge&labelColor=1b7194"/>
</a>

[![Check Test and Lint](https://github.com/Volksverpetzer/vvp_app/actions/workflows/check-test-and-lint.yml/badge.svg)](https://github.com/Volksverpetzer/vvp_app/actions/workflows/check-test-and-lint.yml)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![Gitleaks](https://img.shields.io/badge/protected%20by-gitleaks-blue)](https://github.com/gitleaks/gitleaks-action)

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
   import { isVolksverpetzer } from "#/config/variants";

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

## Other useful scripts

- Run tests: `pnpm test`
- Lint: `pnpm lint`
- Fix lint issues: `pnpm lint:fix`
- Check types and spelling: `pnpm check`

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
