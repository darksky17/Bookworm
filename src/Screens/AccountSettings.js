import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { db } from "../Firebaseconfig";
import moment from "moment";
import auth from "@react-native-firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { setUserState } from "../redux/userSlice";
import Slider from "@react-native-community/slider";
import { onSnapshot, doc, deleteDoc } from "@react-native-firebase/firestore";

import {
  Switch,
  Modal as PModal,
  Portal,
  PaperProvider,
} from "react-native-paper";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Header from "../components/Header";
const AccountSettings = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  const dispatch = useDispatch();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Get the current user's phone number
    const userPhoneNumber = auth().currentUser?.phoneNumber;
    const userId = auth().currentUser.uid;

    // Check if the phone number is valid
    if (!userPhoneNumber) return;

    userDocRef = doc(db, "Users", userId);

    // Set up a Firestore listener for real-time updates
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists) {
          setUserData(docSnap.data()); // Update local state with real-time data
          //console.log('Real-time user data:', doc.data());
          const { lastUpdated, ...updatedData } = docSnap.data();
          dispatch(setUserState(updatedData));
        } else {
          Alert.alert("Error", "No user data found for this phone number.");
        }
      },
      (error) => {
        console.error("Error fetching real-time updates:", error);
        Alert.alert(
          "Error",
          "Failed to fetch real-time updates from Firestore."
        );
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const Myuser = useSelector((state) => state.user);
  const calculateAge = (birthdate) => {
    if (!birthdate) return "N/A";
    const birthMoment = moment(birthdate, "DD/MM/YYYY");
    if (!birthMoment.isValid()) return "N/A";
    const age = moment().diff(birthMoment, "years");
    return age;
  };

  if (!userData) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Loading your profile...</Text>
      </View>
    );
  }

  const {
    name,
    dateOfBirth,
    gender,
    photos = [],
    favGenres,
    favAuthors,
  } = userData;
  const profilePicture = photos[0] || null;

  const SettingsRow = ({ icon, iconLibrary: Icon, label, rightComponent }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={24} color="black" />
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{label}</Text>
      </View>
      {rightComponent}
    </View>
  );

  return (
    <View>
      <Header title={"Enter Your Prefrences"} />
      <View style={{ padding: 10 }}>
        <View style={styles.chipContainer}>
          <View
            style={{
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              How old should your new friend be?
            </Text>
          </View>

          <Slider
            style={{ width: 200, height: 40 }}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 80,
  },
  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 20,
    gap: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: 18,
    color: "#555",
  },
  unmatchModal: {
    padding: 20,
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "snow",
    elevation: 3,
    borderRadius: 10,
  },
  profileHeader: {
    flexDirection: "row",
    gap: 15,
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderProfileImage: {
    width: 100,
    height: 100,
    backgroundColor: "#dfe4ea",
    borderRadius: 50,
  },
  placeholderText: {
    color: "#7f8c8d",
    fontSize: 16,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  ageText: {
    fontSize: 18,
    color: "#636e72",
  },
  genderText: {
    fontSize: 18,
    color: "#636e72",
    marginTop: 5,
  },
  section: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    gap: 25,
    borderRadius: 10,
    padding: 10,
    paddingTop: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2d3436",
  },
  infoText: {
    fontSize: 16,
    color: "#2d3436",
  },
  photo: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  button: {
    backgroundColor: "#2d98da",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: "#eb4d4b",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  closeModalButton: {
    marginTop: 10,
    backgroundColor: "#2d98da",
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeModalText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default AccountSettings;
