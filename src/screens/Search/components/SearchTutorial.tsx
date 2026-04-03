import type { StyleProp, TextStyle } from "react-native";

import Faktenbot from "#/components/animations/Faktenbot";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";

interface SearchTutorialProperties {
  textStyle: StyleProp<TextStyle>;
}

const SearchTutorial = ({ textStyle }: SearchTutorialProperties) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 30,
      paddingTop: 40,
    }}
  >
    <UiText style={textStyle}>
      So funktioniert die Suche:{"\n"}• Echtzeit-Vorschläge beim Tippen{"\n"}•
      KI-Faktenbot für die Suche{"\n"}• Gib eine URL ein für einen Faktencheck
      dazu{"\n"}
      {"\n"}
      Gib einen Begriff ein und drücke &quot;Suchen&quot; für Ergebnislisten!
    </UiText>
    {/* Show Faktenbot on initial tutorial screen */}
    <View style={{ position: "absolute", top: 20, right: 20 }}>
      <Faktenbot search={false} reaction={undefined} />
    </View>
  </View>
);

export default SearchTutorial;
