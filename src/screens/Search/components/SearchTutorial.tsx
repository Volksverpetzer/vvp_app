import { StyleSheet } from "react-native";

import FaktenBot from "#/components/animations/FaktenBot";
import Card from "#/components/design/Card";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";

const SearchTutorial = () => (
  <Card
    style={{
      alignItems: "center",
    }}
  >
    <UiText style={styles.text}>
      So funktioniert die Suche:{"\n"}• Echtzeit-Vorschläge beim Tippen{"\n"}•
      KI-FaktenBot für die Suche{"\n"}• Gib eine URL ein für einen Faktencheck
      dazu{"\n"}
      {"\n"}
      Gib einen Begriff ein und drücke &quot;Suchen&quot; für Ergebnislisten!
    </UiText>
    {/* Show FaktenBot on initial tutorial screen */}
    <View style={{ position: "absolute", top: 20, right: 20 }}>
      <FaktenBot search={false} reaction={undefined} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  text: { fontSize: 17, textAlign: "left" },
});

export default SearchTutorial;
