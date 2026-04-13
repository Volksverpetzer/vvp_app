#!/usr/bin/env bash
# EAS pre-install hook — runs before `npm install` on every EAS build.
# Enforces the correct autolinking state regardless of what was committed:
#   BUILD_FLAVOR=fdroid  → exclude expo-notifications (F-Droid build)
#   BUILD_FLAVOR!=fdroid → include expo-notifications (Play Store / production build)
if [ "$BUILD_FLAVOR" = "fdroid" ]; then
  node scripts/prepare-fdroid.mjs
else
  node scripts/prepare-play.mjs
fi
