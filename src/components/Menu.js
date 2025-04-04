import React, {useState} from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity} from "react-native"; 
import ViewProfile from "../Screens/ViewProfile";

const Menu = ({ visible, onClose}) => {
  const [profileVisible, setProfileVisible] = useState(false);
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={()=>{}}><Text>View Profile</Text></TouchableOpacity>
          <Text>Unmatch</Text>
          <Text>Block</Text>
          <Text>Report</Text>

  
          
        </View>
      </TouchableOpacity>
      {profileVisible && <ViewProfile/> }
    </Modal>

    
  );
};

export default Menu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    top:60,
    right:5,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    
  },
  modalContent: {
    width: 150,
    height:200,
    padding: 10,
    flexDirection:"column",
    backgroundColor: "lawngreen",
    borderRadius: 10,
    alignItems: "flex-start",
    justifyContent:"space-evenly",
    
  },
  closeButton: {
    marginTop: 20,
    color: "blue",
    fontSize: 18,
  },
});
