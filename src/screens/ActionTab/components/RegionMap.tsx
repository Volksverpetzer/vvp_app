import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";

import {
  FirstPlaceIcon,
  SecondPlaceIcon,
  ThirdPlaceIcon,
} from "#/components/SvgIcons";
import Space from "#/components/design/Space";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
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

  useEffect(() => {
    parseRegionsData().then(setRegionData);
  }, []);
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const corporate = Colors.light.primary;
  const corporateColor = Colors.dark.primary;
  const primaryTint = Colors.dark.primaryTint;
  const highlight = Colors[colorScheme].accent;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -70,
        paddingTop: 90,
        backgroundColor: primaryTint,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        width,
        gap: 20,
        overflow: "hidden",
        paddingHorizontal: 30,
      }}
    >
      <View style={{ backgroundColor: primaryTint, flex: 1 }}>
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
            backgroundColor: primaryTint,
          }}
        />
        <Space size={20} />
        <Legend text="Vorreiter" color={highlight} />
        <Space size={8} />
        <Legend text="Durchschnitt" color={corporateColor} />
        <Space size={8} />
        <Legend text="Schlusslicht" color={corporate} />
        <Space size={8} />
        <View>
          <UiText style={{ fontSize: 12, marginTop: 20, ...styles.whiteText }}>
            Shares aus der Volksverpetzer-App pro Kopf im Bundesland
          </UiText>
        </View>
        <View style={{ flex: 1, height: "100%", alignItems: "flex-end" }} />
      </View>
      <View
        style={{
          flex: 1,
        }}
      >
        <UiText
          style={{ fontSize: 20, ...styles.whiteText, fontWeight: "bold" }}
        >
          Bundesländer Ranking
        </UiText>
        <Space size={10} />
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
                margin: 3,
                borderRadius: 10,
                height: 18,
                backgroundColor: "white",
              }}
            >
              <Icon style={{ left: -8 }} />
              <UiText style={{ fontSize: 12, color: corporate }}>
                {` ${region.name}`}
              </UiText>
            </View>
          );
        })}
        <Space size={10} />
        {regionData?.slice(3).map((region, idx) => (
          <UiText
            key={region.region}
            style={{
              fontSize: 13,
              paddingVertical: 2,
              ...styles.whiteText,
            }}
          >
            {`${idx + 4}. ${region.name}`}
          </UiText>
        ))}
        <Space size={100} />
      </View>
    </View>
  );
};

export default RegionMap;
