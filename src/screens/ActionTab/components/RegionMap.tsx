import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FirstPlaceIcon,
  SecondPlaceIcon,
  ThirdPlaceIcon,
} from "#/components/SvgIcons";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { getRegions } from "#/helpers/network/Action";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { Region, RegionsByCode } from "#/types";

import Legend from "./Legend";

const weekNumber = Math.floor(Date.now() / WEEK_IN_MS);

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
  // insets.bottom already includes the native tab bar's height (it's a real
  // TabView, not a JS-rendered overlay, so iOS/Android propagate it as part
  // of the safe area) — no separate tab-bar-height constant needed.
  const { bottom: tabBarClearance } = useSafeAreaInsets();

  useEffect(() => {
    parseRegionsData().then(setRegionData);
  }, []);
  const colorScheme = useAppColorScheme();
  const corporate = Colors.light.primary;
  const corporateColor = Colors.dark.primary;
  const primaryMuted = Colors.dark.primaryMuted;
  const highlight = Colors[colorScheme].accent;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -80,
        paddingTop: 80,
        backgroundColor: primaryMuted,
        borderTopLeftRadius: radii.xxl,
        borderTopRightRadius: radii.xxl,
        gap: spacing.xl,
        overflow: "hidden",
        paddingHorizontal: spacing.xl,
      }}
    >
      <View style={{ backgroundColor: primaryMuted, flex: 1 }}>
        <Image
          source={{
            uri: `${Config.apiUrl}/proxy/map?week=${weekNumber}`,
            headers: {
              "Cache-Control": "max-age=604800",
            },
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
        <UiSpace size={20} />
        <Legend text="Vorreiter" color={highlight} />
        <UiSpace size={8} />
        <Legend text="Durchschnitt" color={corporateColor} />
        <UiSpace size={8} />
        <Legend text="Schlusslicht" color={corporate} />
        <UiSpace size={8} />
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
          paddingBottom: tabBarClearance + spacing.xl,
        }}
      >
        <UiText size="xl" bold style={globalStyles.whiteText}>
          Bundesländer Ranking
        </UiText>
        <View style={{ gap: spacing.xs, paddingLeft: spacing.sm }}>
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
        <View>
          {regionData?.slice(3).map((region, idx) => (
            <UiText
              key={region.region}
              size="sm"
              style={[globalStyles.whiteText, { paddingVertical: spacing.xs }]}
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
