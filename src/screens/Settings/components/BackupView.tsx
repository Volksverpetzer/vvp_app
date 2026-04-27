import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Toast from "react-native-toast-message";

import { DownloadIcon, UploadIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import {
  isObjectRecord,
  isValidFavorites,
  isValidSources,
} from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const BackupView = () => {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const colorScheme = useAppColorScheme();
  const { primary, iconMuted } = Colors[colorScheme];

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
      const data: unknown = JSON.parse(content);

      if (!isObjectRecord(data)) {
        Toast.show({ type: "error", text1: "Ungültige Backup-Datei" });
        return;
      }

      const { favorites, sources } = data;

      if (favorites !== undefined && !isValidFavorites(favorites)) {
        Toast.show({ type: "error", text1: "Ungültige Backup-Datei" });
        return;
      }
      if (sources !== undefined && !isValidSources(sources)) {
        Toast.show({ type: "error", text1: "Ungültige Backup-Datei" });
        return;
      }
      if (!favorites && !sources) {
        Toast.show({ type: "error", text1: "Ungültige Backup-Datei" });
        return;
      }

      if (isValidFavorites(favorites)) {
        await FavoritesStore.setStoredFavs(favorites);
      }
      if (isValidSources(sources)) {
        await SourcesStore.setStoredSources(sources);
      }

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

  const rowStyle = { ...styles.row, paddingBottom: 20, maxHeight: 45 };

  return (
    <View style={{ padding: 20 }}>
      <Pressable
        accessibilityRole="button"
        onPress={handleExport}
        disabled={!!busy}
        style={rowStyle}
      >
        <UiText style={{ fontSize: 16, opacity: busy === "import" ? 0.4 : 1 }}>
          Sammlung exportieren
        </UiText>
        {busy === "export" ? (
          <ActivityIndicator color={primary} size="small" />
        ) : (
          <UploadIcon size={18} color={busy ? iconMuted : primary} />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={handleImport}
        disabled={!!busy}
        style={rowStyle}
      >
        <UiText style={{ fontSize: 16, opacity: busy === "export" ? 0.4 : 1 }}>
          Sammlung importieren
        </UiText>
        {busy === "import" ? (
          <ActivityIndicator color={primary} size="small" />
        ) : (
          <DownloadIcon size={18} color={busy ? iconMuted : primary} />
        )}
      </Pressable>
    </View>
  );
};

export default BackupView;
