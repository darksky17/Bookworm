import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setPhoneNumber } from "../redux/userSlice";
import { Text, View, Button, Alert, TextInput, StyleSheet } from "react-native";
import auth from "@react-native-firebase/auth"; // Import Firebase auth
import { firestore, db } from "../Firebaseconfig"; // Import Firestore
import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  where,
} from "@react-native-firebase/firestore";
import { fetchUserDataByQuery } from "../components/FirestoreHelpers";
import { current } from "@reduxjs/toolkit";

const PhoneauthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumberState] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to +91

  // Function to handle phone authentication
  const handlePhoneAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log("Invalid phone number entered");
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);

      setVerificationId(confirmation.verificationId); // Set verification ID

      dispatch(setPhoneNumber(fullPhoneNumber)); // Dispatch the phone number to Redux
    } catch (error) {
      Alert.alert("Phone Authentication Error", error.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId) {
      console.log("No verification ID available");
      Alert.alert("Verification Error", "No verification ID found.");
      return;
    }

    console.log("Attempting to verify OTP...");
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp); // Create credential
      console.log("Credential created:", credential);

      // Sign in with credential
      await auth().signInWithCredential(credential);
      console.log("OTP verified successfully");
      const userId = auth().currentUser.uid;

      // After OTP is verified, check if the phone number is registered in Firestore
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const usersRef = collection(db, "Users");

      const querySnapshot = await fetchUserDataByQuery(
        "Users",
        where("phoneNumber", "==", fullPhoneNumber)
      );

      if (!querySnapshot.empty) {
        // Existing user
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (!userData.step1Completed) {
          navigation.navigate("Userdeet1");
        } else if (!userData.step2Completed) {
          navigation.navigate("Userdeet2");
        } else {
          navigation.replace("MainTabs");
        }
      } else {
        // New user, create a document
        const newUserRef = doc(usersRef, userId);
        await setDoc(newUserRef, {
          phoneNumber: fullPhoneNumber,
          step1Completed: false,
          step2Completed: false,
          currentMatches: [],
        });

        navigation.navigate("Userdeet1");
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
      Alert.alert("OTP Verification Error", error.message);
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
          console.log("Send OTP button pressed");
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
          <Button
            title="Verify OTP"
            onPress={() => {
              console.log("Verify OTP button pressed");
              handleVerifyOtp();
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
  },
});

export default PhoneauthScreen;
