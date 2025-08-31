import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TextInput } from "react-native";
import { Button } from "react-native-paper";
import { ReportProfile } from "../utils/makereport";
import { moderateScale, horizontalScale, verticalScale} from "../design-system/theme/scaleUtils";
import {collection, db, addDoc, arrayUnion, auth} from "../Firebaseconfig";
import theme from "../design-system/theme/theme";
import { SERVER_URL } from "../constants/api";
const ChatRequestModal = ({ visible, onClose, targetId, displayName, reRender}) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const idToken = await auth.currentUser.getIdToken();

    try{
      
       const response = await fetch(`${SERVER_URL}/chat-request`,{
        method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              targetId: targetId,
              introMessage: message,
              displayName: displayName,
            }),

       });
  if(response.ok){
    console.log("Request created");
    onClose();
    reRender();
  }
  
    } catch(e){
       console.log("There was a problem while creating reques in the modal", e);
    }


    setSubmitting(false);
    setMessage("");

  };

  return (
    <Modal transparent ={true} visible={visible} animationType="slide" onRequestClose={onClose}>
            <View
          style={{
            padding: 20,
            flex:1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
     
  <View style={styles.unmatchModal}>
    
    <View style={{gap:15}}>
  <Text>Want to start a chat with {displayName} ?</Text>
  <Text> Write them a short message and see if they approve.</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        multiline
        style={{ marginBottom: 10, borderWidth:1, borderRadius:10, padding:10 }}
        maxLength={50}

      />
      </View>
         <View style={{ flexDirection: "row", gap: horizontalScale(30) }}>
         <Button mode="contained"  buttonColor={theme.colors.primary}
                textColor={theme.colors.text} onPress={handleSubmit} disabled={submitting}>
          Submit
        </Button>

        <Button onPress={()=>{setMessage("");onClose()}}  buttonColor={theme.colors.primary}
                textColor={theme.colors.text} mode="contained" disabled={submitting}>
          Cancel
        </Button>
            </View>
            </View>
            </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
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

export default ChatRequestModal;