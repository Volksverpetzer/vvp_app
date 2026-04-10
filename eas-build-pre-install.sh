#!/usr/bin/env bash
# EAS pre-install hook — runs before `npm install` on every EAS build.
# Enforces the correct autolinking state regardless of what was committed:
#   IS_FOSS=true  → exclude expo-notifications (F-Droid build)
#   IS_FOSS!=true → include expo-notifications (Play Store / production build)
if [ "$IS_FOSS" = "true" ]; then
  node scripts/prepare-fdroid.mjs
else
  node scripts/prepare-play.mjs
fi
