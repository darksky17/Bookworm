import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons"; // For tab icons
import ProfileScreen from "./Screens/ProfileScreen"; // Your Profile screen file
import MatchScreen from "./Screens/MatchScreen";
import ChatScreenList from "./Screens/chatScreenList";
import theme from "./design-system/theme/theme";
import FeedScreen from "./Screens/FeedScreen";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AddPostScreen from "./Screens/AddPostScreen";
import DisplayProfileScreen from "./Screens/DisplayProfileScreen";
import TabDisplayProfileScreen from "./Screens/TabDisplayProfile";
import { TouchableOpacity, Text, View } from "react-native";
import { auth } from "./Firebaseconfig";
import { useSelector } from "react-redux";




const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const unread = useSelector(state => state.user.unreadCount);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Match") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Feed") {
            iconName = focused ? "reader" : "reader-outline";
          } else if (route.name === "Add Post") {
            iconName = focused ? "add-circle" : "add-circle-outline";
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
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Add Post" component={AddPostScreen}         options={({ navigation }) => ({
          tabBarButton: (props) => (
            <View style={{flex:1, alignItems:"center", gap:30, paddingTop:theme.spacing.vertical.xs }}>
              
            <TouchableOpacity onPress={() => navigation.navigate('AddPost')}>
            <View>
                <Icon
              name= "add-circle-outline"
              size={26}
              color="#ccc"
            />
            </View>
              <Text style={{fontSize:theme.fontSizes.xs, fontWeight:"bold", color:"#ccc",}}>{" "}Post</Text>
              </TouchableOpacity>
            </View>
          
          ),
        })} />
      <Tab.Screen
        name="Chats"
        component={ChatScreenList}
        options={{ unmountOnBlur: true, tabBarBadge: unread > 0?unread:undefined, tabBarBadgeStyle:{color:theme.colors.text, backgroundColor:theme.colors.primary} }}
      />
      {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
      <Tab.Screen name="Profile" component={TabDisplayProfileScreen} initialParams={{userId: auth.currentUser.uid}} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
