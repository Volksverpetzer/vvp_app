import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import useAppColorScheme from "#/hooks/useAppColorScheme";
import Licenses from "#/screens/Settings/components/licenses/Licenses";

const LicensesScreen = () => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  return (
    <View
      style={{
        ...styles.container,
        backgroundColor,
      }}
    >
      <Licenses />
      <NavBar />
    </View>
  );
};

export default LicensesScreen;
