import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../Screens/HomeScreen';
import PhoneauthScreen from '../Screens/AuthScreens/PhoneauthScreen';
import Userdetails1 from '../Screens/AuthScreens/Userdetails1';
import Userdetails2 from '../Screens/AuthScreens/Userdetails2';
import AddPhotosScreen from '../Screens/AddPhotosScreen';


const AuthStack = createNativeStackNavigator();

const AuthNavigator = ({initialRoute}) => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <AuthStack.Screen name="Home" component={HomeScreen} />
      <AuthStack.Screen name="Phoneauth" component={PhoneauthScreen} />
      <AuthStack.Screen name="Userdeet1" component={Userdetails1} />
      <AuthStack.Screen name="Userdeet2" component={Userdetails2} />
      <AuthStack.Screen name="AddPhotos" component={AddPhotosScreen} />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;