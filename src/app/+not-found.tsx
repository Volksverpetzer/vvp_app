import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import EmptyComponent from "#/components/design/EmptyComponent";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const NotFoundScreen = () => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <View style={[globalStyles.content, { flex: 1 }]}>
        <EmptyComponent text="Hier könnte ein Artikel stehen. Tut er aber irgendwie nicht. Das ist wohl ein Fehler." />
      </View>
      <NavBar />
    </View>
  );
};

export default NotFoundScreen;
