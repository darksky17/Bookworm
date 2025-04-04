import React, {useState, useEffect} from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity, ImageBackground } from "react-native"; 
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import Menu from "../components/Menu";

const  ViewProfile = ({route, navigation}) =>{

  const toggleMenu = () => {
    setMenuVisible(prev => !prev); // ✅ This correctly toggles the modal
  };
  const {mateId, mateDisplay, isAscended, mateName } = route.params;
     const [modalState, setModalState] = useState(false);
      let clickedYes = [];
      const [isdisabled, setIsDisabled] = useState(false);
      const [isMenuVisible, setMenuVisible] = useState(false);
    console.log("I ran");
    return(
      <View style={styles.container}>
            
      <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack}>
      <Ionicons name="chevron-back" size={24} color="black" style={{left:5}} />
      </TouchableOpacity>
          <Text style={styles.headerText}>{isAscended ? mateName : mateDisplay}</Text>
          <TouchableOpacity onPress={toggleMenu}>
          <Feather name="more-vertical" size={24} color="black" />
          </TouchableOpacity>
          < Menu visible={isMenuVisible} onClose={toggleMenu}/>
      </View>
      <View style={{flexDirection:"row", justifyContent:"space-evenly", alignItems:"flex-end", height:30, backgroundColor:"lawngreen"}}>
          <Text>Chat</Text>
          <Text style={{fontWeight:"bold"}}>Profile</Text>

      </View>
      </View>
    
 
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
},
header: {
    flexDirection:"row",
    backgroundColor: "lawngreen",
    height: 60,
    width: "100%",
    elevation: 4,
    justifyContent:"space-between",
    alignItems:"center",
    paddingLeft:10,
    paddingRight:10,
    
},
headerText: {
     
    marginTop:"30",
    fontWeight: "500",
    fontSize: 25,
    
    

},
  });
  
export default ViewProfile;