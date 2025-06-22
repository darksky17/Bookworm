import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons"; // For tab icons
import ProfileScreen from "./Screens/ProfileScreen"; // Your Profile screen file
import MatchScreen from "./Screens/MatchScreen";
import ChatScreenList from "./Screens/chatScreenList";
import theme from "./design-system/theme/theme";
const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Match") {
            iconName = focused ? "book" : "book-outline";
          } else {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }
          return (
            <Icon
              name={iconName}
              size={24}
              color={focused ? theme.colors.primary : "#ccc"}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: "#ccc",
        headerShown: false, // Hide the header for tabs
      })}
    >
      <Tab.Screen name="Match" component={MatchScreen} />
      <Tab.Screen
        name="Chats"
        component={ChatScreenList}
        options={{ unmountOnBlur: true }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
