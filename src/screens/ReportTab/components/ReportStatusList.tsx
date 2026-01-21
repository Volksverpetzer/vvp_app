import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import Heading from "../../../components/typography/Heading";
import API from "../../../helpers/Networking/ServerAPI";
import { StatusResponse } from "../../../types";

interface ReportItem {
  id: string;
}

interface ReportStatusListProperties {
  reports: ReportItem[];
}

/**
 * Component to display a list of reports and their status
 * @prop {ReportItem[]} reports - an array of report items
 * @returns a list of report status
 */
const ReportStatusList = ({ reports }: ReportStatusListProperties) => {
  return (
    <View>
      {reports.length > 0 && <Heading>Deine Reports</Heading>}
      {reports.map((report) => (
        <ReportStatusItem key={report.id} id={report.id} />
      ))}
    </View>
  );
};

/**
 * Component to display the status of a report
 * @prop {string} id - the id of the report
 * @returns {ReactElement} the status of the report
 */
const ReportStatusItem = ({ id }: ReportItem) => {
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
      return <ActivityIndicator />;
    }
    if (error) {
      return <FontAwesome name="exclamation-circle" size={24} color="red" />;
    }
    if (status === "posted") {
      return <FontAwesome name="check" size={24} color="green" />;
    }
    return <FontAwesome name="hourglass-half" size={24} color="gray" />;
  };

  return (
    <View style={styles.item}>
      <Text selectable style={styles.text}>
        {id} {renderIcon()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    marginVertical: 4,
  },
  text: {
    textAlign: "center",
  },
});

export default ReportStatusList;
