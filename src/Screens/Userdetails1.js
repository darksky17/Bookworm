import React, { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  setName,
  setEmail,
  setDateOfBirth,
  setGender,
} from "../redux/userSlice";
import { Picker } from "@react-native-picker/picker";
import auth from "@react-native-firebase/auth";
import moment from "moment";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  setDoc,
} from "@react-native-firebase/firestore";
import {
  fetchUserDataByQuery,
  fetchUserDataById,
} from "../components/FirestoreHelpers";

const Screen1 = ({ navigation }) => {
  const dispatch = useDispatch();

  const [name, setNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGenderState] = useState("");

  const phoneNumber = auth().currentUser?.phoneNumber;
  const userId = auth().currentUser.uid;

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
      querySnapshot = await fetchUserDataByQuery(
        "Users",
        where("displayname", "==", displayName)
      );

      if (querySnapshot.empty) {
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
    <View style={styles.container}>
      <View
        style={{
          alignItems: "center",
          fontWeight: "bold",
          paddingHorizontal: 10,
        }}
      >
        <Text style={{ fontSize: 34, color: "lawngreen" }}>
          Tell Us About Yourself
        </Text>
      </View>
      <View style={{ flex: 1, gap: 40 }}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setNameState}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmailState}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Date of Birth (DD/MM/YYYY):</Text>
        <View style={styles.dateInputContainer}>
          <TextInput
            style={[styles.dateInput, styles.dayInput]}
            placeholder="DD"
            value={day}
            onChangeText={(value) =>
              setDay(value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            keyboardType="numeric"
          />
          <Text style={styles.separator}>/</Text>
          <TextInput
            style={[styles.dateInput, styles.monthInput]}
            placeholder="MM"
            value={month}
            onChangeText={(value) =>
              setMonth(value.replace(/[^0-9]/g, "").slice(0, 2))
            }
            keyboardType="numeric"
          />
          <Text style={styles.separator}>/</Text>
          <TextInput
            style={[styles.dateInput, styles.yearInput]}
            placeholder="YYYY"
            value={year}
            onChangeText={(value) =>
              setYear(value.replace(/[^0-9]/g, "").slice(0, 4))
            }
            keyboardType="numeric"
          />
        </View>

        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGenderState(itemValue)}
        >
          <Picker.Item label="Select gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>
      <View>
        <Button mode="contained" onPress={validateAndContinue}>
          Continue
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "snow",
    gap: 100,
    paddingBottom: 40,
  },
  input: {
    height: 70,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,

    paddingLeft: 10,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    textAlign: "center",
    height: 50,
  },
  dayInput: {
    width: 60,
  },
  monthInput: {
    width: 60,
  },
  yearInput: {
    width: 100,
  },
  separator: {
    fontSize: 18,
    marginHorizontal: 5,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});

export default Screen1;
