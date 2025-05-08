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
import axios from "axios"; // Add axios for API calls
import { onSnapshot, doc, deleteDoc } from "@react-native-firebase/firestore";
import { SERVER_URL } from "../constants/api";
import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import { Button } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";
import {
  Switch,
  Modal as PModal,
  Portal,
  PaperProvider,
} from "react-native-paper";
import FontAwesome from "@expo/vector-icons/FontAwesome";
const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // Delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState(""); // Confirmation text input
  const [selectedImage, setSelectedImage] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);
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

  const handleDeleteProfile = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      console.log(deleteConfirmation);
      Alert.alert("Error", 'You must type "delete" to confirm.');
      return;
    }

    try {
      const userId = auth().currentUser.uid;

      const folderName = userId; // Assuming folder name follows a user-specific naming convention
      const response = await axios.post(`${SERVER_URL}/delete-profile`, {
        folderName: folderName,
      });

      console.log("Cloudinary folder deletion response:", response.data);

      unsubscribeRef.current();
      console.log("Now my listner should stop listening");
      // Delete the user document from Firestore
      await deleteDoc(doc(db, "Users", userId));
      console.log("User profile deleted successfully.");

      // Sign the user out
      await auth().signOut();
      console.log(
        "Sign out was also conducted smoothly, now its time to show the alert"
      );

      Alert.alert("Success", "Your profile has been deleted.");
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error deleting profile:", error);
      Alert.alert("Error", "Failed to delete profile. Please try again later.");
    } finally {
      setDeleteModalVisible(false);
      setDeleteConfirmation("");
    }
  };

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

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

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
    <Container>
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profilePicture }}
            style={styles.profileImage}
            onError={(e) =>
              console.error(
                "Error loading profile picture:",
                e.nativeEvent.error
              )
            }
          />

          <View
            style={{
              flexDirection: "column",
              gap: 10,
              width: "full",
              marginTop: 10,
            }}
          >
            <Text style={styles.nameText}>
              {Myuser.name}, {calculateAge(Myuser.dateOfBirth)}
            </Text>
            <Button
              mode="contained"
              compact="true"
              onPress={() => navigation.navigate("EditProfile")}
            >
              Edit Profile
            </Button>
          </View>
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon="notifications-outline"
            iconLibrary={Ionicons}
            label="Get notifications"
            rightComponent={<Switch value={true} />}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("AccountSettings")}
          >
            <SettingsRow
              icon="account"
              iconLibrary={MaterialCommunityIcons}
              label="Account Settings"
              rightComponent={
                <FontAwesome name="caret-right" size={24} color="black" />
              }
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLogoutModal(true)}>
            <SettingsRow
              icon="logout"
              iconLibrary={MaterialIcons}
              label="Logout"
              rightComponent={
                <FontAwesome name="caret-right" size={24} color="black" />
              }
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
            <SettingsRow
              icon="delete"
              iconLibrary={AntDesign}
              label="Delete Account"
              rightComponent={
                <FontAwesome name="caret-right" size={24} color="black" />
              }
            />
          </TouchableOpacity>

          <SettingsRow
            icon="report"
            iconLibrary={Octicons}
            label="Report"
            rightComponent={
              <FontAwesome name="caret-right" size={24} color="black" />
            }
          />
        </View>

        <Modal
          transparent={true}
          visible={logoutModal}
          animationType="slide"
          onRequestClose={() => setLogoutModal(false)}
        >
          <View
            style={{
              padding: 20,
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={styles.unmatchModal}>
              <Text>Are you sure you want to Logout?</Text>
              <View style={{ flexDirection: "row", gap: 30 }}>
                <Button
                  mode="contained"
                  onPress={() => {
                    auth()
                      .signOut()
                      .then(() => {
                        console.log("User signed out!");
                        setLogoutModal(false);
                        navigation.replace("Home");
                      });
                  }}
                >
                  <Text>Yes</Text>
                </Button>
                <Button mode="contained" onPress={() => setLogoutModal(false)}>
                  <Text>No</Text>
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* <View style={styles.section}>
          <Text style={styles.sectionHeader}>Favorite Genres</Text>
          <Text style={styles.infoText}>{favGenres?.join(", ") || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Favorite Authors</Text>
          <Text style={styles.infoText}>{favAuthors?.join(", ") || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Photos</Text>
          <FlatList
            data={Myuser.photos}
            horizontal
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleImagePress(item)}>
                <Image source={{ uri: item }} style={styles.photo} />
              </TouchableOpacity>
            )}
          />
        </View> */}

        {/* Modal for Delete Confirmation */}
        <Modal
          visible={deleteModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeaderText}>
                Are you sure you want to delete your profile?
              </Text>
              <Text style={styles.modalSubText}>
                This action is permanent and cannot be undone. Type "delete"
                below to confirm.
              </Text>
              <TextInput
                style={styles.input}
                value={deleteConfirmation}
                onChangeText={(text) => setDeleteConfirmation(text)}
                placeholder="Type 'delete' to confirm"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.closeModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeModalButton, styles.deleteModalButton]}
                  onPress={handleDeleteProfile}
                >
                  <Text style={styles.closeModalText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
              />
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 80,
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

export default ProfileScreen;
