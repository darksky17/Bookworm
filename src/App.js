import React, { useEffect, useState } from "react";
import { NavigationContainer, getStateFromPath } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import { Text, View, StatusBar, Image, Platform, Alert } from "react-native";
import { Provider, useSelector } from "react-redux";
import { store } from "./redux/store";
import { db, auth, doc, getDoc, updateDoc } from "./Firebaseconfig";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { PaperProvider, Button } from "react-native-paper";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setNotificationPref } from "./redux/userSlice";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import theme from "./design-system/theme/theme";
import { APP_VERSION } from "./constants/api";
import {
  SERVER_URL,
} from "./constants/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Modal, Linking, ActivityIndicator } from "react-native";
import AuthNavigator from "./navigation/AuthNavigator";
import MainNavigator from "./navigation/MainNavigator";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useNetInfoInstance } from "@react-native-community/netinfo";





const AppNavigator = () => {
  const queryClient = new QueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [downloadlink, setDownloadLink] = useState(null);
  const notificationPref = useSelector((state) => state.user.notificationpref);
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Home");
  const [user, setUser] = useState();
  const [notificationPrefReady, setNotificationPrefReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialState, setInitialState] = useState(undefined);
  const [isReady, setIsReady] = useState(true);
  const { netInfo: { type, isConnected }, refresh } = useNetInfoInstance();


  
  const linking = {
    prefixes: ['https://bookworm.infodata.in', 'bookworm.infodata.in'],
    config: {
      screens: {
        Home: '',
        PostDetail: 'posts/:id',
        DisplayProfile:'profile/:userId',
      },
    },
  };

  useEffect(()=>{

    const prepareInitialState = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          const path = url.replace(/^https?:\/\/[^/]+\/?/, '');
          const parsedState = getStateFromPath(path, linking.config);
          
          const route = parsedState?.routes?.[0];
          
  
          // If user deep linked to PostDetail or DisplayProfile
          if (route?.name === 'PostDetail' || route?.name === 'DisplayProfile') {
            const fallbackStack = {
              index: 1,
              routes: [
                { name: 'MainTabs' }, // <-- Inject Home into back stack
                {
                  name: route.name,
                  params: route.params,
                },
              ],
            };
            
            setInitialState(fallbackStack);
          } else {
            
            setInitialState(parsedState); // normal deep link (like to Home)
          }
        } 
      } catch (e) {
        console.warn('Error preparing initial navigation state', e);
      } finally {
        setIsReady(true);
      }
    };
 
  
    prepareInitialState();

  }, []);
  const checkForUpdates = async () => {
    try {
      // Check version from your server
      
      const response = await fetch(`${SERVER_URL}/version-check`);
      const { version, updatelink } = await response.json();

      console.log("Here is the version", version);

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
              setIsAuthenticated(true);
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
    
      const pref = storedPref === null ? DEFAULT_PREF : storedPref === "true";
    
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

  if (initializing || !isReady) {
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

  if(!isConnected){
    return(
      <View style={{flex:1, justifyContent:"center", alignItems:"center", padding:10}}>
        <Text>It looks like you are not connected to Internet. Please conenct to internet to proceed</Text>

      </View>
    )
  }


  return (
    <QueryClientProvider client={queryClient}>
      <BottomSheetModalProvider>    
         <NavigationContainer linking={linking} initialState={initialState}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle="dark-content"
        />
 
        {isAuthenticated? <MainNavigator /> : <AuthNavigator initialRoute={initialRoute} onAuthComplete={() => setIsAuthenticated(true)} />}
          
      </NavigationContainer>
      </BottomSheetModalProvider>
 
    </QueryClientProvider>
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
