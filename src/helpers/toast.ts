import Toast from "react-native-toast-message";

export const toast = {
  success(text1: string, text2?: string) {
    Toast.show({
      type: "success",
      text1,
      text2,
      position: "bottom",
      visibilityTime: 3000,
      autoHide: true,
    });
  },

  error(text1: string, text2?: string) {
    Toast.show({
      type: "error",
      text1,
      text2,
      position: "bottom",
      visibilityTime: 4000,
      autoHide: true,
    });
  },

  info(text1: string, text2?: string) {
    Toast.show({
      type: "info",
      text1,
      text2,
      position: "bottom",
    });
  },

  confirm(text1: string, text2: string, onConfirm: () => void) {
    Toast.show({
      type: "info",
      text1,
      text2,
      position: "bottom",
      visibilityTime: 5000,
      autoHide: true,
      onPress: () => {
        Toast.hide();
        onConfirm();
      },
    });
  },
};
