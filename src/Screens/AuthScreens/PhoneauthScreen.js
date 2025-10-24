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
  Image
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
  horizontalScale
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
  const [otpSent, setOTPSent] = useState(false);
  const [otpPressed, setOtpPressed]= useState(false);
  const[disableVerify, setDisableVerify] = useState(false);

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
      setCounter(0);
      setReSendOtp(true);
    }
    setOTPSent(true);
    setOtpPressed(true);

    if(auth().currentUser){
      console.log("This is auth currentuser", auth().currentUser);
      setDisableVerify(true);
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
    
      console.log("OTP verified successfully");
      
 
      
    } catch (error) {
      console.error("Error during OTP verification:", error);
      Alert.alert("OTP Verification Error", error.message);
      setIsVerifying(false);
    }
 setTimeout(()=>{
    setIsVerifying(false);
  }, 3000);

  };

  return (
    <Container>
      {isVerifying?(<>
            <View style={{flex:1, backgroundColor:"white", justifyContent:"center", alignItems:"center"}}>
              <Text style={{color:theme.colors.text}}>WE ARE PROCESSING</Text>
              <Image
                  source={require("../../assets/AuthGIf.gif")} 
                  style={{
                    width: horizontalScale(200),
                    height: verticalScale(270),
                    borderRadius: theme.borderRadius.sm,
                  }}
                  resizeMode="contain"
                />
              </View>    
      </>)
      :(
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
              {otpPressed && (
                <Text
                  style={{
                    alignSelf:"center",
                    color: theme.colors.text,
                    fontWeight: "bold",
                    fontSize: theme.fontSizes.small,
                  }}
                >
                  Didnt get the code? Resend OTP in {counter} seconds
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
                {!otpSent?"SEND OTP":"RESEND OTP"}
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
                    isVerifying || 
                    disableVerify
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
      )}
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
