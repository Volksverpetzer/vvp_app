import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";

import { FirstPlace, SecondPlace, ThirdPlace } from "#/components/Icons";
import Space from "#/components/design/Space";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { getRegions } from "#/helpers/network/Analytics";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import useAppColorScheme from "#/hooks/useAppColorScheme";
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
  const corporate = Colors["light"].corporate;
  const corporateColor = Colors["dark"].corporate;
  const highlight = Colors[colorScheme].highlight;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -70,
        paddingTop: 90,
        backgroundColor: corporate,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        width,
        gap: 20,
        overflow: "hidden",
        paddingHorizontal: 30,
      }}
    >
      <View style={{ backgroundColor: corporate, flex: 1 }}>
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
            backgroundColor: corporate,
          }}
        />
        <Space size={20} />
        <Legend text={"Vorreiter"} color={highlight} />
        <Space size={8} />
        <Legend text={"Durchschnitt"} color={corporateColor} />
        <Space size={8} />
        <Legend text={"Schlusslicht"} color={corporate} />
        <Space size={8} />
        <View>
          <Text style={{ fontSize: 12, marginTop: 20, ...styles.whiteText }}>
            Shares aus der Volksverpetzer-App pro Kopf im Bundesland
          </Text>
        </View>
        <View style={{ flex: 1, height: "100%", alignItems: "flex-end" }} />
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: corporate,
        }}
      >
        <Text style={{ fontSize: 20, ...styles.whiteText, fontWeight: "bold" }}>
          Bundesländer Ranking
        </Text>
        <Space size={10} />
        {regionData?.slice(0, 3).map((region, index) => {
          const Icon =
            index === 0 ? FirstPlace : index === 1 ? SecondPlace : ThirdPlace;
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
              <Text style={{ fontSize: 12, lineHeight: 18, color: corporate }}>
                {` ${region.name}`}
              </Text>
            </View>
          );
        })}
        <Space size={10} />
        {regionData?.slice(3).map((region, idx) => (
          <Text
            key={region.region}
            style={{
              fontSize: 13,
              paddingVertical: 2,
              ...styles.whiteText,
            }}
          >
            {`${idx + 4}. ${region.name}`}
          </Text>
        ))}
        <Space size={80} />
      </View>
    </View>
  );
};

export default RegionMap;
