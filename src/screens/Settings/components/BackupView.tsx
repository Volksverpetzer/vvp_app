import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { DownloadIcon, UploadIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { toast } from "#/helpers/toast";
import {
  isObjectRecord,
  isValidFavorites,
  isValidSources,
} from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const BackupView = () => {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const colorScheme = useAppColorScheme();
  const { primary, textMuted } = Colors[colorScheme];

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
      toast.success("Export erfolgreich", "Deine Daten wurden exportiert.");
    } catch {
      toast.error("Export fehlgeschlagen", "Versuche es erneut.");
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

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        toast.error(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        return;
      }

      const content = await new File(uri).text();
      const data: unknown = JSON.parse(content);

      if (!isObjectRecord(data)) {
        toast.error(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        return;
      }

      const { favorites, sources } = data;

      if (favorites !== undefined && !isValidFavorites(favorites)) {
        toast.error(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        return;
      }
      if (sources !== undefined && !isValidSources(sources)) {
        toast.error(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        return;
      }
      if (!favorites && !sources) {
        toast.error(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        return;
      }

      if (isValidFavorites(favorites)) {
        await FavoritesStore.setStoredFavs(favorites);
      }
      if (isValidSources(sources)) {
        await SourcesStore.setStoredSources(sources);
      }

      toast.success(
        "Import erfolgreich",
        "Deine Daten wurden wiederhergestellt.",
      );
    } catch {
      toast.error("Import fehlgeschlagen", "Versuche es erneut.");
    } finally {
      setBusy(null);
    }
  };

  const rowStyle = [globalStyles.row, { paddingBottom: 20, maxHeight: 45 }];

  return (
    <View style={{ padding: 20 }}>
      <UiPressable
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
          <UploadIcon size={18} color={busy ? textMuted : primary} />
        )}
      </UiPressable>
      <UiPressable
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
          <DownloadIcon size={18} color={busy ? textMuted : primary} />
        )}
      </UiPressable>
    </View>
  );
};

export default BackupView;
