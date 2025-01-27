import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons'; // For tab icons
import ProfileScreen from './Screens/ProfileScreen'; // Your Profile screen file

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={24} color={focused ? '#007BFF' : '#ccc'} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#ccc',
        headerShown: false, // Hide the header for tabs
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;