import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { NavigationContainer, getStateFromPath, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import { Text, View,Image, Platform, Alert, TouchableOpacity } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from "react-redux";
import { store } from "./redux/store";
import { db, auth, doc, getDoc, updateDoc, setDoc, addDoc } from "./Firebaseconfig";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { PaperProvider, Button } from "react-native-paper";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setNotificationPref } from "./redux/userSlice";
import { setIsAuthenticated } from "./redux/appSlice";
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { horizontalScale, verticalScale } from "./design-system/theme/scaleUtils";
import { KeyboardProvider } from "react-native-keyboard-controller";
import ToastManager, { Toast } from 'toastify-react-native'
import { navigate } from "./RootNavigation";
import { navigationRef } from "./RootNavigation";




const AppNavigator = () => {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [openModal, setOpenModal] = useState(false);
  const [downloadlink, setDownloadLink] = useState(null);
  const notificationPref = useSelector((state) => state.user.notificationpref);
  const isAuthenticated = useSelector((state)=> state.app.isAuthenticated);
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Home");
  const [user, setUser] = useState();
  const [notificationPrefReady, setNotificationPrefReady] = useState(false);
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialState, setInitialState] = useState(undefined);
  const [isReady, setIsReady] = useState(true);
  const { netInfo: { type, isConnected }, refresh } = useNetInfoInstance();
  const [serverCheck, setServerCheck] = useState(false);
  const showChatToast =  useSelector((state)=> state.app.showChatToast);
  const activeChat = useSelector((state)=>state.app.currentActiveChat);

  // Use refs to store current values without recreating the listener
  const showChatToastRef = useRef(showChatToast);
  const activeChatRef = useRef(activeChat);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Keep refs in sync with state
  useEffect(() => {
    showChatToastRef.current = showChatToast;
  }, [showChatToast]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);



  
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
    setServerCheck(true);
  };
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Set background message handler only once (should not be in a useEffect that runs multiple times)
  useEffect(() => {
    if (Platform.OS === "android" && notificationPref === true) {
      console.log("✅ Setting background message handler");
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("📩 Background message:", remoteMessage);
      });
    }
  }, []); // Only run once on mount

  // Set up foreground message listener - use refs to avoid recreating listener
  useEffect(() => {
    if (notificationPref !== true) {
      console.log("🚫 Notification disabled or not loaded yet");
      return;
    }

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("📩 Foreground message", JSON.stringify(remoteMessage));
      
      // Use refs to get current values without recreating listener
      const currentShowChatToast = showChatToastRef.current;
      const currentActiveChat = activeChatRef.current;
      const currentIsAuthenticated = isAuthenticatedRef.current;
      
      console.log("Current showChatToast value:", currentShowChatToast);
   
      if(!currentShowChatToast || currentActiveChat === remoteMessage.data.chatId || !currentIsAuthenticated){
        console.log("Cant display toast here", currentActiveChat, currentIsAuthenticated);
        return;
      }
         

      Toast.show({
        type: 'info',
        text1: `${remoteMessage.data.senderDisplayName}`,
        text2: `${remoteMessage.data.message}`,
        target:`${remoteMessage.data.chatId}`,
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
      });
    });
      
    

    return unsubscribe;
  }, [notificationPref]); // Only depend on notificationPref, not the frequently changing values



  useEffect(() => {
    if (!notificationPrefReady || !serverCheck) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user != null) {
        console.log("User is logged in");
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
          const idToken = await auth.currentUser.getIdToken();
          const userDocRef = doc(db, "Users", uid);
          const userDocSnap = await getDoc(userDocRef);
                const response = await fetch(`${SERVER_URL}/check-user-exists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
        }),
      });
      const data = await response.json();
      
          if (!data.exists) {
            
            // setInitialRoute("Phoneauth");
            
            const newUserRef = doc(db, "Users", auth.currentUser.uid);
            await setDoc(newUserRef, {
              phoneNumber: auth.currentUser.phoneNumber,
              step1Completed: false,
              step2Completed: false,
              step3Completed: false,
              pauseMatch: false,
              currentMatches: [],
            });
          
            setInitialRoute("Userdeet1");
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
              dispatch(setIsAuthenticated(true));
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
  }, [notificationPrefReady, notificationPref, serverCheck]);

  const NOTIF_PREF_KEY = "notificationPref";
  const DEFAULT_PREF = true;

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

  // Memoize toastConfig to prevent unnecessary re-renders of ToastManager
  // MUST be before any early returns to follow Rules of Hooks
  const toastConfig = useMemo(() => ({
    info: (props) => (
      <TouchableOpacity 
        onPress={() => {Toast.hide();
          navigate("MainTabs", {
            screen: "Chats", 
            params: { autoRedirect: true, targetChatId: props.target }
          });
        }} 
        style={{ flex: 1, width: "80%", backgroundColor: 'grey', padding: 12, borderRadius: 10 }}
      >
        <Text style={{ color: "white", fontWeight: '800' }}>{props.text1}</Text>
        {props.text2 && <Text style={{ color: 'white' }} numberOfLines={2} ellipsizeMode="tail">{props.text2}</Text>}
      </TouchableOpacity>
    ),
    // Override other toast types as needed
  }), []);

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background, // Or your desired background color
    },
  };

  if (!serverCheck) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center"}}>
        <Text numberOfLines={2} style={{color:theme.colors.background, paddingHorizontal:10}}>Please wait while we talk to our server.. it might take a minute..he is busy reading</Text>
        
        <Image
                  source={require("./assets/servercheck.gif")}
                  style={{
                    width: horizontalScale(200),
                    height: verticalScale(270),
                    borderRadius: theme.borderRadius.sm,
                  }}
                  resizeMode="contain"
                />
      </View>
    );
  }

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
      <SafeAreaProvider>
             <BottomSheetModalProvider>    
              <KeyboardProvider>
         <NavigationContainer ref={navigationRef} linking={linking} initialState={initialState} theme={MyTheme} key={`${isAuthenticated ? 'main' : 'auth'}-${initialRoute || 'none'}`}>
        <StatusBar style="dark"/>
 
        {isAuthenticated? <MainNavigator /> : <AuthNavigator initialRoute={initialRoute} />}

      </NavigationContainer>
      <ToastManager config={toastConfig} animationStyle="none" />
      </KeyboardProvider>
      </BottomSheetModalProvider>
      </SafeAreaProvider>
 
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
