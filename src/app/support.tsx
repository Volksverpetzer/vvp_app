import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { HeartIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import Support from "#/components/views/Support";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

const SupportScreen = () => {
  const wpUrl = Config.wpUrl;
  const supportUrl = `${wpUrl}/unterstutzen` satisfies HttpsUrl;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  const HEADER_HEIGHT = 50;

  return (
    <View style={globalStyles.container}>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor,
        }}
        contentContainerStyle={[
          globalStyles.content,
          {
            paddingTop: HEADER_HEIGHT,
            paddingBottom: 100,
            alignItems: "center",
          },
        ]}
      >
        <HeartIcon color={corporate} size={iconSizes.xl} />
        <Support article_link={supportUrl} />
      </ScrollView>
      <NavBar link={supportUrl} />
    </View>
  );
};

export default SupportScreen;
