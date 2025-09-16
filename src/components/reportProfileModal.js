import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TextInput } from "react-native";
import { Button } from "react-native-paper";
import { ReportProfile } from "../utils/makereport";
import { moderateScale, horizontalScale, verticalScale} from "../design-system/theme/scaleUtils";
import theme from "../design-system/theme/theme";
const ReportProfileModal = ({ visible, onClose, targetId, type }) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    setSubmitting(true);
    const response = await ReportProfile(targetId, message, type);

    if (response.error) {
      alert(response.error);
      onClose();
    } else {
        
      alert(response.message || "Report submitted.");
      onClose(); // Close modal after submission
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
  <Text>Why do you want to report this {type}</Text>
      <TextInput
        label="Report Reason"
        value={message}
        onChangeText={setMessage}
        multiline
        style={{ marginBottom: 10, borderWidth:1, borderRadius:10, padding:10 }}
      />
      </View>
         <View style={{ flexDirection: "row", gap: horizontalScale(30) }}>
         <Button mode="contained"  buttonColor={theme.colors.primary}
                textColor={theme.colors.text} onPress={handleReport} disabled={submitting}>
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

export default ReportProfileModal;