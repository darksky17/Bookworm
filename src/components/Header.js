import { View, StyleSheet, Text } from "react-native";

export default Header = ({ title }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "lawngreen",
    alignItems: "center",
    width: "100%",
    elevation: 4,
    paddingTop: 30,
    paddingBottom: 10,
  },
  headerText: {
    fontWeight: "medium",
    fontSize: 30,
  },
});
