import { View, StyleSheet, Text } from "react-native";
import { horizontalScale } from "../design-system/theme/scaleUtils";
import theme from "../design-system/theme/theme";
import { SafeAreaView } from "react-native-safe-area-context";
const Container = ({ children, containerStyle }) => {
  return <SafeAreaView edges={['top']} style={[styles.container, containerStyle]}>{children}</SafeAreaView>;
};

export default Container;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: horizontalScale(1),
    backgroundColor: theme.colors.background,
  },
});
