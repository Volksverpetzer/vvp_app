import { View } from "react-native";

interface SpaceProps {
  size: number;
}

const Space = ({ size }: SpaceProps) => {
  return <View style={{ height: size }} />;
};

export default Space;
