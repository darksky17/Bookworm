import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  Alert,
  ActivityIndicator
} from "react-native";
import { arrayRemove, auth, db, doc, collection, updateDoc, getDoc } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import Container from "../components/Container";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "../design-system/theme/scaleUtils";
import { Button } from "react-native-paper";
import { center } from "@cloudinary/url-gen/qualifiers/textAlignment";



const BlockedUsersScreen = ({ navigation }) => {

  const [blockedUsers, setblockedUsers] = useState([]);
  const [rerendertool, setReRenderTool] = useState(1);   // to re render screen on Like action
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser.uid;
  useEffect(()=>{
   
    const fetchBlocked= async () =>{
    const userdocRef = doc(db, "Users", userId)
    const usersnap = await getDoc(userdocRef);
    const userdata = usersnap.data();

    const idToken = await auth.currentUser.getIdToken();
    
    const userData = await fetch(`${SERVER_URL}/blocked-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        blockedIds: userdata.blockedUsers || [],  // <-- safety check
      }),
    }); 
     
    const data = await userData.json();
    setblockedUsers(data);
};

fetchBlocked();
  
     
     
  }, [rerendertool])

  const unBlockUser = async (item)=>{

   

    Alert.alert(
        "Unblock User?",
        `Are you sure you want to Unblock ${item.displayName}?.`,
        [
          {
            text: "Cancel", 
            onPress: () => {}, 
            style: "cancel" // No action, just closes the alert
          },
          {
            text: "Unblock", 
            onPress: async () => {
                setLoading(true);
              try {
                const userDocRef = doc(db, "Users", userId);
                await updateDoc(userDocRef, {blockedUsers:arrayRemove(item.id)});
                setLoading(false);
                setReRenderTool(prev=>prev+1);
                Alert.alert("User Unlbocked!");
                
                 
  
              } catch(error){
                setLoading(false);
                console.log("Error Unblocking user", error);

            }

         
        
            },
          },
        ]
      );

 
 
}













  return (
    <Container>
        <View style={{flexDirection:"row", alignItems:"center"}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingLeft:horizontalScale(8)}}>
      <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
    </TouchableOpacity>
      <Header title={"Blocked Users"} headerstyle={{width:"100%"}} />
      </View>


 
      <View style={styles.section}>
      <FlatList
  data={blockedUsers}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginHorizontal:theme.spacing.horizontal.xs, padding: theme.spacing.horizontal.md, backgroundColor: theme.colors.background, borderRadius: 2, elevation:2}}>
      <Text style={{ fontSize: theme.fontSizes.medium, color: theme.colors.text, fontWeight:"bold" }}>{item.displayName}</Text>
      <Button mode="contained" buttonColor={theme.colors.primary} onPress={()=>{unBlockUser(item)}}> Unblock </Button> 
    </View>
  )}
  ListEmptyComponent={
  <View style={{marginTop:"50%", justifyContent:"center", alignItems:"center"}}>
  <Text style={{color:theme.colors.muted, fontSize:theme.fontSizes.large}}>No Users Found</Text>

</View>}

/>

    
     
      </View>



 
    </Container>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.muted,
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
  profileHeader: {
    flexDirection: "row",
    gap: horizontalScale(15),
    padding: 15,
  },
  profileImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    borderRadius: moderateScale(50),
  },
  placeholderProfileImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    backgroundColor: "#dfe4ea",
    borderRadius: moderateScale(50),
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: moderateScale(16),
  },
  nameText: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
    color: theme.colors.text,
    fontFamily: theme.fontFamily.bold,
  },

  section: {
    flexDirection: "column",
    flex:1,
    gap: verticalScale(25),
    paddingTop: verticalScale(20),
    paddingBottom:theme.spacing.vertical.xs
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: moderateScale(10),
    alignItems: "center",
  },

  closeModalButton: {
    marginTop: verticalScale(10),
    backgroundColor: theme.colors.primary,
    paddingVertical: verticalScale(5),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(5),
  },
  closeModalText: {
    color: theme.colors.text,
    fontWeight: "bold",
  },
});

export default BlockedUsersScreen;
