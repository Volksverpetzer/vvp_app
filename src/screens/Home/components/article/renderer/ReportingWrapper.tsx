import { useRouter } from "expo-router";
import { ReactNode } from "react";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { ErrorIcon } from "#/components/Icons";
import RightAction from "#/components/actions/RightAction";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { HttpsUrl } from "#/types";

interface ReportingWrapperProperties {
  url: HttpsUrl;
  renderIndex: number;
  children: ReactNode;
}

/**
 * Handles Swipeable / RightActions / Navigation für error reporting.
 */
const ReportingWrapper = ({
  url,
  renderIndex,
  children,
}: ReportingWrapperProperties) => {
  const router = useRouter();
  const colorScheme = useAppColorScheme();

  const errorReport = () => {
    router.push({
      pathname: "/(tabs)/report",
      params: {
        url,
        index: String(renderIndex),
      },
    });
  };

  return (
    <Swipeable
      renderRightActions={(p, d, s) => (
        <RightAction
          progress={p}
          drag={d}
          swipeable={s}
          icon={<ErrorIcon color={Colors[colorScheme].errorBackground} />}
          label="Fehler melden"
          backgroundColor={Colors[colorScheme].errorBackground}
          onAction={errorReport}
        />
      )}
    >
      {children}
    </Swipeable>
  );
};

export default ReportingWrapper;
