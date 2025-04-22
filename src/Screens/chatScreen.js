import React, { useState, useEffect, useCallback } from "react";
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
import auth from "@react-native-firebase/auth";
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
} from "@react-native-firebase/firestore";
import { db } from "../Firebaseconfig";
import { Bubble } from "react-native-gifted-chat";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { fetchChatsByQuery } from "../components/FirestoreHelpers";

const ChatDisplay = ({ route, navigation }) => {
  const { allData } = route.params;
  const userId = auth().currentUser?.uid;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const chatsRef = collection(db, "Chats");
  const [modalState, setModalState] = useState(false);
  let clickedYes = [];
  const [isdisabled, setIsDisabled] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [hasHandledChoice, setHasHandledChoice] = useState(false);

  console.log("THIS IS WHAT I GOT as ALL DATA", allData);
  const toggleMenu = () => {
    setMenuVisible((prev) => !prev); // ✅ This correctly toggles the modal
  };
  // Fetch or create chat between users
  const getChatId = async () => {
    const chatSnapshot = await fetchChatsByQuery(
      where("participants", "array-contains", userId)
    );

    let chatId = null;

    chatSnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participants.includes(allData.id)) {
        chatId = doc.id;
      }
    });

    // If chat does not exist, create a new one
    if (!chatId) {
      const newChat = await addDoc(chatsRef, {
        participants: [userId, allData.id],
        ascended: false,
        lastMessage: "",
        timestamp: serverTimestamp(),
        choices: [],
      });
      chatId = newChat.id;
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

  // Load messages in real-time
  useEffect(() => {
    if (!chatId) return;
    let unsubscribe;
    const loadMessages = async () => {
      const messagesRef = collection(db, "Chats", chatId, "messages");

      const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"));

      unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => {
          const datas = { ...doc.data() };
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
      });
    };

    loadMessages();
    return () => unsubscribe && unsubscribe(); // Unsubscribe on unmount
  }, [chatId]);

  // Handle sending messages
  const onSend = useCallback(
    async (newMessages = []) => {
      if (!chatId) {
        return;
      }
      const messagesRef = collection(db, "Chats", chatId, "messages");
      const messagesDocRef = doc(db, "Chats", chatId);
      const message = newMessages[0];

      const firestoreMessage = {
        content: message.text,
        senderID: userId,
        receiverID: allData.id,
        timestamp: serverTimestamp(),
      };

      await addDoc(messagesRef, firestoreMessage);
    },
    [chatId]
  );

  useEffect(() => {
    if (!chatId) return;

    const messagesDocRef = doc(db, "Chats", chatId);
    const messagesRef = collection(db, "Chats", chatId, "messages");
    let chatData = {};
    const unsubscribe = onSnapshot(messagesDocRef, async (docSnap) => {
      chatData = docSnap.data();
      const choice = Array.isArray(docSnap.data().choices)
        ? docSnap.data().choices
        : [];

      const messageCount = docSnap.data().messageCount || 0;

      if (
        messageCount % 50 == 0 &&
        !docSnap.data().ascended &&
        messageCount != 0
      ) {
        setModalState(true); // Only show if not ascended yet
      }

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

    const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
      const messageCount = snapshot.size; // ✅ Count messages dynamically
      console.log("Message count:", messageCount);

      if (messageCount > 0 && messageCount % 10 === 0 && !chatData.ascended) {
        setModalState(true);
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
          onClose={toggleMenu}
          allData={allData}
          chatId={chatId}
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
            keyboardShouldPersistTaps="handled"
            renderAvatar={null}
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{
              _id: userId,
              name: "You",
            }}
            placeholder="Type a message..."
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
