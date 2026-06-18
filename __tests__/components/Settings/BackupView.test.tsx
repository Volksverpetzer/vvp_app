import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
// ── helpers ───────────────────────────────────────────────────────────────────
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import React from "react";

import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { toast } from "#/helpers/toast";
import BackupView from "#/screens/Settings/components/BackupView";

// ── expo-file-system ────────────────────────────────────────────────────────
const mockFileWrite = jest.fn();
const mockFileText = jest.fn<() => Promise<string>>();
const mockFileUri = "file://docs/vvp_data_2026-01-01.json";

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    write: mockFileWrite,
    uri: mockFileUri,
    text: mockFileText,
  })),
  Paths: { document: "file://docs" },
}));

// ── expo-sharing ─────────────────────────────────────────────────────────────
jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// ── expo-document-picker ─────────────────────────────────────────────────────
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

// ── Toast ─────────────────────────────────────────────────────────────────────
jest.mock("#/helpers/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    confirm: jest.fn(),
  },
}));

// ── Stores ────────────────────────────────────────────────────────────────────
jest.mock("#/helpers/Stores/FavoritesStore", () => ({
  __esModule: true,
  default: {
    getAllFavorites: jest.fn(),
    setStoredFavs: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}));
jest.mock("#/helpers/Stores/SourcesStore", () => ({
  __esModule: true,
  default: {
    getAllSources: jest.fn(),
    setStoredSources: jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined),
  },
}));

// ── Styling / colours ─────────────────────────────────────────────────────────
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));
jest.mock("#/constants/Colors", () => ({
  light: { primary: "#e63312", iconMuted: "#999" },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: {
    row: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
  },
}));
jest.mock("#/components/Icons", () => ({
  DownloadIcon: jest.fn(() => null),
  UploadIcon: jest.fn(() => null),
}));

const validBackupJson = JSON.stringify({
  favorites: { abc: { contentType: "article" } },
  sources: { "https://example.com": { slug: "example" } },
});

describe("BackupView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("shows export and import rows", () => {
      const { getByText } = render(<BackupView />);
      expect(getByText("Sammlung exportieren")).toBeTruthy();
      expect(getByText("Sammlung importieren")).toBeTruthy();
    });
  });

  describe("export", () => {
    it("reads both stores, writes the file, and opens the share sheet", async () => {
      jest.mocked(FavoritesStore.getAllFavorites).mockResolvedValue({
        abc: { contentType: "article" },
      } as any);
      jest.mocked(SourcesStore.getAllSources).mockResolvedValue({
        "https://example.com": { slug: "example" },
      } as any);

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung exportieren"));

      await waitFor(() => {
        expect(FavoritesStore.getAllFavorites).toHaveBeenCalledTimes(1);
        expect(SourcesStore.getAllSources).toHaveBeenCalledTimes(1);
        expect(mockFileWrite).toHaveBeenCalledTimes(1);
        expect(Sharing.shareAsync).toHaveBeenCalledWith(
          mockFileUri,
          expect.objectContaining({ mimeType: "application/json" }),
        );
      });
    });

    it("shows a success toast after the share sheet closes", async () => {
      jest.mocked(FavoritesStore.getAllFavorites).mockResolvedValue({
        abc: { contentType: "article" },
      } as any);
      jest.mocked(SourcesStore.getAllSources).mockResolvedValue({
        "https://example.com": { slug: "example" },
      } as any);

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung exportieren"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Export erfolgreich",
          "Deine Daten wurden exportiert.",
        );
      });
    });

    it("shows an error toast when export fails", async () => {
      jest
        .mocked(FavoritesStore.getAllFavorites)
        .mockRejectedValue(new Error("disk full"));

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung exportieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Export fehlgeschlagen",
          "Versuche es erneut.",
        );
        expect(Sharing.shareAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe("import", () => {
    it("updates stores when a valid backup file is picked", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://picked.json" }],
      } as any);
      mockFileText.mockResolvedValue(validBackupJson);

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(FavoritesStore.setStoredFavs).toHaveBeenCalledTimes(1);
        expect(SourcesStore.setStoredSources).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
          "Import erfolgreich",
          "Deine Daten wurden wiederhergestellt.",
        );
      });
    });

    it("shows an error toast when assets is empty after a non-canceled result", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [],
      } as any);

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        expect(FavoritesStore.setStoredFavs).not.toHaveBeenCalled();
      });
    });

    it("does nothing when the picker is canceled", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: true,
        assets: [],
      } as any);

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(FavoritesStore.setStoredFavs).not.toHaveBeenCalled();
        expect(SourcesStore.setStoredSources).not.toHaveBeenCalled();
      });
    });

    it("shows an error toast when the file is not a JSON object", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://bad.json" }],
      } as any);
      mockFileText.mockResolvedValue(JSON.stringify([1, 2, 3]));

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        expect(FavoritesStore.setStoredFavs).not.toHaveBeenCalled();
      });
    });

    it("shows an error toast when the favorites structure is invalid", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://bad.json" }],
      } as any);
      mockFileText.mockResolvedValue(
        JSON.stringify({ favorites: { abc: { contentType: "unknown" } } }),
      );

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        expect(FavoritesStore.setStoredFavs).not.toHaveBeenCalled();
      });
    });

    it("shows an error toast when the file contains no recognized keys", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://empty.json" }],
      } as any);
      mockFileText.mockResolvedValue(JSON.stringify({ other: "stuff" }));

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
      });
    });

    it("shows an error toast when the file read throws", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://bad.json" }],
      } as any);
      mockFileText.mockRejectedValue(new Error("read error"));

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Import fehlgeschlagen",
          "Versuche es erneut.",
        );
      });
    });

    it("restores only favorites when sources is absent from the file", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://favs-only.json" }],
      } as any);
      mockFileText.mockResolvedValue(
        JSON.stringify({ favorites: { abc: { contentType: "article" } } }),
      );

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(FavoritesStore.setStoredFavs).toHaveBeenCalledTimes(1);
        expect(SourcesStore.setStoredSources).not.toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Import erfolgreich",
          "Deine Daten wurden wiederhergestellt.",
        );
      });
    });

    it("restores only sources when favorites is absent from the file", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://sources-only.json" }],
      } as any);
      mockFileText.mockResolvedValue(
        JSON.stringify({
          sources: { "https://example.com": { slug: "example" } },
        }),
      );

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(SourcesStore.setStoredSources).toHaveBeenCalledTimes(1);
        expect(FavoritesStore.setStoredFavs).not.toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Import erfolgreich",
          "Deine Daten wurden wiederhergestellt.",
        );
      });
    });

    it("shows an error toast when the sources structure is invalid", async () => {
      jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://bad-sources.json" }],
      } as any);
      mockFileText.mockResolvedValue(
        JSON.stringify({ sources: { "https://example.com": { slug: 99 } } }),
      );

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung importieren"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Ungültige Backup-Datei",
          "Das Format der Datei konnte nicht erkannt werden.",
        );
        expect(SourcesStore.setStoredSources).not.toHaveBeenCalled();
      });
    });
  });

  describe("export content", () => {
    it("writes serialized favorites and sources to the file", async () => {
      const favorites = { abc: { contentType: "article" } };
      const sources = { "https://example.com": { slug: "example" } };
      jest
        .mocked(FavoritesStore.getAllFavorites)
        .mockResolvedValue(favorites as any);
      jest.mocked(SourcesStore.getAllSources).mockResolvedValue(sources as any);

      const { getByText } = render(<BackupView />);
      fireEvent.press(getByText("Sammlung exportieren"));

      await waitFor(() => {
        expect(mockFileWrite).toHaveBeenCalledWith(
          JSON.stringify({ favorites, sources }, null, 2),
        );
      });
    });
  });
});
