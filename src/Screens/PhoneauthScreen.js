import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPhoneNumber } from '../redux/userSlice';
import { Text, View, Button, Alert, TextInput, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth'; // Import Firebase auth
import { firestore, db } from '../Firebaseconfig'; // Import Firestore
import { collection, getDocs, query, setDoc, doc, where } from '@react-native-firebase/firestore';

const PhoneauthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumberState] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [countryCode, setCountryCode] = useState('+1'); // Default to +1 (U.S.)
  


  // Function to handle phone authentication
  const handlePhoneAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log("Invalid phone number entered");
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;


    try {
      console.log('Attempting to get Firebase Auth instance...');
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      console.log('Phone sign-in success, confirmation:', confirmation);


      setVerificationId(confirmation.verificationId); // Set verification ID
      console.log('Verification ID set:', confirmation.verificationId);

      dispatch(setPhoneNumber(fullPhoneNumber)); // Dispatch the phone number to Redux
      console.log("Dispatching phone number:", fullPhoneNumber);
    } catch (error) {
      console.error('Error during phone authentication:', error);
      Alert.alert('Phone Authentication Error', error.message);
    }
  };

  // Function to verify OTP and check phone number existence
  const handleVerifyOtp = async () => {
    if (!verificationId) {
      console.log('No verification ID available');
      Alert.alert("Verification Error", "No verification ID found.");
      return;
    }

    console.log('Attempting to verify OTP...');
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp); // Create credential
      console.log('Credential created:', credential);

      // Sign in with credential
      await auth().signInWithCredential(credential);
      console.log('OTP verified successfully');
      const userId = auth().currentUser.uid;

      // After OTP is verified, check if the phone number is registered in Firestore
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const usersRef = collection(db, "Users");

      // Check if the user document exists
      const userQuery = query(usersRef, where("phoneNumber", "==", fullPhoneNumber));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        // Existing user
        const userDoc = querySnapshot.docs[0]; // Get the first matching document
        const userData = userDoc.data();

        if (!userData.step1Completed) {
          navigation.navigate("Userdeet1"); // Navigate to Step 1 of the signup process
        } else if (!userData.step2Completed) {
          navigation.navigate("Userdeet2"); // Navigate to Step 2 of the signup process
        } else {
          navigation.replace("MainTabs"); // Navigate to main app (signup complete)
        }
      } else {
        // New user, create a document
        const newUserRef = doc(usersRef, userId); // Auto-generate document ID
        await setDoc(newUserRef, {
          phoneNumber: fullPhoneNumber, // Save phone number as a field
          step1Completed: false, // Default signup steps
          step2Completed: false,
        });

        navigation.navigate("Userdeet1"); // Navigate to Step 1 of the signup process
      }


    



    } catch (error) {
      console.error('Error during OTP verification:', error);
      Alert.alert('OTP Verification Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        value={phoneNumber}
        onChangeText={(text) => {
          console.log("Phone number entered:", text);
          setPhoneNumberState(text); // Using the renamed setter
        }}
        keyboardType="phone-pad"
        maxLength={15}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter country code (e.g. +1, +91)"
        value={countryCode}
        onChangeText={(text) => {
          console.log("Country code entered:", text);
          setCountryCode(text);
        }}
        keyboardType="default"
        maxLength={4}
      />
      <Button
        title="Send OTP"
        onPress={() => {
          console.log('Send OTP button pressed');
          handlePhoneAuth();
        }}
        disabled={!phoneNumber || phoneNumber.length < 10 || !countryCode}
      />

      {verificationId && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={(text) => {
              console.log("OTP entered:", text);
              setOtp(text);
            }}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button title="Verify OTP" onPress={() => {
            console.log('Verify OTP button pressed');
            handleVerifyOtp();
          }} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
  },
});

export default PhoneauthScreen;
