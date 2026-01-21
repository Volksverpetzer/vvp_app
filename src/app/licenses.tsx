import { View } from "react-native";

import NavBar from "../components/bars/NavBar";
import { styles } from "../constants/Styles";
import Licenses from "../screens/Settings/components/licenses/Licenses";

const LicensesScreen = () => {
  return (
    <>
      <View style={styles.container}>
        <Licenses />
        <NavBar />
      </View>
    </>
  );
};

export default LicensesScreen;
