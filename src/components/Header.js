import { View, StyleSheet, Text } from "react-native";
import theme from "../design-system/theme/theme";
import { scale } from "../design-system/theme/scaleUtils";

export default Header = ({ title }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.background,
    flexDirection: "row",
    width: "100%",
    // elevation: 4,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
  },
  headerText: {
    fontWeight: "bold",
    fontSize: theme.fontSizes.title,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
});
