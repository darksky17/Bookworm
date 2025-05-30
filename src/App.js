import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth } from "./Firebaseconfig";
import PhoneauthScreen from "./Screens/PhoneauthScreen";
import Userdetails1 from "./Screens/Userdetails1";
import Userdetails2 from "./Screens/Userdetails2";
import ChatDisplay from "./Screens/chatScreen";
import Tabnav from "./Tabnav";
import { Text, View, StatusBar, Image, Platform } from "react-native";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import SignupScreen from "./Screens/SignupScreen";
import EditProfileScreen from "./Screens/EditProfileScreen";
import { db } from "./Firebaseconfig";
import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { PaperProvider, Button } from "react-native-paper";
import ViewProfile from "./Screens/ViewProfile";
import ChatScreenList from "./Screens/chatScreenList";
import AddPhotosScreen from "./Screens/AddPhotosScreen";
import AddAuthorsScreen from "./Screens/AddAuthorsScreen";
import AddGenresScreen from "./Screens/AddGenresScreen";
import AccountSettings from "./Screens/AccountSettings";
import Logo from "./assets/BookWorm_logo.png";
import messaging from "@react-native-firebase/messaging";

function HomeScreen({ navigation }) {
  return (
    <View
      style={{ flex: 1, gap: 20, padding: 20, backgroundColor: "lightgreen" }}
    >
      {/* <Text style={{ fontSize: 40, color: "darkgreen" }}>BookWorm</Text> */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image
          source={Logo}
          style={{ flex: 1, height: 250, width: 300 }}
          onError={(e) =>
            console.error("Error loading profile picture:", e.nativeEvent.error)
          }
        />
      </View>

      <View style={{ flex: 1, gap: 10 }}>
        <Button
          mode="contained"
          onPress={() => navigation.replace("Phoneauth")}
          style={{ backgroundColor: "snow" }}
          textColor="brown"
        >
          Get Started
        </Button>

        <Button
          mode="contained"
          onPress={() =>
            auth()
              .signOut()
              .then(() => console.log("User signed out!"))
          }
          style={{ backgroundColor: "snow" }}
          textColor="brown"
        >
          Logout
        </Button>
      </View>
    </View>
  );
}
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Home");
  const [user, setUser] = useState();
  useEffect(() => {
    if (Platform.OS === "android") {
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("Message handled in the background!", remoteMessage);
      });
    }
  }, []);
  useEffect(() => {
    const getFCMToken = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.log("No user is logged in, skipping FCM token registration.");
          return;
        }

        const token = await messaging().getToken();
        console.log("FCM Token:", token);

        // Optionally save to Firestore under the user's doc
        await updateDoc(doc(db, "Users", currentUser.uid), {
          fcmToken: token,
        });
      } catch (error) {
        console.error("Error getting FCM token:", error);
      }
    };

    getFCMToken();
  }, []);

  useEffect(() => {
    auth().onAuthStateChanged(async (user) => {
      setUser(user);
      console.log("USER:", user);

      if (user) {
        const uid = user.uid;
        try {
          const userDocRef = doc(db, "Users", uid);
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            setInitialRoute("Userdeet1");
          } else {
            const userData = userDocSnap.data();
            if (!userData.step1Completed) {
              setInitialRoute("Userdeet1");
            } else if (!userData.step2Completed) {
              setInitialRoute("Userdeet2");
            } else {
              setInitialRoute("MainTabs");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setInitialRoute("Home"); // Fallback to home on error
        }
      } else {
        setInitialRoute("Home");
      }

      setInitializing(false);
    });

    // return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor="lightgreen" barStyle="dark-content" />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Phoneauth" component={PhoneauthScreen} />
        <Stack.Screen name="Userdeet1" component={Userdetails1} />
        <Stack.Screen name="Userdeet2" component={Userdetails2} />
        <Stack.Screen name="MainTabs" component={Tabnav} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChatDisplay" component={ChatDisplay} />
        <Stack.Screen name="ProfileDisplay" component={ViewProfile} />
        <Stack.Screen name="ChatScreenList" component={ChatScreenList} />
        <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
        <Stack.Screen name="AddAuthors" component={AddAuthorsScreen} />
        <Stack.Screen name="AddGenres" component={AddGenresScreen} />
        <Stack.Screen name="AccountSettings" component={AccountSettings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <Provider store={store}>
    <PaperProvider>
      <AppNavigator />
    </PaperProvider>
  </Provider>
);

export default App;
