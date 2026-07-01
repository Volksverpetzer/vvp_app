import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import { isInternalUploadUrl, openExternalDownload } from "#/helpers/Linking";
import type { HttpsUrl } from "#/types";

/**
 * Fallback screen for upload/download links (/wp-content/uploads/…) that the OS
 * handed to the app instead of the browser — this happens on Android < 31, where
 * the manifest's `pathAdvancedPattern` exclude is ignored and our app still
 * claims the URL. Opening the URL from a mounted screen (rather than inside
 * `+native-intent`'s `redirectSystemPath`) guarantees the native browser module
 * and navigation are ready. The file opens in a Custom Tab and we pop back so
 * the app is never left on a blank route.
 */
const ExternalLink = () => {
  const { url } = useLocalSearchParams<{ url?: string }>();

  useEffect(() => {
    const open = async () => {
      try {
        // Only open URLs we produced ourselves — an https link to a
        // /wp-content/uploads/ file on one of our hosts. This blocks an
        // open-redirect where a crafted `/external-link?url=…` deep link could
        // otherwise make the app open an arbitrary external URL.
        if (url && isInternalUploadUrl(url)) {
          await openExternalDownload(url as HttpsUrl);
        }
      } finally {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/");
        }
      }
    };
    void open();
  }, [url]);

  return <UiSpinner size="large" containerStyle={{ flex: 1 }} />;
};

export default ExternalLink;
