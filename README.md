# Volksverpetzer App

[![Check Test and Lint](https://github.com/Volksverpetzer/vvp_app/actions/workflows/check-test-and-lint.yml/badge.svg)](https://github.com/Volksverpetzer/vvp_app/actions/workflows/check-test-and-lint.yml)
[![Gitleaks](https://img.shields.io/badge/protected%20by-gitleaks-blue)](https://github.com/gitleaks/gitleaks-action)

Die offizielle App für den Volksverpetzer.

Wir haben unsere App für Fact Checks direkt auf dem Handy entwickelt!
Was dann geschah, hielten viele für unmöglich.

# How to run

- Clone Repo
- Run `pnpm install`
- Run `pnpm run start` for dev version

Run eas build for native binaries, see https://docs.expo.dev/build/introduction/

# How to debug

## In WebStorm

### Start your Expo App

First, make sure your Expo development server and the application on your device/emulator are running:

- Run your start script `pnpm run start`
- Ensure the app is launched on a device/emulator.

### Configure a React Native Debugger in WebStorm

Next, set up the WebStorm run configuration to attach its debugger to your running app:

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
