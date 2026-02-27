import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";
import Toast from "react-native-toast-message";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";

import { Achievements } from "./Achievements";
import Statistics from "./Statistics";

interface ShareableType {
  url: string;
  title: string;
}

/**
 * onShare tries to share a url. If the url is an image, it will be downloaded first.
 * If the platform is android, the image will be shared with the expo-sharing package.
 * If the platform is ios, the image will be shared with the react-native-share package.
 * On Android Analytics will always be registered, on iOS only if the user actually shared the content.
 * @returns
 * @param filename
 */
const isImageFile = (filename: string): boolean => {
  const imageExtensions = [".jpg", ".png", ".webp", ".gif"];
  return (
    imageExtensions.some((extension) => filename.endsWith(extension)) ||
    filename.includes("media_url")
  );
};

/**
 * Extracts the file type from a filename.
 *
 * @param filename The filename to extract the file type from
 * @returns The file type (e.g., 'jpg', 'png', etc.) or 'jpg' if no file type is found
 */
const getFileType = (filename: string): string => {
  if (!filename.includes(".")) return "jpg";
  return filename.split(".").pop();
};

/**
 * Downloads an image from the given URL and saves it to the device's file system.
 * If the URL is a local file, it will not be downloaded and the local path will be returned.
 * @param url The URL of the image to download
 * @param fileType The type of file to save the image as (e.g., 'jpg', 'png', etc.)
 * @returns The path to the downloaded image on the device's file system
 */
const downloadImage = async (
  url: string,
  fileType: string,
): Promise<string> => {
  if (!url.startsWith("/") && !url.startsWith("file://")) {
    const destination = new File(Paths.document, `temp.${fileType}`);
    const file = await File.downloadFileAsync(url, destination, {
      idempotent: true,
    });
    return file.uri;
  }
  return url;
};

/**
 * Handles sharing an image on Android devices.
 *
 * @param uri The URI of the image to share
 * @param fileType The type of file to save the image as (e.g., 'jpg', 'png', etc.)
 * @param url The URL of the image that was shared
 * @param properties Additional properties to include in the share event
 * @returns A promise that resolves to true when the sharing is complete
 */
const handleAndroidImageShare = async (
  uri: string,
  fileType: string,
  url: string,
  properties: object,
): Promise<boolean> => {
  await Sharing.shareAsync(uri, {
    mimeType: "image/" + fileType,
    dialogTitle: "Als Bild teilen",
    UTI: fileType,
  });
  await registerEvent(url, "Share", {
    activityType: "androidImage",
    ...properties,
  });
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return true;
};

/**
 * Handles post-sharing operations after a successful share.
 *
 * Registers a share event, updates achievements and statistics if applicable,
 * and provides haptic feedback to the user.
 *
 * @param url - The URL that was shared.
 * @param activityType - The type of activity used for sharing (e.g., 'facebook', 'twitter', etc.) or null.
 * @param properties - Additional properties to include in the share event.
 * @returns A promise that resolves to true when all operations are complete.
 */
const handleSuccessfulShare = async (
  url: string,
  activityType: string | null,
  properties: object,
): Promise<boolean> => {
  await registerEvent(url, "Share", {
    activityType: activityType ?? "unknown",
    ...properties,
  });
  if (url.includes(Config.wpUrl)) {
    Achievements.setAchievementValue("sharefact");
    // Update statistic for sharing an article
    Statistics.countArticleShared();
  }
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return true;
};

/**
 * Shares a URL using the native sharing functionality.
 *
 * @param url - The URL to share.
 * @param properties - Additional properties to pass to the share event.
 * @returns {Promise<boolean>} A promise that resolves to true if the sharing was successful, false otherwise.
 */
const onShare = async (
  url: string,
  properties: object = {},
): Promise<boolean> => {
  try {
    await Haptics.selectionAsync();
    const path = Linking.parse(url).path ?? "";
    const filename = path.split("/").pop() ?? "";
    const isImage = isImageFile(filename);

    if (isImage) {
      const fileType = getFileType(filename);
      const uri = await downloadImage(url, fileType);

      if (Platform.OS === "android") {
        return handleAndroidImageShare(uri, fileType, url, properties);
      }

      if (Platform.OS === "ios") {
        const result = await Share.share({ url: uri });
        if (result.action === Share.sharedAction) {
          return handleSuccessfulShare(url, result.activityType, properties);
        }
        return false;
      }
    }

    const shareUrl = new URL(url);
    shareUrl.searchParams.set("utm_source", "app_share");
    const share_url = shareUrl.toString();

    const result = await Share.share({ message: share_url });
    if (result.action === Share.sharedAction || Platform.OS === "android") {
      return handleSuccessfulShare(url, result.activityType, properties);
    }

    return false;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

/**
 * multishare is a wrapper for onShare. It will show an alert with the given shareable items.
 * @returns : Promise<boolean> - true if the user shared something, false if the user cancelled the sharing
 * On Android Sharing will always be registered if the Share Sheet opens, on iOS only if the user actually shared the content.
 * @param shareable ShareableType[] - Array of ShareableType objects
 * @param properties object - Additional props to be passed to onShare
 */
const multishare = async (
  shareable: ShareableType[],
  properties: object = {},
): Promise<boolean> => {
  Haptics.selectionAsync();
  if (shareable.length === 1) {
    return await onShare(shareable[0].url, properties);
  } else {
    return new Promise((resolve) => {
      Toast.show({
        type: "share",
        position: "bottom",
        autoHide: false,
        onHide: () => undefined,
        props: {
          items: shareable.map((item) => ({
            title: item.title,
            onPress: async () => {
              Toast.hide();
              const result: boolean = await onShare(item.url, properties);
              resolve(result);
            },
          })),
          onCancel: () => {
            Toast.hide();
            resolve(false);
          },
        },
      });
    });
  }
};

export type { ShareableType };
export { onShare, multishare };
