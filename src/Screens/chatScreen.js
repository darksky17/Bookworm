import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  Pressable,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  Keyboard,
} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import * as ImagePicker from "expo-image-picker";
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
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "../Firebaseconfig";
import storage from "@react-native-firebase/storage";
import { Bubble, Send, InputToolbar, Actions } from "react-native-gifted-chat";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SERVER_URL } from "../constants/api";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";
import ImageView from "react-native-image-viewing";
import { useQueryClient } from "@tanstack/react-query";

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
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const queryClient = useQueryClient();
  console.log("THIS IS WHAT I GOT as ALL DATA", allData);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev); // ✅ This correctly toggles the modal
  };

  // Handle image picking (just selection, not sending)
  const handleImagePick = async () => {
    try {
      // Ask for permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "Camera roll access is required.");
        return [];
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const image = result.assets[0];
        console.log("Damn", image.uri);

        return [
          {
            _id: Math.round(Math.random() * 1000000),
            text: "",
            createdAt: new Date(),
            user: {
              _id: userId,
            },
            image: image.uri, // local file URI
            pending: true, // mark as not yet uploaded
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("💥 Error picking image:", error);
      return [];
    }
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

  const onSend = useCallback(
    async (newMessages = []) => {
      if (!chatId || newMessages.length === 0) return;

      const message = newMessages[0];
      const messagesRef = collection(db, "Chats", chatId, "messages");

      try {
        let imageUrl = null;

        // Upload image if message has a pending image
        if (message.image && message.pending) {
          console.log("Uploading image...");
          const tempMessageId = `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const imagePath = `images/${chatId}/${tempMessageId}.jpg`;
          const storageRef = storage().ref(imagePath);

          try {
            await storageRef.putFile(message.image);
            imageUrl = await storageRef.getDownloadURL();
            console.log("✅ Image uploaded, URL:", imageUrl);
          } catch (uploadError) {
            console.error("❌ Upload failed:", uploadError);
            throw uploadError;
          }
        } else if (message.image && !message.pending) {
          // Image was already uploaded (edge case)
          imageUrl = message.image;
        }

        // Prepare Firestore message object
        const firestoreMessage = {
          content: imageUrl ? "📷 Photo" : message.text || "",
          senderID: userId,
          receiverID: allData.id,
          timestamp: serverTimestamp(),
        };

        if (imageUrl) {
          firestoreMessage.image = imageUrl;
        }

        // Add message document to Firestore
        await addDoc(messagesRef, firestoreMessage);

        const lastMessageText = imageUrl ? "📷 Photo" : message.text;

        // Update the parent chat document
        await updateDoc(doc(db, "Chats", chatId), {
          lastMessage: lastMessageText,
          timestamp: serverTimestamp(),
          [`unreadCounts.${allData.id}`]: increment(1),
          lastSenderId: userId,
          messageCount: increment(1),
        });

        // Send notification to receiver
        const idToken = await auth.currentUser.getIdToken();
        await fetch(`${SERVER_URL}/send-message-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            receiverId: allData.id,
            message: lastMessageText,
          }),
        });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (error) {
        console.error("❌ Error sending message:", error);
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    },
    [chatId, userId, allData.id]
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

              const messageObj = {
                _id: doc.id,
                text: datas.content,
                createdAt: datas.timestamp?.toDate() || new Date(),
                user: {
                  _id: datas.senderID,
                },
              };

              // Add image if it exists
              if (datas.image) {
                messageObj.image = datas.image;
              }

              return messageObj;
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

  useEffect(() => {
    if (!chatId) return;

    const messagesDocRef = doc(db, "Chats", chatId);
    const messagesRef = collection(db, "Chats", chatId, "messages");
    let chatData = {};
    const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
      const messageCount = snapshot.size; // ✅ Count messages dynamically
      console.log("Message count:", messageCount);
      if (!chatData) return; // Safety check

      if (messageCount > 0 && messageCount % 50 === 0 && !chatData.ascended) {
        console.log("Check 1 for chatData", chatData);
        console.log("Check 2 for message count", messageCount);
        setModalState(true);
      }
    });
    const unsubscribe = onSnapshot(messagesDocRef, async (docSnap) => {
      chatData = docSnap.data();
      const choice = Array.isArray(docSnap.data().choices)
        ? docSnap.data().choices
        : [];

      // Hide modal if the user already made a choice
      if (choice.some((c) => c.startsWith(userId)) && !chatData.ascended) {
        console.log("🔴 MODAL TRIGGERED FROM USER CHOICE CHECK");
        setModalState(true);
        setIsDisabled(true);
      }

      if (choice.length === 2 && !hasHandledChoice) {
        setHasHandledChoice(true);
        if (!choice.some((c) => c.endsWith(":No"))) {
          if (!chatData.ascended) {
            await updateDoc(messagesDocRef, { ascended: true });
            Alert.alert("WOOHOO, this chat is now ascended!");
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
        return;
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

  const renderSend = useCallback((props) => {
    const messageLength = props.text?.trim().length || 0;
    return (
      <Send
        {...props}
        containerStyle={{ justifyContent: "center", paddingHorizontal: 10 }}
        alwaysShowSend="true"
        disabled={messageLength === 0}
      >
        <MaterialIcons
          size={30}
          color={messageLength ? theme.colors.primary : "grey"}
          name={"send"}
        />
      </Send>
    );
  }, []);

  // Custom Actions component for image picker
  const renderActions = useCallback(
    (props) => {
      if (!allData.ascended || allData.isBlocked || allData.hasBlocked) {
        return;
      }
      return (
        <Actions
          {...props}
          containerStyle={{
            width: horizontalScale(44),
            height: verticalScale(44),
            alignItems: "center",
            justifyContent: "center",
            marginLeft: horizontalScale(4),
            marginRight: horizontalScale(4),
            marginBottom: 0,
          }}
          icon={() => (
            <Ionicons name="camera" size={24} color={theme.colors.primary} />
          )}
          onPressActionButton={async () => {
            const messages = await handleImagePick();
            if (messages.length > 0) {
              // show message in chat immediately
              setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, messages)
              );
              // upload image + send to Firestore
              await onSend(messages);
            }
          }}
        />
      );
    },
    [onSend]
  ); // 💡 include onSend in dependencies

  const CustomInputToolbar = useCallback(
    (props) => {
      return (
        <View style={styles.inputContainer}>
          <ScrollView>
            <InputToolbar
              {...props}
              containerStyle={styles.inputToolbar}
              primaryStyle={{ flex: 1 }}
              renderSend={() => <View />}
              renderActions={renderActions}
            />
          </ScrollView>
          {renderSend(props)}
        </View>
      );
    },
    [renderActions, renderSend]
  );

  const renderMessageImage = useCallback((props) => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedImage([{ uri: props.currentMessage.image }]);
          setImageViewerVisible(true);
        }}
      >
        <Image
          source={{ uri: props.currentMessage.image }}
          style={{
            width: horizontalScale(200),
            height: verticalScale(200),
            borderRadius: moderateScale(10),
          }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }, []);

  const renderBubble = useCallback(
    (props) => (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: theme.colors.primary }, // Sent messages (you)
          left: { backgroundColor: theme.colors.text }, // Received messages (other party)
        }}
        textStyle={{
          right: { color: theme.colors.text },
          left: { color: theme.colors.background },
        }}
      />
    ),
    []
  );

  // Memoize the user object to prevent unnecessary re-renders
  const user = useMemo(
    () => ({
      _id: userId,
      name: "You",
    }),
    [userId]
  );

  const placeHolder= ()=>{

    if (allData.isDeleted){
      return "You cant reply to this chat because the user deleted their account"
    }
    else if(allData.isBlocked){
      return "You cant reply to this chat"
    }

    else if (allData.hasBlocked){
      return "You cant reply to this chat because you have blocked this user"
    }

    else return "Type a message..."

  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="black"
            style={{ left: horizontalScale(5) }}
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
          height: verticalScale(30),
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            color: theme.colors.text,
            fontSize: moderateScale(14),
          }}
        >
          Chat
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ProfileDisplay", { allData })}
        >
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>
      <GestureHandlerRootView>
        <GestureDetector gesture={swipeGesture}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={user}
            disableComposer={allData.isDeleted || allData.hasBlocked || allData.isBlocked}
            renderInputToolbar={CustomInputToolbar}
            renderMessageImage={renderMessageImage}
            renderBubble={renderBubble}
            renderAvatar={null}
            alwaysShowSend={false}
            keyboardShouldPersistTaps="handled"
            minInputToolbarHeight={44}
            bottomOffset={0}
            maxInputLength={1000}
            placeholder={ placeHolder()}
            isAnimated={false}
            extraData={isKeyboardVisible}
          />
        </GestureDetector>
      </GestureHandlerRootView>

      {/* // allData.isDeleted
              //   ? "You cant reply to this chat because the user deleted their account"
              //   : "Type a message..." */}

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
            <View style={{ flexDirection: "row", gap: horizontalScale(15) }}>
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
      <ImageView
        images={selectedImage || []}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(6),
    alignItems: "center",
    maxHeight: verticalScale(120),
  },
  inputToolbar: {
    flex: 1,
    marginRight: horizontalScale(1),
    borderTopWidth: moderateScale(1),
    borderTopColor: "#ddd",
    borderRadius: theme.borderRadius.lg,
    minHeight: verticalScale(44), // Ensure minimum height
    maxHeight: "auto",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    height: verticalScale(60),
    width: "100%",
    elevation: 4,
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: horizontalScale(10),
    paddingRight: horizontalScale(10),
  },
  headerText: {
    fontWeight: "500",
    fontSize: moderateScale(25),
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: moderateScale(20),
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
    borderRadius: moderateScale(10),
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
    marginBottom: verticalScale(15),
    textAlign: "center",
  },
});

export default ChatDisplay;
