import * as React from 'react';
import { Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'; // Correct container
import { createNativeStackNavigator } from '@react-navigation/native-stack';



function SignupScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Signup Screen</Text>
       <Button title= "Back to Home"
      onPress={() => navigation.goBack()}
      color="lightgreen" />
    </View>
  );
}


export default SignupScreen;