import { ScrollView, StyleSheet, View } from "react-native";

import { Heart } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import Support from "#/components/views/Support";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles as globalStyles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const SupportScreen = () => {
  const wpUrl = Config.wpUrl;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].secondaryBackground;
  return (
    <View style={globalStyles.container}>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor,
        }}
        contentContainerStyle={styles.contentContainer}
      >
        <Heart width={50} />
        <Support article_link={wpUrl + "/unterstutzen"} />
      </ScrollView>
      <NavBar link={wpUrl + "/unterstutzen"} />
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: "center",
    flexGrow: 1,
    gap: 20,
    paddingVertical: 50,
  },
});

export default SupportScreen;
