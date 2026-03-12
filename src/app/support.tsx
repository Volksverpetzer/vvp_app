import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { HeartIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import Space from "#/components/design/Space";
import Support from "#/components/views/Support";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles as globalStyles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

const SupportScreen = () => {
  const wpUrl = Config.wpUrl;
  const supportUrl = `${wpUrl}/unterstutzen` satisfies HttpsUrl;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].secondaryBackground;

  const HEADER_HEIGHT = 50;

  return (
    <View style={globalStyles.container}>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor,
        }}
        contentContainerStyle={{
          alignItems: "center",
          flexGrow: 1,
          paddingTop: HEADER_HEIGHT,
          gap: 20,
        }}
      >
        <HeartIcon width={50} />
        <Support article_link={supportUrl} />
        <Space size={100} />
      </ScrollView>
      <NavBar link={supportUrl} />
    </View>
  );
};

export default SupportScreen;
