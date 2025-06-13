import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setPhoneNumber } from "../redux/userSlice";
import { Text, View, Alert, TextInput, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import auth from "@react-native-firebase/auth"; // Import Firebase auth

import { setDoc, collection, doc, db } from "../Firebaseconfig.js";

import Container from "../components/Container";
import { SERVER_URL } from "../constants/api";

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

      // Sign in with credential
      await auth().signInWithCredential(credential);
      const idToken = await auth().currentUser.getIdToken();
      console.log("OTP verified successfully");
      console.log("Token created:", idToken);
      const userId = auth().currentUser.uid;

      // After OTP is verified, check if the phone number is registered in Firestore
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      const response = await fetch(`${SERVER_URL}/check-user-exists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
        }),
      });
      const data = await response.json();

      const usersRef = collection(db, "Users");

      // const querySnapshot = await fetchUserDataByQuery(
      //   "Users",
      //   where("phoneNumber", "==", fullPhoneNumber)
      // );
      // console.log(querySnapshot.docs.length);

      // if (!querySnapshot.empty && querySnapshot.docs.length > 0){

      if (data.exists) {
        // Existing user
        console.log("How the fuck did I jump in heree??");
        // const userDoc = querySnapshot.docs[0];
        const userData = data.userData;
        console.log(userData);

        if (userData) {
          if (!userData.step1Completed) {
            navigation.navigate("Userdeet1");
          } else if (!userData.step2Completed) {
            navigation.navigate("Userdeet2");
          } else if (!userData.step3Completed) {
            navigation.navigate("AddPhotos");
          } else {
            navigation.replace("MainTabs");
          }
        }
      } else {
        // New user, create a document
        const newUserRef = doc(usersRef, userId);
        await setDoc(newUserRef, {
          phoneNumber: fullPhoneNumber,
          step1Completed: false,
          step2Completed: false,
          step3Completed: false,
          pauseMatch: false,
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
    <View style={{ flex: 1 }}>
      <Container>
        <View
          style={{
            flex: 1,

            paddingBottom: "20%",
          }}
        >
          <View style={{ flex: 1, gap: 70 }}>
            <Text
              style={{
                fontSize: 50,
                fontWeight: "bold",
                color: "lawngreen",
              }}
            >
              What's your number?
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 0.125 }]}
                placeholder="+91"
                value={countryCode}
                onChangeText={(text) => {
                  setCountryCode(text);
                }}
                keyboardType="phone-pad"
                maxLength={5}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumberState(text);
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {verificationId && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </>
            )}
          </View>

          <Button
            onPress={handlePhoneAuth}
            disabled={!phoneNumber || phoneNumber.length < 10 || !countryCode}
            mode="contained"
            labelStyle={{ color: "lawngreen" }}
          >
            SEND OTP
          </Button>

          {verificationId && (
            <Button
              onPress={handleVerifyOtp}
              mode="contained"
              style={{ marginBottom: -50, marginTop: 10 }}
            >
              Verify OTP
            </Button>
          )}
        </View>
      </Container>
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
    padding: 12,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 15,
    fontSize: 16,
  },
});

export default PhoneauthScreen;
