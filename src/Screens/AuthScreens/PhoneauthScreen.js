import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPhoneNumber } from "../../redux/userSlice";
import {
  Text,
  View,
  Alert,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Button } from "react-native-paper";
import auth from "@react-native-firebase/auth"; // Import Firebase auth

import { setDoc, collection, doc, db } from "../../Firebaseconfig.js";

import Container from "../../components/Container.js";
import { SERVER_URL } from "../../constants/api.js";
import Header from "../../components/Header.js";
import theme from "../../design-system/theme/theme.js";
import {
  moderateScale,
  verticalScale,
} from "../../design-system/theme/scaleUtils.js";

const PhoneauthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumberState] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to +91
  const [isVerifying, setIsVerifying] = useState(false);
  const [reSendOtp, setReSendOtp] = useState(true);
  const [verifyPressed, setverifyPressed] = useState(false);
  const [counter, setCounter] = useState(31);

  useEffect(() => {
    if (counter === 0) {
      setReSendOtp(true);
      return;
    } // stop timer at 0

    const intervalId = setInterval(() => {
      setCounter((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId); // cleanup on unmount or reset
  }, [counter]);
  // Function to handle phone authentication
  const handlePhoneAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log("Invalid phone number entered");
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
      return;
    }
    setCounter(30);
    setReSendOtp(false);
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
    setIsVerifying(true);
    setverifyPressed(true);
    // setReSendOtp(false);

    if (!verificationId) {
      console.log("No verification ID available");
      Alert.alert("Verification Error", "No verification ID found.");
      setIsVerifying(false);
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
    setIsVerifying(false);
  };

  return (
    <Container>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30} // tune if needed
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: theme.spacing.vertical.sm,
              paddingBottom: theme.spacing.vertical.xl,
              justifyContent: "space-between",
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: verticalScale(70) }}>
              <Text
                style={{
                  fontSize: moderateScale(50),
                  fontWeight: "bold",
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                }}
              >
                What's your number?
              </Text>
              <View
                style={{ flexDirection: "row", gap: theme.spacing.vertical.sm }}
              >
                <TextInput
                  style={[styles.input, { flex: 0.125 }]}
                  placeholder="+91"
                  value={countryCode}
                  onChangeText={(text) => setCountryCode(text)}
                  keyboardType="phone-pad"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumberState(text)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {verificationId && (
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={(text) => setOtp(text)}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ gap: theme.spacing.vertical.sm }}>
              {verifyPressed && (
                <Text
                  style={{
                    color: theme.colors.text,
                    fontWeight: "bold",
                    fontSize: theme.fontSizes.small,
                  }}
                >
                  Resend OTP in {counter} seconds
                </Text>
              )}
              <Button
                onPress={handlePhoneAuth}
                disabled={
                  !phoneNumber ||
                  phoneNumber.length < 10 ||
                  !countryCode ||
                  isVerifying ||
                  !reSendOtp
                }
                mode="contained"
                buttonColor={theme.colors.primary}
                labelStyle={{
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                  fontWeight: "bold",
                }}
              >
                SEND OTP
              </Button>

              {verificationId && (
                <Button
                  onPress={handleVerifyOtp}
                  mode="contained"
                  disabled={
                    !phoneNumber ||
                    phoneNumber.length < 10 ||
                    !countryCode ||
                    !otp ||
                    otp.length < 6 ||
                    isVerifying
                  }
                  buttonColor={theme.colors.primary}
                  labelStyle={{
                    color: theme.colors.text,
                    fontFamily: theme.fontFamily.bold,
                    fontWeight: "bold",
                  }}
                >
                  Verify OTP
                </Button>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  input: {
    padding: moderateScale(12),
    borderWidth: 2,
    borderColor: "black",
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.fontSizes.medium,
  },
});

export default PhoneauthScreen;
