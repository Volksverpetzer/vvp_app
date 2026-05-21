import { Image, ScrollView, View } from "react-native";

import { ErrorIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import EmptyComponent from "#/components/design/EmptyComponent";
import Heading from "#/components/typography/Heading";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const NotFoundScreen = () => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <ScrollView
        style={globalStyles.content}
        contentContainerStyle={[
          globalStyles.content,
          {
            alignItems: "center",
            paddingVertical: 40,
          },
        ]}
      >
        <Heading>404 Whoops!</Heading>
        <EmptyComponent
          text="Die angeforderte Seite konnte nicht gefunden werden."
          icon={<ErrorIcon size={60} />}
        >
          <Image
            source={require("#assets/images/404.webp")}
            style={{ width: "100%", height: 200 }}
            resizeMode="contain"
          />
        </EmptyComponent>
      </ScrollView>
      <NavBar />
    </View>
  );
};

export default NotFoundScreen;
