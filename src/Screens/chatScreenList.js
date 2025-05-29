import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
import auth from "@react-native-firebase/auth";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
  limit,
  orderBy,
} from "@react-native-firebase/firestore";
import { firestore, db } from "../Firebaseconfig";

import Header from "../components/Header";
import Feather from "@expo/vector-icons/Feather";
import Container from "../components/Container";
import { fetchChatsByQuery } from "../components/FirestoreHelpers";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { Platform } from "react-native";
import { getVersion, getApiLevel } from "react-native-device-info";

const ChatScreenList = ({ navigation }) => {
  useEffect(() => {
    const checkNotificationPermission = async () => {
      if (Platform.OS === "android") {
        const apiLevel = await getApiLevel(); // e.g., returns 33 for Android 13
        console.log(apiLevel);

        if (apiLevel >= 33) {
          const permission = PERMISSIONS.ANDROID.POST_NOTIFICATIONS;

          if (!permission) {
            console.warn(
              "POST_NOTIFICATIONS permission constant is undefined."
            );
            return;
          }

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

  const userId = auth().currentUser.uid;

  const [chats, setChats] = useState([]);
  let otherUserId = [];
  let p = 0;

  const fetchFriends = async (uids) => {
    const userDocs = [];
    let batchSize = 10;

    for (let i = 0; i < uids.length; i = +batchSize) {
      const batch = uids.slice(i, i + batchSize);

      const promises = batch.map((uid) => getDoc(doc(db, "Users", uid)));

      const batchResults = await Promise.all(promises);

      batchResults.forEach((snapshot) => {
        if (snapshot._exists) {
          userDocs.push({ id: snapshot.id, ...snapshot.data() });
        }
      });
    }

    return userDocs;
  };

  const fetchChatDocsbyID = async (userId) => {
    let chatData = [];

    const chatRefDocs = await fetchChatsByQuery(
      where("participants", "array-contains", userId)
    );

    if (chatRefDocs.empty) {
      console.log("No chats found.");
      return;
    }

    // Extract all chat data
    chatData = await Promise.all(
      chatRefDocs.docs.map(async (docSnap) => {
        const chatInfo = { id: docSnap.id, ...docSnap.data() };

        // Fetch latest message from "messages" subcollection
        const messagesQuery = query(
          collection(db, "Chats", docSnap.id, "messages"),
          orderBy("timestamp", "desc"),
          limit(1)
        );

        const latestMessageSnapshot = await getDocs(messagesQuery);

        let latestMessage = null;

        if (!latestMessageSnapshot.empty) {
          latestMessage = latestMessageSnapshot.docs[0].data();
        }

        return {
          ...chatInfo,
          latestMessage: latestMessage?.content || "", // Add only the text
        };
      })
    );

    // Get IDs of the other participants
    const otherUserIds = chatData
      .map((chat) => chat.participants.find((id) => id !== userId))
      .filter(Boolean);

    const friendDocs = await fetchFriends(otherUserIds);

    // Merge friend data with chat & latest message
    const updatedFriendDocs = friendDocs.map((user) => {
      const chat = chatData.find((c) => c.participants.includes(user.id));
      const unreadCount = chat?.unreadCounts?.[userId] ?? 0;

      return {
        ...user,
        ascended: chat?.ascended ?? null,
        latestMessage: chat?.latestMessage || "",
        unreadCount,
      };
    });
    console.log("LAWL", updatedFriendDocs);

    setChats(updatedFriendDocs);
  };

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
      fetchChatDocsbyID(userId);
    }, [userId])
  );

  return (
    <View style={styles.container}>
      <Header title={"Chats"} />
      <View style={{ flex: 1, paddingTop: 5, padding: 15 }}>
        <FlatList
          style={styles.chatListContainer}
          data={chats}
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
                    photo={item.photos[0]}
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
