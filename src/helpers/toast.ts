import Toast from "react-native-toast-message";

export const toast = {
  success(text1: string, text2?: string) {
    Toast.show({
      type: "success",
      text1,
      text2,
      visibilityTime: 3000,
      autoHide: true,
    });
  },

  error(text1: string, text2?: string) {
    Toast.show({
      type: "error",
      text1,
      text2,
      visibilityTime: 4000,
      autoHide: true,
    });
  },

  info(text1: string, text2?: string) {
    Toast.show({
      type: "info",
      text1,
      text2,
    });
  },
};
