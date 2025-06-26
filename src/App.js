import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import { db, auth, doc, getDoc, updateDoc } from "./Firebaseconfig";
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
import { signOut, onAuthStateChanged } from "@react-native-firebase/auth";
import theme from "./design-system/theme/theme";
import { APP_VERSION } from "./constants/api";
import {
  SERVER_URL,
  PRIVACY_POLICY,
  TERMS_N_CONDITIONS,
} from "./constants/api";
import axios from "axios";
import { Modal, Linking, ActivityIndicator } from "react-native";

function HomeScreen({ navigation }) {
  return (
    <View
      style={{
        flex: 1,
        gap: 20,
        padding: 20,
        paddingTop: 50,
        backgroundColor: "lightgreen",
      }}
    >
      <StatusBar backgroundColor="lightgreen" barStyle="dark-content" />
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
          textColor={theme.colors.text}
        >
          Get Started
        </Button>

        {/* <Button
          mode="contained"
          onPress={() =>
            signOut(auth).then(() => console.log("User signed out!"))
          }
          style={{ backgroundColor: "snow" }}
          textColor={theme.colors.text}
        >
          Logout
        </Button> */}
      </View>
      <View
        style={{ alignItems: "center", justifyContent: "flex-start", gap: 12 }}
      >
        <Text style={{ fontWeight: "bold" }}>
          Made with <Ionicons name="heart" size={16} color="red" /> by Soraaa
        </Text>
        <Text
          style={{
            fontSize: 7,
            color: theme.colors.text,
            fontWeight: "bold",
          }}
        >
          By proceeding, you agree to{" "}
          <Text
            style={{ color: "blue", textDecorationLine: "underline" }}
            onPress={() => Linking.openURL(PRIVACY_POLICY)}
          >
            Privacy Policy
          </Text>{" "}
          and{" "}
          <Text
            style={{ color: "blue", textDecorationLine: "underline" }}
            onPress={() => Linking.openURL(TERMS_N_CONDITIONS)}
          >
            Terms & Conditions
          </Text>{" "}
          for using BookWorm.
        </Text>
      </View>
    </View>
  );
}
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [openModal, setOpenModal] = useState(false);
  const [downloadlink, setDownloadLink] = useState(null);
  const notificationPref = useSelector((state) => state.user.notificationpref);
  console.log("WALAAALLALALAAL", notificationPref);
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Home");
  const [user, setUser] = useState();
  const [notificationPrefReady, setNotificationPrefReady] = useState(false);

  const checkForUpdates = async () => {
    try {
      // Check version from your server
      console.log("I did run");
      const response = await fetch(`${SERVER_URL}/version-check`);
      const { version, updatelink } = await response.json();

      console.log("Here is the version", version);
      console.log("And the update link", updatelink);

      if (version !== APP_VERSION) {
        // Get APK download URL from Firebase Storage

        setDownloadLink(updatelink);
        setOpenModal(true);
      }
    } catch (error) {
      console.log("Update check failed:", error);
    }
  };
  useEffect(() => {
    checkForUpdates();
  }, []);
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user != null) {
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
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }
  if (openModal) {
    return (
      <Modal visible transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Update Required
            </Text>
            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              A new version of the app is available. You must update to
              continue.
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                Linking.openURL(downloadlink);
              }}
            >
              Update Now
            </Button>
          </View>
        </View>
      </Modal>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="dark-content"
      />
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
