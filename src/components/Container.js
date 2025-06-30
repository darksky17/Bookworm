import { View, StyleSheet, Text } from "react-native";
import { horizontalScale } from "../design-system/theme/scaleUtils";
import theme from "../design-system/theme/theme";
const Container = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

export default Container;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: horizontalScale(1),
    backgroundColor: theme.colors.background,
  },
});
