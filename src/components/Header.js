import { View, StyleSheet, Text } from "react-native";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
} from "../design-system/theme/scaleUtils";

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
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
    paddingLeft: horizontalScale(20),
  },
  headerText: {
    fontWeight: "bold",
    fontSize: theme.fontSizes.title,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
});
