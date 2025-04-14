import React, { useState, useEffect } from "react";
import { View, Modal, TouchableOpacity, StyleSheet, Text, Button, FlatList, flex, Pressable, Image } from "react-native";
import auth from '@react-native-firebase/auth';
import { doc, collection, query, where, getDocs, setDoc, getDoc } from "@react-native-firebase/firestore";
import { firestore, db } from "../Firebaseconfig";
//import ChatDisplay from "./chatScreen";
import Header from "../components/Header";
import Feather from '@expo/vector-icons/Feather';
import Container from "../components/Container";







const ChatScreenList = ({ navigation }) => {

    const userId = auth().currentUser.uid;

   const [chats, setChats] = useState([]);
   let otherUserId = [];
    let p = 0;

  

    const fetchFriends = async (uids) => {

        
        const userDocs = [];
        let batchSize = 10;

        for (let i = 0; i < uids.length; i = +batchSize) {
            const batch = uids.slice(i, i + batchSize);


            const promises = batch.map(uid => getDoc(doc(db, "Users", uid)));

            const batchResults = await Promise.all(promises);



            batchResults.forEach(snapshot => {

                if (snapshot._exists) {

                    userDocs.push({ id: snapshot.id, ...snapshot.data() });
                }
            });
        }


        return userDocs;
    };

    const fetchChatDocsbyID = async (userId) => {
        let chatData = [];


        const chatRef = collection(db, "Chats");
        const chatRefQuery = query(chatRef, where('participants', 'array-contains', userId));

        const chatRefDocs = await getDocs(chatRefQuery);
        if (chatRefDocs.empty) {
            console.log("No chats found.");
             // Clear the list if no chats exist
        } else {
            chatData = chatRefDocs.docs.map(doc => ({
                id: doc.id, // Firestore document ID
                ...doc.data() // Spread document fields
            }));


           
        }

         otherUserId = chatData.map(chat => chat.participants.find(id => id !== userId)).filter(Boolean);
       
         
         friendDocs = await fetchFriends(otherUserId);

         const updatedFriendDocs = friendDocs.map(user => {
            // Find a chat where the user is a participant
            const chat = chatData.find(chat => chat.participants.includes(user.id));
        
            // Return a new user object with the `ascended` property added
            return {
                ...user,
                ascended: chat ? chat.ascended : null // If chat exists, use `ascended`, otherwise set to null
            };
        });
         setChats(updatedFriendDocs);
         console.log(updatedFriendDocs);
    
        

    };

    const InitialIcon = ({ initials, ascended, photo }) => {
        return (
            <View
                style={{
                    backgroundColor: 'blue',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    overflow:"hidden",
                }}>
               

                {ascended && photo ? (
                <Image
                    source={{ uri: photo }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
            ) : (
                <Text style={{ color: 'white', fontSize: 20 }}>{initials}</Text>
            )}
            </View>
        );
    };

    const AscendIcon = ({value}) =>{
        
        if(value){
            
            if (!value) return null; // Return nothing if value is false

           
        
            return (  
                <View style={{display:'flex', justifyContent:"flex-end", marginLeft:10}}>  

                    <Feather name="chevrons-up" size={24} color="limegreen" />
            
                </View>
            );
            
        }

        else return;
    
    };
 

    useEffect(() => {
        fetchChatDocsbyID(userId);
    }, [userId]);


    return (
    

   <View style={styles.container}>
            <Header title={"Chats"} />
            <FlatList style={styles.chatListContainer}
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.chatlistbg}>
                        <View style={styles.chatRow}>
                           
                            <InitialIcon ascended={item.ascended} 
                                         photo={item.photos[0]} 
                                         initials={item.displayName?.[0]} />
                            <Pressable onPress={() => navigation.navigate("ChatDisplay", { allData:item })} >
                                <Text style={styles.chatText}>{item.ascended? item.name : item.displayName}
                                </Text>
                            </Pressable>
                             <AscendIcon value={item.ascended} />
                        </View>
                    </View>
                )} />

                





        </View>
    


    );
}

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
        marginBottom: 10,
        borderRadius: 1,


    },

    chatRow: {
        flexDirection: "row", // Aligns icon & text horizontally
        alignItems: "center", // Keeps them centered
    },

    chatText: {
        color: "black", // White text for better contrast
        fontSize: 16,
        fontWeight: "bold",
        paddingLeft: 10


    },
});
export default ChatScreenList;