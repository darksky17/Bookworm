import { View, StyleSheet, Text } from "react-native";

export default Header = ({title}) => {
   return( 
  <View style={styles.header}>
 
         <Text style={styles.headerText}>{title}
             </Text>
     </View>
   );
}


const styles = StyleSheet.create({
   
    container:{
        flex:1,
    },

    header:{
    backgroundColor:"lawngreen",
    height: 60,
    width:"100%",
    elevation:4,

    },
    headerText:{
        position:"absolute",
        bottom:0,
        fontWeight:"medium",
        fontSize:35,
    },
});
