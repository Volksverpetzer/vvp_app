import { useCallback } from "react";
import { FlatList } from "react-native";

import { styles } from "../../../../constants/Styles";
import LicensesListItem from "./LicenseListItem";
import Data from "./data";

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const extractNameFromGithubUrl = (url: string) => {
  if (!url) {
    return;
  }
  const reg =
    /((https?:\/\/)?(www\.)?github\.com\/)?(@|#!\/)?(\w{1,15})(\/([-a-z]{1,20}))?/i;
  const components = reg.exec(url);

  if (components && components.length > 5) {
    return components[5];
  }
};

/**
 * Renders a list of open source licenses.
 */
const Licenses = () => {
  const renderItem = useCallback(
    ({ item }) => <LicensesListItem {...item} />,
    [],
  );

  const licenses = Object.keys(Data).map((key) => {
    const { licenses, ...license } = Data[key];

    const lastAtIndex = key.lastIndexOf("@");
    const fullName = key.slice(0, lastAtIndex);
    const packageName = fullName.includes("/")
      ? fullName.slice(fullName.indexOf("/") + 1)
      : fullName;
    const packageVersion = key.slice(lastAtIndex + 1);
    let username =
      extractNameFromGithubUrl(license.repository) ||
      extractNameFromGithubUrl(license.licenseUrl);

    let userUrl: string;
    let image: string;
    if (username) {
      username = capitalizeFirstLetter(username);
      image = `https://github.com/${username}.png`;
      userUrl = `https://github.com/${username}`;
    }

    return {
      id: key,
      packageName,
      image,
      userUrl,
      username,
      licenses: licenses.slice(0, 405),
      packageVersion,
      ...license,
    };
  });

  return (
    <FlatList
      keyExtractor={(item) => item.id}
      data={licenses}
      renderItem={renderItem}
      style={styles.container}
    />
  );
};

export default Licenses;
