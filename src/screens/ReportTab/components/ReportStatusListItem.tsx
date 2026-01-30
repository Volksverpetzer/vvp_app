import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import API from "#/helpers/Networking/ServerAPI";
import useAppColorScheme from "#/hooks/useAppColorScheme";
import { StatusResponse, StoredReport } from "#/types";

/**
 * Component to display the status of a report
 */
const ReportStatusListItem = (props: StoredReport) => {
  const { id } = props;
  const colorScheme = useAppColorScheme();

  const colors =
    colorScheme === "dark"
      ? {
          text: "#FFFFFF",
          posted: "#34D399",
          error: "#F87171",
          pending: "#9CA3AF",
          activity: "#FFFFFF",
        }
      : {
          text: "#000000",
          posted: "#059669",
          error: "#EF4444",
          pending: "#6B7280",
          activity: "#000000",
        };

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    API.getReportStatus(id)
      .then((response: StatusResponse) => {
        setStatus(response.status);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /**
   * Renders an icon based on the status of the report
   * @returns {ReactElement} the icon
   */
  const renderIcon = () => {
    if (loading) {
      return <ActivityIndicator color={colors.activity} />;
    }
    if (error) {
      return (
        <FontAwesome name="exclamation-circle" size={20} color={colors.error} />
      );
    }
    if (status === "posted") {
      return <FontAwesome name="check" size={20} color={colors.posted} />;
    }
    return (
      <FontAwesome name="hourglass-half" size={16} color={colors.pending} />
    );
  };

  return (
    <View style={styles.item}>
      <Text selectable style={[styles.text, { color: colors.text }]}>
        {id}
      </Text>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default ReportStatusListItem;
