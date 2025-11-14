import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  setName,
  setEmail,
  setDateOfBirth,
  setGender,
} from "../../redux/userSlice.js";

import moment from "moment";

import { auth, updateDoc, where, setDoc } from "../../Firebaseconfig.js";
import {
  fetchUserDataByQuery,
  fetchUserDataById,
} from "../../components/FirestoreHelpers.js";
import { SERVER_URL } from "../../constants/api.js";
import Header from "../../components/Header.js";
import Container from "../../components/Container.js";
import theme from "../../design-system/theme/theme.js";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../../design-system/theme/scaleUtils.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";

const Screen1 = ({ navigation }) => {
  
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [name, setNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGenderState] = useState("");
  const monthRef = useRef(null);
  const yearRef= useRef(null);
  const phoneNumber = auth.currentUser?.phoneNumber;
  const userId = auth.currentUser.uid;

  const generateRandomDisplayName = async () => {
    const adjectives = [
      "Mysterious",
      "Curious",
      "Enthusiastic",
      "Witty",
      "Adventurous",
      "Charming",
    ];
    const nouns = [
      "Reader",
      "Bookworm",
      "Storyteller",
      "Bibliophile",
      "PageTurner",
      "Wordsmith",
    ];

    let displayName = `${
      adjectives[Math.floor(Math.random() * adjectives.length)]
    }${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(
      100 + Math.random() * 900
    )}`;

    // Ensure uniqueness in Firestore
    let nameExists = true;
    while (nameExists) {
      // querySnapshot = await fetchUserDataByQuery(
      //   "Users",
      //   where("displayname", "==", displayName)
      // );
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SERVER_URL}/check-user-exists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: displayName,
          includeData: false,
        }),
      });
      const data = await response.json();
    
      // if (querySnapshot.empty) {
      if (data.exists === false || data.exists === "false") {
        nameExists = false;
      } else {
        // Generate a new one if duplicate exists
        displayName = `${
          adjectives[Math.floor(Math.random() * adjectives.length)]
        }${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(
          100 + Math.random() * 900
        )}`;
      }
    }

    return displayName;
  };

  const validateAndContinue = async () => {
    if (!email || !name || !day || !month || !year || !gender) {
      Alert.alert("Error", "All fields must be filled!");
      return;
    }

    const dateOfBirth = `${day}/${month}/${year}`;
    const formattedDOB = `${year}-${month}-${day}`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email format");
      return;
    }

    if (!moment(formattedDOB, "YYYY-MM-DD", true).isValid()) {
      Alert.alert("Error", "Invalid date. Please enter a valid date.");
      return;
    }

    const age = moment().diff(moment(formattedDOB, "YYYY-MM-DD"), "years");
    if (age < 18) {
      Alert.alert("Error", "You must be at least 18 years old.");
      return;
    }

    dispatch(setName(name));
    dispatch(setEmail(email));
    dispatch(setDateOfBirth(dateOfBirth));
    dispatch(setGender(gender));

    if (!phoneNumber) {
      Alert.alert("Error", "Phone number is missing.");
      return;
    }

    try {
      const displayName = await generateRandomDisplayName();
      const payload = {
        name: name || "Unknown",
        email: email || "Unknown",
        gender: gender,
        dateOfBirth: formattedDOB || "Not specified",
        displayName,
      };

      const { userDocSnap, userDocRef } = await fetchUserDataById(userId);

      if (userDocSnap.exists) {
        // Update the document
        await setDoc(userDocRef, payload, { merge: true });
        console.log("Firestore write successful.");

        // Update step1Completed and navigate to Userdeet2
        await updateDoc(userDocRef, {
          step1Completed: true,
        });
        navigation.navigate("Userdeet2");
      } else {
        Alert.alert(
          "Error",
          "No user document found. Please restart the signup process."
        );
      }
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      Alert.alert("Error", "Failed to save user data.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
             <View
                style={{
                  alignItems: "center",
                  fontWeight: "bold",
                  paddingHorizontal: horizontalScale(10),
                  marginTop:insets.top
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSizes.title,
                    color: theme.colors.text,
                    fontFamily: theme.fontFamily.bold,
                    fontWeight: "bold",
                  }}
                >
                  Tell Us About Yourself
                </Text>
              </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Container>
            {/* <Header title={"Tell Us About Yourself"} /> */}
            <View style={styles.container}>
       
              <View style={{ flex: 1, gap: verticalScale(40) }}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setNameState}
                  placeholderTextColor={theme.colors.text}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmailState}
                  keyboardType="email-address"
                  placeholderTextColor={theme.colors.text}
                />

                <Text style={styles.label}>Date of Birth (DD/MM/YYYY):</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.dateInput, styles.dayInput]}
                    placeholder="DD"
                    maxLength={2}
                    value={day}
                    onChangeText={(value) =>{
                      setDay(value.replace(/[^0-9]/g, "").slice(0, 2)); if(value.length>1){
                      monthRef.current.focus();
                      }}
                    }
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.text}
                  />
                  <Text style={styles.separator}>/</Text>
                  <TextInput
                  ref={monthRef}
                    style={[styles.dateInput, styles.monthInput]}
                    placeholder="MM"
                    maxLength={2}
                    value={month}
                    onChangeText={(value) =>{
                      setMonth(value.replace(/[^0-9]/g, "").slice(0, 2));
                     if(value.length>1){
                      yearRef.current.focus();
                     }
                    }
                    }
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.text}
                  />
                  <Text style={styles.separator}>/</Text>
                  <TextInput
                  ref={yearRef}
                    style={[styles.dateInput, styles.yearInput]}
                    placeholder="YYYY"
                    maxLength={4}
                    value={year}
                    onChangeText={(value) =>
                      setYear(value.replace(/[^0-9]/g, "").slice(0, 4))
                    }
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.text}
                  />
                </View>


                <Dropdown data={[{label:"Male", value:"male"}, {label:"Female", value:"female"}, {label:"Other", value:"other"}]}
          style={{borderRadius:10, borderWidth:1, padding:12}}
          onChange={(item)=>{setGenderState(item.value)}}
          placeholder="Select Gender"
          labelField="label"
          valueField="value"
          selectedTextStyle={{fontWeight:"bold"}}
          containerStyle={{borderRadius:10}}
          activeColor={theme.colors.primary}
          value={gender}
          maxHeight={300}/>

              </View>
              <View>
                <Button
                  mode="contained"
                  buttonColor={theme.colors.primary}
                  labelStyle={{ color: theme.colors.text }}
                  onPress={validateAndContinue}
                >
                  Continue
                </Button>
              </View>
            </View>
          </Container>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
    gap: 80,
    paddingBottom: verticalScale(40),
  },
  input: {
    height: verticalScale(70),
    borderColor: theme.colors.text,
    borderWidth: 2,
    borderRadius: moderateScale(10),
    paddingLeft: horizontalScale(10),
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInput: {
    borderColor: theme.colors.text,
    borderWidth: 2,
    textAlign: "center",
    height: verticalScale(50),
    borderRadius: theme.borderRadius.sm,
  },
  dayInput: {
    width: horizontalScale(60),
  },
  monthInput: {
    width: horizontalScale(60),
  },
  yearInput: {
    width: horizontalScale(100),
  },
  separator: {
    fontSize: moderateScale(18),
    marginHorizontal: horizontalScale(5),
  },
  label: {
    marginBottom: verticalScale(5),
    fontSize: theme.fontSizes.medium,
    fontWeight: "bold",
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: verticalScale(10),
  },
});

export default Screen1;
