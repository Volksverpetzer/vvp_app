import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import useColorScheme from "#/hooks/useColorScheme";
import Licenses from "#/screens/Settings/components/licenses/Licenses";

const LicensesScreen = () => {
  const colorScheme = useColorScheme();
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
