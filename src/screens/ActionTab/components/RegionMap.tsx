import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";

import {
  FirstPlaceIcon,
  SecondPlaceIcon,
  ThirdPlaceIcon,
} from "#/components/SvgIcons";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { getApiUrl } from "#/helpers/apiUrl";
import { getRegions } from "#/helpers/network/Action";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import type { Region, RegionsByCode } from "#/types";

import Legend from "./Legend";

const weekNumber = Math.floor(Date.now() / WEEK_IN_MS);

// Quartile colors of the server-rendered map (vvp_app_server
// proxycache/services/analytics.py `map`), highest quartile first. The image
// is a fixed PNG independent of app theme/variant, so these must mirror the
// server's hex values rather than theme tokens.
const MAP_LEGEND = [
  { text: "Vorreiter", color: "#D31C74" },
  { text: "Überdurchschnittlich", color: "#DB2685" },
  { text: "Unterdurchschnittlich", color: "#3893C0" },
  { text: "Schlusslicht", color: "#1B7194" },
] as const;

const parseRegionsData = async (): Promise<Region[]> => {
  const csv = await getRegions();
  const rows = csv.split("\n");
  const regions: RegionsByCode = {};
  for (const row of rows) {
    const [region, name, pageviews] = row.split(",");
    if (!region.includes("DE")) continue;
    regions[region] = {
      region,
      name,
      pageviews: Number.parseInt(pageviews),
    };
  }

  return Object.values(regions).sort((a, b) => b.pageviews - a.pageviews);
};

const RegionMap = () => {
  const [regionData, setRegionData] = useState<Region[] | undefined>();
  const [apiUrl, setApiUrl] = useState(getApiUrl);

  // FOSS builds can change the server address in Settings while this tab
  // stays mounted; pick it up when the tab regains focus so the map and the
  // ranking come from the new server.
  useFocusEffect(
    useCallback(() => {
      setApiUrl(getApiUrl());
    }, []),
  );

  useEffect(() => {
    // Ignore a response from the previous server that resolves after the
    // request for the new one, so it can't overwrite the fresh ranking.
    let current = true;
    parseRegionsData().then((data) => {
      if (current) setRegionData(data);
    });
    return () => {
      current = false;
    };
  }, [apiUrl]);
  const corporate = Colors.light.primary;
  const primaryMuted = Colors.dark.primaryMuted;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -80,
        paddingBottom: 40,
        paddingTop: 80,
        backgroundColor: primaryMuted,
        borderRadius: radii.xxl,
        gap: spacing.xl,
        overflow: "hidden",
        paddingHorizontal: spacing.xl,
      }}
    >
      <View style={{ backgroundColor: primaryMuted, flex: 1 }}>
        <Image
          source={{
            uri: `${apiUrl}/proxy/map?week=${weekNumber}`,
            // Not CORS-safelisted: sending it on web would force a
            // preflight the proxy doesn't answer.
            ...(Platform.OS !== "web" && {
              headers: { "Cache-Control": "max-age=604800" },
            }),
          }}
          cachePolicy="disk"
          contentFit="contain"
          onError={(event) => console.error("Error loading image", event)}
          style={{
            width: "100%",
            aspectRatio: 3 / 4,
            backgroundColor: primaryMuted,
          }}
        />
        <UiSpace size={spacing.xl} />
        <View style={{ gap: spacing.sm }}>
          {MAP_LEGEND.map(({ text, color }) => (
            <Legend key={text} text={text} color={color} />
          ))}
        </View>
        <UiSpace size={spacing.sm} />
        <View>
          <UiText
            size="xs"
            style={[globalStyles.whiteText, { marginTop: spacing.xl }]}
          >
            Shares aus der Volksverpetzer-App pro Kopf im Bundesland
          </UiText>
        </View>
        <View style={{ flex: 1, height: "100%", alignItems: "flex-end" }} />
      </View>
      <View
        style={{
          flex: 1,
          gap: spacing.md,
        }}
      >
        <UiText size="xl" bold style={globalStyles.whiteText}>
          Bundesländer Ranking
        </UiText>
        <View style={{ gap: spacing.sm, paddingLeft: spacing.xs }}>
          {regionData?.slice(0, 3).map((region, index) => {
            const Icon =
              index === 0
                ? FirstPlaceIcon
                : index === 1
                  ? SecondPlaceIcon
                  : ThirdPlaceIcon;
            return (
              <View
                key={region.region}
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  width: 120,
                  borderRadius: 10,
                  height: 18,
                  backgroundColor: "white",
                }}
              >
                <Icon style={{ left: -8 }} />
                <UiText size="xs" style={{ color: corporate }}>
                  {` ${region.name}`}
                </UiText>
              </View>
            );
          })}
        </View>
        <View style={{ gap: spacing.xs }}>
          {regionData?.slice(3).map((region, idx) => (
            <UiText
              key={region.region}
              size="sm"
              style={[globalStyles.whiteText]}
            >
              {`${idx + 4}. ${region.name}`}
            </UiText>
          ))}
        </View>
      </View>
    </View>
  );
};

export default RegionMap;
