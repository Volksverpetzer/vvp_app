import { Image } from "expo-image";
import { ScrollView, View } from "react-native";

import { ErrorIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import Typography from "#/components/ui/Typography";
import EmptyComponent from "#/components/views/EmptyComponent";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import NotFoundImage from "#assets/images/404.webp";

const NotFoundScreen = () => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          globalStyles.content,
          {
            alignItems: "center",
            paddingVertical: spacing.huge,
          },
        ]}
      >
        <Typography type="heading">404 Whoops!</Typography>
        <EmptyComponent
          text="Die angeforderte Seite konnte nicht gefunden werden."
          icon={<ErrorIcon size={60} />}
        >
          <Image
            source={NotFoundImage}
            style={{ width: "100%", height: 200 }}
            contentFit="contain"
          />
        </EmptyComponent>
      </ScrollView>
      <NavBar />
    </View>
  );
};

export default NotFoundScreen;
