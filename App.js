import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth } from "./Firebaseconfig";
import PhoneauthScreen from "./Screens/PhoneauthScreen";
import Userdetails1 from "./Screens/Userdetails1";
import Userdetails2 from "./Screens/Userdetails2";
import Tabnav from "./Tabnav";
import { Text, View, Button } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import SignupScreen from './Screens/SignupScreen';
import EditProfileScreen from "./Screens/EditProfileScreen";
import { firestore } from "./Firebaseconfig";

function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40, color: 'darkgreen' }}>BookWorm</Text>
      <Button
        title="Get Started"
        onPress={() => navigation.navigate('Phoneauth')}
        color="lightgreen"
      />

      < Button title="Logout" onPress={() =>auth()
  .signOut()
  .then(() => console.log('User signed out!'))}
  color="blue"
  />

    </View>
  );
}
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Home");
  const [user, setUser] = useState();

  useEffect(() => {
     auth().onAuthStateChanged(async (user) => {
      setUser(user);
      console.log("USER:", user);

      if (user) {
        const uid = user.uid;
        try {
          const userDoc = await firestore()
            .collection('Users')
            .doc(uid) // Using phoneNumber as the document ID
            .get();
            userData = userDoc.data();
  
          if (!userDoc.exists || !userData.step1Completed) {
            setInitialRoute("Userdeet1"); // Step 1 of the signup process
          } else if (!userData.step2Completed) {
            setInitialRoute("Userdeet2"); // Step 2 of the signup process
          } else {
            setInitialRoute("MainTabs"); // Completed signup
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setInitialRoute("Home"); // Fallback to home on error
        }
      } 
      
      else {
        setInitialRoute("Home");
      }

      setInitializing(false);
    });

   // return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Phoneauth" component={PhoneauthScreen} />
        <Stack.Screen name="Userdeet1" component={Userdetails1} />
        <Stack.Screen name="Userdeet2" component={Userdetails2} />
        <Stack.Screen name="MainTabs" component={Tabnav} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <Provider store={store}>
    <AppNavigator />
  </Provider>
);

export default App;

