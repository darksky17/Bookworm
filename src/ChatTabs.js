import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import ChatScreen from "../Screens/ChatScreen";
import ProfileScreen from "../Screens/ProfileScreen";
import Menu from "../Components/Menu";

const Tab = createBottomTabNavigator();

const ChatTabs = ({ route, navigation }) => {
  const { mateId, mateDisplay, isAscended, mateName } = route.params;
  const [isMenuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!isMenuVisible);

  return (
    <View style={styles.container}>
      {/* HEADER (SHARED ACROSS TABS) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons name="chevron-back" size={24} color="black" style={{ left: 5 }} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{isAscended ? mateName : mateDisplay}</Text>
        <TouchableOpacity onPress={toggleMenu}>
          <Feather name="more-vertical" size={24} color="black" />
        </TouchableOpacity>
        <Menu visible={isMenuVisible} onClose={toggleMenu} />
      </View>

      {/* TAB NAVIGATOR */}
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Chat">
          {() => <ChatScreen mateId={mateId} />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => <ProfileScreen mateId={mateId} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
};

export default ChatTabs;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    paddingHorizontal: 10,
    backgroundColor: "white",
    elevation: 3,
  },
  headerText: { fontSize: 18, fontWeight: "bold" },
});