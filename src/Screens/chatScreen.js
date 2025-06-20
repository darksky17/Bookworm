import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  Pressable,
  TouchableHighlight,
  TouchableOpacity,
} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import Menu from "../components/Menu";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
  db,
  auth,
} from "../Firebaseconfig";
import { Bubble } from "react-native-gifted-chat";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { SERVER_URL } from "../constants/api";

const ChatDisplay = ({ route, navigation }) => {
  const { allData } = route.params;
  const userId = auth.currentUser?.uid;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const chatsRef = collection(db, "Chats");
  const [modalState, setModalState] = useState(false);
  let clickedYes = [];
  const [isdisabled, setIsDisabled] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [hasHandledChoice, setHasHandledChoice] = useState(false);
  const [stopLoad, setStopLoad] = useState(false);
  const unsubscribeRef = useRef(null);
  console.log("THIS IS WHAT I GOT as ALL DATA", allData);
  const toggleMenu = () => {
    setMenuVisible((prev) => !prev); // ✅ This correctly toggles the modal
  };
  // Fetch or create chat between users
  const getChatId = async () => {
    console.log("Fetching chat ID...");

    console.log(allData.chatid);
    let chatId = allData.chatid;
    console.log(chatId);

    if (!chatId) {
      console.log("No existing chat found. Creating a new chat...");
      const newChat = await addDoc(chatsRef, {
        participants: [userId, allData.id],
        ascended: false,
        lastMessage: "",
        timestamp: serverTimestamp(),
        choices: [],
        unreadCounts: {
          [userId]: 0,
          [allData.id]: 0,
        },
      });
      chatId = newChat.id;
      console.log("New chat created with ID:", chatId);
    }

    return chatId;
  };
  useEffect(() => {
    const fetchChatId = async () => {
      const id = await getChatId();

      setChatId(id);
    };
    fetchChatId();
  }, []);

  // Handle sending messages
  const onSend = useCallback(
    async (newMessages = []) => {
      if (!chatId) {
        return;
      }
      const messagesRef = collection(db, "Chats", chatId, "messages");

      const message = newMessages[0];

      const firestoreMessage = {
        content: message.text,
        senderID: userId,
        receiverID: allData.id,
        timestamp: serverTimestamp(),
      };

      await addDoc(messagesRef, firestoreMessage);
      await updateDoc(doc(db, "Chats", chatId), {
        lastMessage: message.text,
        timestamp: serverTimestamp(),
        [`unreadCounts.${allData.id}`]: increment(1),
        lastSenderId: userId,
        messageCount: increment(1),
      });
      const idToken = await auth.currentUser.getIdToken();

      await fetch(`${SERVER_URL}/send-message-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          receiverId: allData.id,
          message: message.text,
        }),
      });
    },
    [chatId]
  );

  useEffect(() => {
    if (stopLoad) return;
    console.log("useEffect triggered with chatId:", chatId);

    if (!chatId) {
      console.log("No chatId yet, returning...");
      return;
    }

    const loadMessages = async () => {
      try {
        const chatDocRef = doc(db, "Chats", chatId);
        const chatSnap = await getDoc(chatDocRef);
        if (!chatSnap.exists()) {
          console.warn("Chat document no longer exists.");
          return;
        }
        const messagesRef = collection(db, "Chats", chatId, "messages");
        const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"));

        console.log("Setting up onSnapshot for messages...");
        if (stopLoad) return;
        unsubscribeRef.current = onSnapshot(
          messagesQuery,
          (snapshot) => {
            console.log(
              "onSnapshot triggered. Docs count:",
              snapshot.docs.length
            );

            const loadedMessages = snapshot.docs.map((doc) => {
              const datas = doc.data();

              return {
                _id: doc.id,
                text: datas.content,
                createdAt: datas.timestamp?.toDate() || new Date(),
                user: {
                  _id: datas.senderID,
                },
              };
            });

            setMessages([...loadedMessages]);
          },
          (error) => {
            console.error("Error in onSnapshot for messages:", error);
          }
        );
      } catch (err) {
        console.error("loadMessages() failed:", err);
      }
    };

    loadMessages();

    return () => {
      if (unsubscribeRef.current) {
        console.log("Cleaning up Firestore listener...");
        unsubscribeRef.current(); // unsubscribe
        unsubscribeRef.current = null; // reset ref
      }
    };
  }, [chatId]);

  // useEffect(() => {
  //   if (!chatId || stopLoad) return;

  //   const chatDocRef = doc(db, "Chats", chatId);
  //   const messagesRef = collection(db, "Chats", chatId, "messages");
  //   const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"));

  //   // 1. Listen to messages collection
  //   unsubscribeRef.current = onSnapshot(
  //     messagesQuery,
  //     (snapshot) => {
  //       const loadedMessages = snapshot.docs.map((doc) => {
  //         const datas = doc.data();
  //         return {
  //           _id: doc.id,
  //           text: datas.content,
  //           createdAt: datas.timestamp?.toDate() || new Date(),
  //           user: {
  //             _id: datas.senderID,
  //           },
  //         };
  //       });
  //       setMessages(loadedMessages);
  //     },
  //     (error) => {
  //       console.error("Error in messages onSnapshot:", error);
  //     }
  //   );

  //   // 2. Listen to Chats document separately for ascension logic
  //   const unsubscribeChatDoc = onSnapshot(
  //     chatDocRef,
  //     async (docSnap) => {
  //       if (!docSnap.exists()) return;

  //       const chatData = docSnap.data();
  //       const choice = Array.isArray(chatData.choices) ? chatData.choices : [];
  //       const messageCount = chatData.messageCount;

  //       console.log("Live message count:", messageCount);

  //       if (
  //         messageCount != 0 &&
  //         !chatData.ascended &&
  //         messageCount % 10 === 0
  //       ) {
  //         setModalState(true);
  //       }

  //       if (choice.some((c) => c.startsWith(userId))) {
  //         setModalState(true);
  //         setIsDisabled(true);
  //       }

  //       if (choice.length === 2 && !hasHandledChoice) {
  //         setHasHandledChoice(true);

  //         if (!choice.some((c) => c.endsWith(":No"))) {
  //           if (!chatData.ascended) {
  //             await updateDoc(chatDocRef, { ascended: true });
  //             setModalState(false);
  //           }
  //         } else {
  //           if (chatData.choices.length !== 0) {
  //             await updateDoc(chatDocRef, { choices: [] });
  //           }
  //           Alert.alert(
  //             "Looks like one of you chose not to Ascend. We will ask again later."
  //           );
  //           await updateDoc(chatDocRef, { messageCount: increment(1) });
  //           setModalState(false);
  //           setIsDisabled(false);
  //         }

  //         setModalState(false);
  //       }
  //     },
  //     (error) => {
  //       console.error("Error in chat doc onSnapshot:", error);
  //     }
  //   );

  //   return () => {
  //     // Clean up both listeners
  //     if (unsubscribeRef.current) {
  //       unsubscribeRef.current();
  //       unsubscribeRef.current = null;
  //     }
  //     unsubscribeChatDoc();
  //   };
  // }, [chatId, stopLoad, userId, hasHandledChoice]);

  useEffect(() => {
    if (!chatId) return;

    const messagesDocRef = doc(db, "Chats", chatId);
    const messagesRef = collection(db, "Chats", chatId, "messages");
    let chatData = {};
    const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
      const messageCount = snapshot.size; // ✅ Count messages dynamically
      console.log("Message count:", messageCount);

      if (messageCount > 0 && messageCount % 50 === 0 && !chatData.ascended) {
        setModalState(true);
      }
    });
    const unsubscribe = onSnapshot(messagesDocRef, async (docSnap) => {
      chatData = docSnap.data();
      const choice = Array.isArray(docSnap.data().choices)
        ? docSnap.data().choices
        : [];

      // Hide modal if the user already made a choice
      if (choice.some((c) => c.startsWith(userId))) {
        setModalState(true);
        setIsDisabled(true);
      }

      if (choice.length === 2 && !hasHandledChoice) {
        setHasHandledChoice(true);
        if (!choice.some((c) => c.endsWith(":No"))) {
          if (!chatData.ascended) {
            await updateDoc(messagesDocRef, { ascended: true });
            Alert.alert("WOOHOO, this chat is not ascended!");
          }
        } else {
          if (chatData.choices.length !== 0) {
            await updateDoc(messagesDocRef, { choices: [] });
          }
          Alert.alert(
            "Looks like one of you chose not to Ascend. We will ask again later."
          );
          await updateDoc(messagesDocRef, { messageCount: increment(1) });
          setModalState(false);
          setIsDisabled(false);
        }
        setModalState(false); // Ensures the modal closes for both users
      }
    });

    return () => {
      unsubscribe();
      unsubscribeMessages();
    };
  }, [chatId]);

  const handleModal = async (value) => {
    console.log("Tap registered:", value);

    if (!chatId) return;

    const messagesDocRef = doc(db, "Chats", chatId);
    const messageDocRefSnap = await getDoc(messagesDocRef);

    let choice = messageDocRefSnap.data().choices || [];

    // Prevent duplicate choices for the same user
    if (choice.includes(userId)) return;

    // Add user choice with their ID to prevent duplicate voting
    const updatedChoices = [...choice, userId + ":" + value];

    await updateDoc(messagesDocRef, { choices: updatedChoices });

    setIsDisabled(true); // Disable button after selection
  };

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -50) {
        console.log("Swiped Left");
        runOnJS(navigation.navigate)("ProfileDisplay", { allData });
      } else if (event.translationX > 50) {
        Alert.alert("Swiped Right");
      }
    })
    .activeOffsetX([-10, 10]);

  useEffect(() => {
    const markChatAsRead = async () => {
      if (!chatId || !userId) return;

      const chatDocRef = doc(db, "Chats", chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      console.log("Chat participants:", chatDocSnap.data().participants);
      try {
        await updateDoc(chatDocRef, {
          [`unreadCounts.${userId}`]: 0,
        });
      } catch (error) {
        console.error("Error updating unread count:", error);
      }
    };

    markChatAsRead(); // ✅ Actually call the function
  }, [chatId, userId]); // ✅ Run when chatId or userId changes

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="black"
            style={{ left: 5 }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {allData.ascended ? allData.name : allData.displayName}
        </Text>
        <TouchableOpacity onPress={toggleMenu}>
          <Feather name="more-vertical" size={24} color="black" />
        </TouchableOpacity>
        <Menu
          visible={isMenuVisible}
          setvisible={setMenuVisible}
          onClose={toggleMenu}
          allData={allData}
          chatId={chatId}
          stopload={stopLoad}
          setstopload={setStopLoad}
          navigation={navigation}
          unsubscribeRef={unsubscribeRef}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "flex-end",
          height: 30,
          backgroundColor: "lawngreen",
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Chat</Text>
        <Text>Profile</Text>
      </View>
      <GestureHandlerRootView>
        <GestureDetector gesture={swipeGesture}>
          <GiftedChat
            //key={messages.length}
            disableComposer={allData.isDeleted}
            keyboardShouldPersistTaps="handled"
            renderAvatar={null}
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{
              _id: userId,
              name: "You",
            }}
            placeholder={
              allData.isDeleted
                ? "You cant reply to this chat becuase the user deleted their account"
                : "Type a message..."
            }
            isAnimated={false}
            renderBubble={(props) => (
              <Bubble
                {...props}
                wrapperStyle={{
                  right: { backgroundColor: "lawngreen" }, // Sent messages (you)  //#90EE90 #32CD32 #0BDA51 #98FB98 #00FF7F
                  left: { backgroundColor: "black" }, // Received messages (other party)
                }}
                textStyle={{
                  right: { color: "black", fontWeight: "350" },
                  left: { color: "white", fontWeight: "350" },
                }}
              />
            )}
          />
        </GestureDetector>
      </GestureHandlerRootView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalState}
        onRequestClose={() => navigation.goBack()}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Congratulations! This chat can be ascended, would you like to
              ascend?
            </Text>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <Pressable
                disabled={isdisabled}
                style={[styles.button, styles.buttonClose]}
                onPress={() => handleModal("Yes")}
              >
                <Text style={styles.textStyle}>YES</Text>
              </Pressable>
              <Pressable
                disabled={isdisabled}
                style={[styles.button, styles.buttonClose]}
                onPress={() => handleModal("No")}
              >
                <Text style={styles.textStyle}>NO</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    backgroundColor: "lawngreen",
    height: 60,
    width: "100%",
    elevation: 4,
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
  headerText: {
    marginTop: "30",
    fontWeight: "500",
    fontSize: 25,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});

export default ChatDisplay;
