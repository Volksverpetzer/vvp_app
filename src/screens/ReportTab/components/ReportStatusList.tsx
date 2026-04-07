import { View } from "react-native";

import Heading from "#/components/typography/Heading";
import type { StoredReports } from "#/types";

import ReportStatusListItem from "./ReportStatusListItem";

interface ReportStatusListProperties {
  reports: StoredReports;
}

/**
 * Component to display a list of reports and their status
 * @prop {StoredReports} reports - an array of report items
 * @returns a list of report status
 */
const ReportStatusList = ({ reports }: ReportStatusListProperties) => {
  return (
    <View>
      {reports.length > 0 && (
        <Heading style={{ marginBottom: 10 }}>Deine Reports</Heading>
      )}
      {reports.map((report) => (
        <ReportStatusListItem key={report.id} id={report.id} />
      ))}
    </View>
  );
};

export default ReportStatusList;
