import { View } from "react-native";

interface UiSpaceProps {
  size: number;
}

const UiSpace = ({ size }: UiSpaceProps) => {
  return <View style={{ height: size }} />;
};

export default UiSpace;
