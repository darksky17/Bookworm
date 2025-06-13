import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
} from "react-native";

import { auth } from "../Firebaseconfig";
import Header from "../components/Header";
import Feather from "@expo/vector-icons/Feather";
import Container from "../components/Container";

import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { Platform } from "react-native";
import { getVersion, getApiLevel } from "react-native-device-info";
import { SERVER_URL } from "../constants/api";

const ChatScreenList = ({ navigation }) => {
  const pause = useSelector((state) => state.user.pauseMatch);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [initializing, setInitializing] = useState(true);

  const toggleFilter = (filter) => {
    setActiveFilters((prev) => {
      const updated = new Set(prev);
      if (filter === "All") return new Set(); // reset

      if (updated.has(filter)) {
        updated.delete(filter); // toggle off
      } else {
        updated.add(filter); // toggle on
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

  const [chats, setChats] = useState([]);
  // let otherUserId = [];
  // let p = 0;

  // const fetchFriends = async (uids) => {
  //   const userDocs = [];
  //   let batchSize = 10;

  //   for (let i = 0; i < uids.length; i = +batchSize) {
  //     const batch = uids.slice(i, i + batchSize);

  //     const promises = batch.map((uid) => getDoc(doc(db, "Users", uid)));

  //     const batchResults = await Promise.all(promises);

  //     batchResults.forEach((snapshot) => {
  //       if (snapshot._exists) {
  //         userDocs.push({ id: snapshot.id, ...snapshot.data() });
  //       }
  //     });
  //   }

  //   return userDocs;
  // };

  // const fetchChatDocsbyID = async (userId) => {
  //   let chatData = [];

  //   const chatRefDocs = await fetchChatsByQuery(
  //     where("participants", "array-contains", userId)
  //   );

  //   if (chatRefDocs.empty) {
  //     console.log("No chats found.");
  //     setInitializing(false);
  //     return;
  //   }

  //   // Extract all chat data
  //   chatData = await Promise.all(
  //     chatRefDocs.docs.map(async (docSnap) => {
  //       const chatInfo = { id: docSnap.id, ...docSnap.data() };

  //       // Fetch latest message from "messages" subcollection
  //       const messagesQuery = query(
  //         collection(db, "Chats", docSnap.id, "messages"),
  //         orderBy("timestamp", "desc"),
  //         limit(1)
  //       );

  //       const latestMessageSnapshot = await getDocs(messagesQuery);

  //       let latestMessage = null;

  //       if (!latestMessageSnapshot.empty) {
  //         latestMessage = latestMessageSnapshot.docs[0].data();
  //       }

  //       return {
  //         ...chatInfo,
  //         latestMessage: latestMessage?.content || "", // Add only the text
  //       };
  //     })
  //   );

  //   // Get IDs of the other participants
  //   const otherUserIds = chatData
  //     .map((chat) => chat.participants.find((id) => id !== userId))
  //     .filter(Boolean);

  //   const friendDocs = await fetchFriends(otherUserIds);

  //   // Merge friend data with chat & latest message
  //   const updatedFriendDocs = friendDocs.map((user) => {
  //     const chat = chatData.find((c) => c.participants.includes(user.id));
  //     const unreadCount = chat?.unreadCounts?.[userId] ?? 0;
  //     const timestamp = chat?.timestamp;

  //     return {
  //       ...user,
  //       ascended: chat?.ascended ?? null,
  //       latestMessage: chat?.latestMessage || "",
  //       unreadCount,
  //       timestamp,
  //     };
  //   });
  //   updatedFriendDocs.sort((a, b) => {
  //     const timeA = a.timestamp?.toMillis?.() || 0;
  //     const timeB = b.timestamp?.toMillis?.() || 0;
  //     return timeB - timeA; // Newest first
  //   });

  //   setChats(updatedFriendDocs);
  //   setInitializing(false);
  // };

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
          <Text style={{ color: "white", fontSize: 20 }}>{initials}</Text>
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
            marginLeft: 10,
          }}
        >
          <Feather name="chevrons-up" size={24} color="limegreen" />
        </View>
      );
    } else return;
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchChatsFromServer = async () => {
        try {
          const userId = auth.currentUser.uid;
          const idToken = await auth.currentUser.getIdToken();

          const response = await fetch(
            `${SERVER_URL}/chat-list/${userId}/chats`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch chat data");
          }

          const data = await response.json();

          if (isActive) {
            setChats(data);
            setInitializing(false);
          }
        } catch (error) {
          console.error("Error fetching chat data:", error);
        }
      };

      fetchChatsFromServer();

      // Cleanup function to avoid setting state if component is unmounted
      return () => {
        isActive = false;
      };
    }, [])
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchChatDocsbyID(userId);
  //   }, [userId])
  // );
  const filters = ["All", "Normal", "Ascended", "Unread"];

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={"Chats"} />
      {pause && (
        <View style={{ paddingTop: 10, paddingHorizontal: 10 }}>
          <Text style={{ color: "red", fontWeight: 500 }}>
            It looks like you have paused your matches, new users cant find you
            unless you turn it back on
          </Text>
        </View>
      )}

      <View style={{ flex: 1, paddingTop: 5, padding: 15 }}>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            paddingVertical: 20,
            justifyContent: "space-evenly",
          }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => toggleFilter(filter)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor:
                  activeFilters.has(filter) ||
                  (filter === "All" && activeFilters.size === 0)
                    ? "limegreen"
                    : "lightgray",
              }}
            >
              <Text style={{ color: "black" }}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
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
                    style={{ paddingLeft: 10, flexShrink: 1, flexGrow: 1 }}
                    onPress={() =>
                      navigation.navigate("ChatDisplay", { allData: item })
                    }
                  >
                    <View style={{ flexShrink: 1, flexGrow: 1, gap: 5 }}>
                      <Text style={styles.chatText}>
                        {item.ascended ? item.name : item.displayName}
                      </Text>
                      {item.latestMessage ? (
                        <Text
                          style={{
                            fontSize: 14,
                            color: "gray",
                            fontWeight: "bold",
                            flexShrink: 1,
                            flexGrow: 1,
                            overflow: "hidden",
                            paddingLeft: 10,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.latestMessage}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>

                {/* RIGHT SIDE */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 10,
                  }}
                >
                  {item.unreadCount > 0 && (
                    <View
                      style={{
                        backgroundColor: "green",
                        borderRadius: 10,
                        minWidth: 20,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          fontSize: 12,
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
          contentContainerStyle={{ gap: 10 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    backgroundColor: "lawngreen",
    height: 60,
    width: "100%",
    elevation: 4,
  },
  headerText: {
    position: "absolute",
    bottom: 0,
    fontWeight: "medium",
    fontSize: 35,
  },

  chatListContainer: {
    paddingTop: 15, // Space below header
  },

  chatlistbg: {
    backgroundColor: "snow",
    padding: 15,
    //marginHorizontal: 15,

    borderRadius: 10,
  },

  chatRow: {
    flexDirection: "row", // Aligns icon & text horizontally
    alignItems: "center", // Keeps them centered
    flex: 1,
    justifyContent: "space-between",
  },

  chatText: {
    color: "black", // White text for better contrast
    fontSize: 18,
    fontWeight: "bold",
    paddingLeft: 10,
  },
});
export default ChatScreenList;
