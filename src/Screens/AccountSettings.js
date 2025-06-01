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
import { setUserState, setAgeRange, setDistance } from "../redux/userSlice";
import Slider from "@react-native-community/slider";
import {
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import RangeSlider from "../components/Slider";
import Header from "../components/Header";
import { Button } from "react-native-paper";
const AccountSettings = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  const dispatch = useDispatch();
  const unsubscribeRef = useRef(null);
  const { ageMin, ageMax } = useSelector((s) => s.user);
  const [localMin, setLocalMin] = useState(ageMin);
  const [localMax, setLocalMax] = useState(ageMax);
  const reduxDistance = useSelector((state) => state.user.distance);
  const [value, setValue] = useState(reduxDistance ?? 10);

  const handleSave = async () => {
    dispatch(setAgeRange({ min: localMin, max: localMax }));

    await updateDoc(doc(db, "Users", auth().currentUser.uid), {
      ageMin: localMin,
      ageMax: localMax,
      distance: value,
    });
    navigation.goBack();
  };
  const handleValuesChange = (min, max) => {
    setLocalMin(min);
    setLocalMax(max);
  };
  // useEffect(() => {
  //   // Get the current user's phone number
  //   const userPhoneNumber = auth().currentUser?.phoneNumber;
  //   const userId = auth().currentUser.uid;

  //   // Check if the phone number is valid
  //   if (!userPhoneNumber) return;

  //   userDocRef = doc(db, "Users", userId);

  // Set up a Firestore listener for real-time updates
  //   const unsubscribe = onSnapshot(
  //     userDocRef,
  //     (docSnap) => {
  //       if (docSnap.exists()) {
  //         setUserData(docSnap.data()); // Update local state with real-time data
  //         //console.log('Real-time user data:', doc.data());
  //         const { lastUpdated, ...updatedData } = docSnap.data();
  //         dispatch(setUserState(updatedData));
  //       } else {
  //         console.warn("No user data found for this phone number.");
  //         setUserData(null);
  //         dispatch(setUserState({}));
  //       }
  //     },
  //     (error) => {
  //       console.error("Error fetching real-time updates:", error);
  //       Alert.alert(
  //         "Error",
  //         "Failed to fetch real-time updates from Firestore."
  //       );
  //     }
  //   );

  //   unsubscribeRef.current = unsubscribe;

  //   // Cleanup listener on unmount
  //   return () => {
  //     if (unsubscribeRef.current) {
  //       unsubscribeRef.current();
  //     }
  //   };
  // }, []);

  const Myuser = useSelector((state) => state.user);

  // if (!userData) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <Text style={styles.loaderText}>Loading your profile...</Text>
  //     </View>
  //   );
  // }

  return (
    <View>
      <Header title={"Enter Your Prefrences"} />
      <View style={{ padding: 20, paddingTop: 25, gap: 40 }}>
        <View style={{ gap: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18 }}>
            How old should your new friend be?
          </Text>
          <View style={styles.chipContainer}>
            <View
              style={{
                paddingHorizontal: 10,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Between {localMin} and {localMax}
              </Text>
            </View>

            <RangeSlider
              initialMin={ageMin}
              initialMax={ageMax}
              onValuesChange={handleValuesChange}
            />
          </View>
        </View>
        <View style={{ gap: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18 }}>
            How close do you want them to yourself?
          </Text>
          <View style={styles.chipContainer}>
            <View
              style={{
                paddingHorizontal: 10,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Upto {Myuser.distance} Kilometers away
              </Text>
            </View>

            <Slider
              minimumValue={10}
              maximumValue={100}
              value={Myuser.distance}
              onValueChange={(val) => setValue(val)}
              onSlidingComplete={(val) => dispatch(setDistance(val))}
              step={1}
            />
          </View>
        </View>
        <Button mode="contained" onPress={handleSave}>
          Save Settings
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 80,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderBlock: {
    flex: 1,
    paddingHorizontal: 0, // No spacing between blocks
  },
  sliderLabel: {
    textAlign: "center",
    marginBottom: 5,
  },
  slider: {
    width: "100%",
    height: 40,
  },

  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
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
