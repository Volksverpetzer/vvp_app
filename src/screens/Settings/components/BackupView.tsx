import { Octicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { StoredFavs, StoredSources } from "#/types";

const BackupView = () => {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const colorScheme = useAppColorScheme();
  const { primary, iconOnPrimary } = Colors[colorScheme];

  const handleExport = async () => {
    setBusy("export");
    try {
      const [favorites, sources] = await Promise.all([
        FavoritesStore.getAllFavorites(),
        SourcesStore.getAllSources(),
      ]);
      const date = new Date().toISOString().split("T")[0];
      const filename = `vvp_data_${date}.json`;
      const file = new File(Paths.document, filename);
      file.write(JSON.stringify({ favorites, sources }, null, 2));
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Backup exportieren",
        UTI: "public.json",
      });
    } catch {
      Toast.show({ type: "error", text1: "Export fehlgeschlagen" });
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy("import");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const content = await new File(result.assets[0].uri).text();
      const data = JSON.parse(content) as {
        favorites?: StoredFavs;
        sources?: StoredSources;
      };

      if (!data.favorites && !data.sources) {
        Toast.show({ type: "error", text1: "Ungültige Backup-Datei" });
        return;
      }

      if (data.favorites) await FavoritesStore.setStoredFavs(data.favorites);
      if (data.sources) await SourcesStore.setStoredSources(data.sources);

      Toast.show({
        type: "success",
        text1: "Import erfolgreich",
        text2: "Deine Daten wurden wiederhergestellt.",
      });
    } catch {
      Toast.show({ type: "error", text1: "Import fehlgeschlagen" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <UiText style={styles.description}>
        Exportiere deine Favoriten und gespeicherten Quellen als JSON-Datei oder
        stelle sie aus einem Backup wieder her.
      </UiText>
      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          onPress={handleExport}
          disabled={!!busy}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: primary,
              opacity: pressed || !!busy ? 0.7 : 1,
            },
          ]}
        >
          {busy === "export" ? (
            <ActivityIndicator color={iconOnPrimary} size="small" />
          ) : (
            <>
              <Octicons name="upload" size={18} color={iconOnPrimary} />
              <UiText style={[styles.buttonLabel, { color: iconOnPrimary }]}>
                Exportieren
              </UiText>
            </>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleImport}
          disabled={!!busy}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: primary,
              opacity: pressed || !!busy ? 0.7 : 1,
            },
          ]}
        >
          {busy === "import" ? (
            <ActivityIndicator color={iconOnPrimary} size="small" />
          ) : (
            <>
              <Octicons name="download" size={18} color={iconOnPrimary} />
              <UiText style={[styles.buttonLabel, { color: iconOnPrimary }]}>
                Importieren
              </UiText>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 16,
  },
  description: {
    fontSize: 14,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default BackupView;
