import { StyleSheet } from "react-native";

import FaktenBot from "#/components/animations/FaktenBot";
import Card from "#/components/design/Card";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";

interface SearchTutorialProperties {
  tab?: "artikel" | "ai";
}

const SearchTutorial = ({ tab = "artikel" }: SearchTutorialProperties) => (
  <Card style={{ alignItems: "center" }}>
    {tab === "artikel" ? (
      <UiText style={styles.text}>
        {
          "Artikel-Suche:\n• Echtzeit-Vorschläge beim Tippen\n• Drücke „Suchen“ für eine vollständige Ergebnisliste"
        }
      </UiText>
    ) : (
      <UiText style={styles.text}>
        {
          "KI-Faktenbot:\n• Gib einen Begriff oder eine Behauptung ein\n• Füge eine URL ein, um den Inhalt direkt zu prüfen\n• Drücke „Suchen“ für eine KI-gestützte Analyse"
        }
      </UiText>
    )}
    <View style={{ position: "absolute", top: 20, right: 20 }}>
      <FaktenBot search={false} reaction={undefined} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  text: { fontSize: 17, textAlign: "left" },
});

export default SearchTutorial;
