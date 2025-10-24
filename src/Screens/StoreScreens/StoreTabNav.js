import { View, Text, StatusBar } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import theme from '../../design-system/theme/theme';
import HomeScreen from './HomeScreen';
import CartScreen from './CartScreen';
const Tab = createBottomTabNavigator();

const HomeScreenn=()=>{
return(
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
        <Text>Coming Soon</Text>
    </View>
);
}

function StoreTabs() {
  
  return (
    
    <Tab.Navigator screenOptions={({route})=>({
      
        tabBarIcon: ({ focused }) => {
            let iconName;
            if (route.name === "Home") {
              iconName = focused ? "storefront" : "storefront-outline";
            } else if (route.name === "Cart") {
              iconName = focused ? "cart" : "cart-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            } else if (route.name === "Add Post") {
              iconName = focused ? "add-circle" : "add-circle-outline";
            } else {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            }
            return (
              <Ionicons
                name={iconName}
                size={24}
                color={focused ? theme.colors.primary : "#ccc"}
              />
            );
          },
          tabBarActiveTintColor: theme.colors.text,
          tabBarInactiveTintColor: "#ccc",
          headerShown: false, // Hide the header for tabs

    })
    }
    >
      <Tab.Screen name="Home" component={HomeScreen} />
       <Tab.Screen name="Profile" component={HomeScreenn} />
      <Tab.Screen name ="Cart" component={CartScreen} />
      {/* <Tab.Screen name="Orders" component={OrdersScreen} />  */}
    </Tab.Navigator>
  );
}

export default StoreTabs;