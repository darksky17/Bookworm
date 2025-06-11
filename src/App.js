import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth } from "./Firebaseconfig";
import PhoneauthScreen from "./Screens/PhoneauthScreen";
import Userdetails1 from "./Screens/Userdetails1";
import Userdetails2 from "./Screens/Userdetails2";
import ChatDisplay from "./Screens/chatScreen";
import Tabnav from "./Tabnav";
import { useDispatch } from "react-redux";
import { Text, View, StatusBar, Image, Platform } from "react-native";
import { Provider, useSelector } from "react-redux";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setNotificationPref } from "./redux/userSlice";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";

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
      <View style={{ alignItems: "center", justifyContent: "flex-start" }}>
        <Text style={{ fontWeight: "bold" }}>
          Made with <Ionicons name="heart" size={16} color="red" /> by Soraaa
        </Text>
      </View>
    </View>
  );
}
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const notificationPref = useSelector((state) => state.user.notificationpref);
  console.log("WALAAALLALALAAL", notificationPref);
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Home");
  const [user, setUser] = useState();
  const [notificationPrefReady, setNotificationPrefReady] = useState(false);
  useEffect(() => {
    if (notificationPref !== true) {
      console.log("🚫 Notification disabled or not loaded yet");
      return;
    }

    if (Platform.OS === "android") {
      console.log("✅ Setting background message handler");
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("📩 Background message:", remoteMessage);
      });
    }
  }, [notificationPref]);

  useEffect(() => {
    if (!notificationPrefReady) return;

    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        const uid = user.uid;

        // ✅ STEP 1: Register fresh FCM token
        if (notificationPref === true && user) {
          try {
            const token = await messaging().getToken(true); // force refresh
            console.log("Refreshed FCM Token:", token);

            await updateDoc(doc(db, "Users", uid), {
              fcmToken: token,
            });
          } catch (tokenError) {
            console.error("Error refreshing FCM token:", tokenError);
          }
        }

        // ✅ STEP 2: Routing logic
        try {
          const userDocRef = doc(db, "Users", uid);
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            setInitialRoute("Phoneauth");
          } else {
            const userData = userDocSnap.data();
            if (!userData.step1Completed) {
              setInitialRoute("Userdeet1");
            } else if (!userData.step2Completed) {
              setInitialRoute("Userdeet2");
            } else if (!userData.step3Completed) {
              setInitialRoute("AddPhotos");
            } else {
              setInitialRoute("MainTabs");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setInitialRoute("Home");
        }
      } else {
        setInitialRoute("Home");
      }

      setInitializing(false);
    });

    return () => unsubscribe(); // 🔁 Always unsubscribe listeners
  }, [notificationPrefReady, notificationPref]);

  const NOTIF_PREF_KEY = "notificationPref";
  const DEFAULT_PREF = false;

  const initializeNotificationPref = async () => {
    try {
      const storedPref = await AsyncStorage.getItem(NOTIF_PREF_KEY);
      console.log("LAWELWLWLWL", storedPref);
      const pref = storedPref === null ? DEFAULT_PREF : storedPref === "true";
      console.log("pref becomes ", pref);
      await AsyncStorage.setItem(NOTIF_PREF_KEY, String(pref));

      dispatch(setNotificationPref(pref));
    } catch (error) {
      console.error("Error loading notification preference", error);
      dispatch(setNotificationPref(DEFAULT_PREF));
    } finally {
      setNotificationPrefReady(true); // ✅ mark ready
    }
  };

  useEffect(() => {
    initializeNotificationPref();
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
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Provider store={store}>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  </GestureHandlerRootView>
);

export default App;
