import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect, useRoute, useScrollToTop } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Text,
  Button,
  FlatList,
  flex,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import { auth } from "../Firebaseconfig";
import Header from "../components/Header";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from '@expo/vector-icons/Ionicons';
import Container from "../components/Container";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { Platform } from "react-native";
import { getVersion, getApiLevel } from "react-native-device-info";
import { SERVER_URL } from "../constants/api";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  moderateScale,
  horizontalScale,
} from "../design-system/theme/scaleUtils";
import useFetchChats from "../hooks/useFetchChats";
import useUnreadCountListener from "../hooks/useUnreadCountListener";
import { setShowChatToast } from "../redux/appSlice";



const ChatScreenList = ({ navigation }) => {
  const pause = useSelector((state) => state.user.pauseMatch);
  const gender = useSelector((state) => state.user.gender);
  const showChatToast =  useSelector((state)=> state.app.showChatToast);
  const chatRequests = useSelector((state) => state.user.chatRequestsCount);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [initializing, setInitializing] = useState(true);
  const { data: chats, isLoading, isError, refetch } = useFetchChats();
  const unread = useSelector(state => state.user.unreadCount);
  let unreadCount = unread;
  const ref = useRef(null);
  const dispatch = useDispatch();
  const route = useRoute();


  useFocusEffect(
    useCallback(() => {
      console.log("👀 ChatScreenList Focused - Disabling Toasts");
      
      // 1. Disable toasts when user is looking at the chat list
      dispatch(setShowChatToast(false));

      // 2. Handle autoRedirect when screen is focused
      if (route.params?.autoRedirect) {
        console.log("🚩 AutoRedirect Flag Detected!");
        
        if (isLoading) {
          console.log("⏳ Chats are still loading, waiting...");
          return;
        }
    
        if (chats) {
          const targetId = route.params?.targetChatId;
          console.log("🎯 Searching for Chat ID:", targetId);
    
          const targetChat = chats.find(c => (c.chatid === targetId || c.chatId === targetId));
    
          if (targetChat) {
            console.log("✅ Chat Found! Navigating to ChatDisplay...");
            
            // Use setParams to clear the flag
            navigation.setParams({ autoRedirect: undefined, targetChatId: undefined });
    
            navigation.navigate("ChatDisplay", { allData: targetChat });
          } else {
            console.log("❌ Chat ID not found in current chats array. Length:", chats.length);
          }
        }
      }

      return () => {
        console.log("🙈 ChatScreenList Unfocused - Enabling Toasts");
        
        // 3. Re-enable toasts when user switches tabs or leaves this screen
        dispatch(setShowChatToast(true));
      };
    }, [dispatch, route.params?.autoRedirect, route.params?.targetChatId, isLoading, chats, navigation])
  );
  useScrollToTop(ref);

  console.log("chat Request count", chatRequests);
  
  // useUnreadCountListener();

  const toggleFilter = (filter) => {
    setActiveFilters((prev) => {
      const updated = new Set(prev);
      if (filter === "All") return new Set(); // reset

      if (updated.has(filter)) {
        updated.delete(filter); // toggle off
      } else {
        if(updated.has("Normal") && filter==="Ascended"){
          updated.delete("Normal")
          updated.add("Ascended");
        }
        else if(updated.has("Ascended") && filter==="Normal"){
          updated.delete("Ascended")
          updated.add("Normal");
        }

        else{
        updated.add(filter); // toggle on
        }
      }

      return updated;
    });
  };



  const getFilteredChats = () => {

    if (activeFilters.size === 0) return chats; // "All"

    return chats.filter((chat) => {
      const isNormal = !chat.ascended;
      const isAscended = !!chat.ascended;
      const isUnread = chat.unreadCount > 0;

      if (activeFilters.has("Normal") && !isNormal) return false;
      if (activeFilters.has("Ascended") && !isAscended) return false;
      if (activeFilters.has("Unread") && !isUnread) return false;

      return true;
    });
  };

  useEffect(() => {
    const checkNotificationPermission = async () => {
      if (Platform.OS === "android") {
        const apiLevel = await getApiLevel(); // e.g., 33 for Android 13+

        if (apiLevel >= 33) {
          const permission = "android.permission.POST_NOTIFICATIONS";
          console.log("Notification permission string:", permission);

          const status = await check(permission);

          if (status === RESULTS.DENIED) {
            const newStatus = await request(permission);
            console.log("Permission after request:", newStatus);
          } else {
            console.log("Permission status:", status);
          }
        } else {
          console.log(
            "Android version < 13 — notification permission not required."
          );
        }
      }
    };

    checkNotificationPermission();
  }, []);

  const userId = auth.currentUser.uid;

  // const [chats, setChats] = useState([]);

  const InitialIcon = ({ initials, ascended, photo }) => {
    return (
      <View
        style={{
          backgroundColor: "blue",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
          width: 40,
          height: 40,
          overflow: "hidden",
        }}
      >
        {ascended && photo ? (
          <Image
            source={{ uri: photo }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={{
              color: "white",
              fontSize: theme.fontSizes.large,
              fontFamily: theme.fontFamily.regular,
            }}
          >
            {initials}
          </Text>
        )}
      </View>
    );
  };

  const AscendIcon = ({ value }) => {
    if (value) {
      if (!value) return null; // Return nothing if value is false

      return (
        <View
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginLeft: horizontalScale(10),
          }}
        >
          <Feather name="chevrons-up" size={24} color="limegreen" />
        </View>
      );
    } else return;
  };

  



  const filters = ["All", "Normal", "Ascended", "Unread"];

  // if (initializing) {
  //   return (
  //     <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
  //       <ActivityIndicator size="large" color={theme.colors.secondary} />
  //     </View>
  //   );
  // }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  return (
    <Container>
      <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
      <Header title={"Chats"} />
      {chatRequests>=0 &&(
      <View style={{marginRight:theme.spacing.horizontal.sm}}>
      <Pressable onPress={()=>navigation.navigate("ChatRequests")}>
   
      <Text style={{color:theme.colors.secondary, fontWeight:"bold"}}>Requests({chatRequests>9? `9+` :chatRequests}) </Text>
      </Pressable>
      </View>
      )}
      </View>
      {pause && (
        <View
          style={{
            paddingTop: theme.spacing.vertical.sm,
            paddingHorizontal: theme.spacing.horizontal.sm,
          }}
        >
          <Text
            style={{
              color: theme.colors.error,
              fontWeight: "bold",
              fontFamily: theme.fontFamily.regular,
            }}
          >
            It looks like you have paused your matches, new users cant find you
            unless you turn it back on
          </Text>
        </View>
      )}

      {chats.length === 0 ? (
        <View
          style={{
            flex: 1,
            paddingTop: theme.spacing.vertical.xl,
            alignItems: "center",
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              gap: verticalScale(70),
            }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSizes.medium,
                fontWeight: "bold",
              }}
            >
              You have no chats as now. How about you read a book?
            </Text>
            <Animated.View>
              {gender == "male" ? (
                <Image
                  source={require("../assets/nochats_boy.gif")}
                  style={{
                    width: horizontalScale(230),
                    height: verticalScale(300),
                    borderRadius: theme.borderRadius.sm,
                  }}
                />
              ) : (
                <Image
                  source={require("../assets/nochats_girl.gif")}
                  style={{
                    width: horizontalScale(230),
                    height: verticalScale(300),
                    borderRadius: theme.borderRadius.sm,
                  }}
                />
              )}
            </Animated.View>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: theme.spacing.vertical.xs }}>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              paddingVertical: theme.spacing.vertical.md,
              justifyContent: "space-evenly",
            }}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => toggleFilter(filter)}
                style={{
                  paddingVertical: theme.spacing.vertical.xs,
                  paddingHorizontal: theme.spacing.horizontal.md,
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor:
                    activeFilters.has(filter) ||
                    (filter === "All" && activeFilters.size === 0)
                      ? "limegreen"
                      : "lightgray",
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fontFamily.regular,
                  }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
          ref={ref}
            style={styles.chatListContainer}
            data={getFilteredChats()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.chatlistbg}>
                <View style={styles.chatRow}>
                  <View
                    style={{
                      flexDirection: "row",
                      flexShrink: 1,
                      flexGrow: 1,
                      alignItems: "center",
                    }}
                  >
                    <InitialIcon
                      ascended={item.ascended}
                      photo={item.photos?.[0]}
                      initials={item.displayName?.[0]}
                    />

                    <Pressable
                      style={{
                        paddingLeft: theme.spacing.horizontal.xs,
                        flexShrink: 1,
                        flexGrow: 1,
                      }}
                      onPress={async () =>{
                      
                        
                        navigation.navigate("ChatDisplay", { allData: item });
                        
                      }
                      }
                    >
                      <View
                        style={{
                          flexShrink: 1,
                          flexGrow: 1,
                          gap: verticalScale(5),
                        }}
                      >
                        <Text style={styles.chatText}>
                          {item.ascended ? item.name : item.displayName}
                        </Text>
                        {item.latestMessage ? (
                          <View style={{flex:1, marginLeft:5, flexDirection:"row", alignItems:"center"}}>
                           {item.latestSenderId === auth.currentUser.uid &&(
                            <Ionicons name="checkmark-done-sharp" size={18} color="grey" />
                           )}
                          <Text
                            style={{
                              fontSize: theme.fontSizes.small,
                              color: "gray",
                              fontWeight: "bold",
                              flexShrink: 1,
                              flexGrow: 1,
                              overflow: "hidden",
                              paddingLeft: theme.spacing.horizontal.sm,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.latestMessage}
                          </Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  </View>

                  {/* RIGHT SIDE */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: horizontalScale(10),
                    }}
                  >
                    {item.unreadCount > 0 && (
                      <View
                        style={{
                          backgroundColor: "green",
                          borderRadius: moderateScale(1000),
                          minWidth: horizontalScale(20),
                          paddingHorizontal: horizontalScale(1),
                          paddingVertical: verticalScale(1),
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: horizontalScale(5),
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: theme.fontSizes.small,
                            paddingHorizontal: horizontalScale(1),
                            paddingVertical: verticalScale(1),
                          }}
                        >
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                    <AscendIcon value={item.ascended} />
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={{ gap: verticalScale(1) }}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  chatListContainer: {
    paddingTop: 0, // Space below header
  },

  chatlistbg: {
    padding: theme.spacing.horizontal.md,
  },

  chatRow: {
    flexDirection: "row", // Aligns icon & text horizontally
    alignItems: "center", // Keeps them centered
    flex: 1,
    justifyContent: "space-between",
  },

  chatText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    fontWeight: "bold",
    paddingLeft: theme.spacing.horizontal.sm,
  },
});
export default ChatScreenList;
