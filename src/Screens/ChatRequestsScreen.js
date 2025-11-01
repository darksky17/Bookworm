import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  flex,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { auth, db, getDoc, doc, updateDoc, arrayRemove } from "../Firebaseconfig";
import Header from "../components/Header";
import Feather from "@expo/vector-icons/Feather";
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
import { Button } from "react-native-paper";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useQueryClient } from "@tanstack/react-query";



const ChatRequestsScreen = ({ navigation }) => {
  const pause = useSelector((state) => state.user.pauseMatch);
  const gender = useSelector((state) => state.user.gender);
  const [initializing, setInitializing] = useState(true);
  const [chatRequests, setChatRequests] = useState([]);
  const[opeModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState([]);
  const [choice, setChoice] = useState(false);
  const userId = auth.currentUser.uid;
  const [reRenderTool, setReRenderTool] = useState(1);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  useEffect(()=>{

    const fetchChatRequests = async()=>{
        setInitializing(true);
        
        try{
        const userdocRef = doc(db,"Users", userId);
        const userDocsnap = await getDoc(userdocRef);
        const ChatReq = userDocsnap.data().chatRequests || [];
        setChatRequests(ChatReq);
        } catch(e){
            console.log("Error fetching chat requests", e);
        }

        setInitializing(false);
    }

    fetchChatRequests();
  }, [userId, reRenderTool]);

 

  const InitialIcon = ({ initials }) => {
    return (
      <View
        style={{
          backgroundColor: "blue",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          width: 32,
          height: 32,
          overflow: "hidden",
        }}
      >
         
        
          <Text
            style={{
              color: "white",
              fontSize: theme.fontSizes.large,
              fontFamily: theme.fontFamily.regular,
            }}
          >
            {initials}
          </Text>
       
      </View>
    );
  };

  const newChat = async (friendId) => {
    

    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch(`${SERVER_URL}/new-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        friendId: friendId,
      }),
    });

    return response.ok;
  };

  const handleChoice = async()=>{
    setProcessing(true);
    const userDocRef = doc(db,"Users", auth.currentUser.uid);
    const chatRequestToRemove = {
        requestorId: selectedItem.requestorId,
        displayName: selectedItem.displayName, 
        introMessage: selectedItem.introMessage, 
      };
    if(choice){
    const chat_formed = await newChat(selectedItem.requestorId);
    

    if(chat_formed){
       

        try{           
            await updateDoc(userDocRef,{chatRequests:arrayRemove(chatRequestToRemove)});
            setOpenModal(false);
            Alert.alert("Chat Formed");
            queryClient.invalidateQueries(["chats"]);

        } catch(e){
            console.log("error while removing object from ChatRequests",e);
            
        }

    }
} else{
    try{           
        await updateDoc(userDocRef,{chatRequests:arrayRemove(chatRequestToRemove)});
        setOpenModal(false);
        Alert.alert("Request Rejected");

    } catch(e){
        console.log("error while removing object from ChatRequests",e);
        
    }

}
setReRenderTool(10);
setProcessing(false);

    
  }

  
 






  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }


  return (
    <Container>
      <Header title={"Chat Requests"} headerstyle={{width:"100%"}} />
 

      {chatRequests.length === 0 ? (
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
                padding:theme.spacing.horizontal.md
              }}
            >
              You have no chat requests as of  now. How about you read a book?
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
        <View style={{ flex: 1 }}>
     
          <FlatList
            style={styles.chatListContainer}
            data={chatRequests}
            keyExtractor={(item) => item.requestorId}
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
                      initials={item.displayName?.[0]}
                    />

                    <Pressable
                      style={{
                        paddingLeft: theme.spacing.horizontal.xs,
                        flexShrink: 1,
                        flexGrow: 1,
                      }}
                      onPress={() =>{navigation.navigate("DisplayProfile", {userId: item.requestorId})} }                   
                      
                      
                    >
                      <View
                        style={{
                          flexShrink: 1,
                          flexGrow: 1,
                          gap: verticalScale(1),
           
                        }}
                      >
                        <Text style={styles.chatText}>
                          {item.displayName } 
                         </Text>
                      <Text style={{            
                              fontSize: theme.fontSizes.small,
                              color: "gray",
                              fontWeight: "bold",
                              flexShrink: 1,
                              flexGrow: 1,
                              overflow: "hidden",
                              paddingLeft: theme.spacing.horizontal.sm,}}>{item.introMessage}</Text>
                      </View>
                    </Pressable>
                  </View>

                  {/* RIGHT SIDE */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginLeft: horizontalScale(10),
                      gap:horizontalScale(20)
                    }}
                  ><Pressable disabled={opeModal} onPress={()=>{setChoice(false);setOpenModal(true); setSelectedItem(item)}}>
                    <AntDesign name="close-circle" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Pressable disabled={opeModal} onPress={()=>{setChoice(true);setOpenModal(true); setSelectedItem(item)}}>
                  <AntDesign  name="check-circle" size={24} color={theme.colors.text} />
                  </Pressable>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={{ gap: verticalScale(1) }}
          />

<Modal
        transparent={true}
        visible={opeModal}
        animationType="slide"
        onRequestClose={() => setOpenModal(false)}
        
      >
        <View
          style={{
            padding: 20,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.unmatchModal}>
            <Text> {choice ? `Are you sure you want to start a chat with ${selectedItem.displayName}?`: `Are you sure you want to reject chat request from ${selectedItem.displayName}?`}</Text>
            <View style={{ flexDirection: "row", gap: horizontalScale(30) }}>
              <Button
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                mode="contained"
                onPress={handleChoice}
                disabled={processing}
              >
                <Text>Yes</Text>
              </Button>
              <Button
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                mode="contained"
                onPress={() => setOpenModal(false)}
                disabled={processing}
              >
                <Text>No</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  unmatchModal: {
    padding: 20,
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "snow",
    elevation: 3,
    borderRadius: moderateScale(10),
  },
});
export default ChatRequestsScreen;
