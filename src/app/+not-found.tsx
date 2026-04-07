import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";

import EmptyComponent from "#/components/design/EmptyComponent";
import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";
import { outBoundLinkPress } from "#/helpers/Linking";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types/config";

const NotFoundScreen = () => {
  const corporate = useCorporateColor();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldExcludeFromDeepLink(pathname)) return;

    const fullUrl = `${Config.wpUrl}${pathname}` satisfies HttpsUrl;
    outBoundLinkPress(fullUrl);
    router.replace("/");
  }, [pathname, router]);

  return (
    <View
      style={{
        flexDirection: "column",
        ...styles.centered,
      }}
    >
      <Heading style={{ textAlign: "center" }}>
        Hier könnte ein Artikel stehen. Tut er aber irgendwie nicht. Das ist
        wohl ein Fehler.
      </Heading>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.back()}
      >
        <UiText style={{ padding: 20, fontSize: 18, color: corporate }}>
          Zurück!
        </UiText>
      </TouchableOpacity>
      <EmptyComponent />
    </View>
  );
};

export default NotFoundScreen;
