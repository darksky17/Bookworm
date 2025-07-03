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
  Linking,
} from "react-native";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import {
  setUserState,
  clearUserState,
  setNotificationPref,
} from "../redux/userSlice";
import axios from "axios"; // Add axios for API calls
import { doc, updateDoc, deleteField, db, auth } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import { signOut } from "@react-native-firebase/auth";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "../design-system/theme/scaleUtils";
const ProfileScreen = ({ navigation }) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // Delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState(""); // Confirmation text input
  dispatch = useDispatch();
  const [logoutModal, setLogoutModal] = useState(false);

  const notificationPref = useSelector((state) => state.user.notificationpref);

  const handleReportPress = () => {
    const subject = encodeURIComponent("Bug Report - [Your App Name]");
    const body = encodeURIComponent(
      "Describe the issue here...\n\nDevice Info:"
    );
    const email = "jainakash530@gmail.com";

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const onToggleSwitch = async () => {
    const NOTIF_PREF_KEY = "notificationPref";
    const newValue = !notificationPref; // Flip the current value
    dispatch(setNotificationPref(newValue)); // Update Redux state

    // Ensure key is a string (key can't be boolean)
    await AsyncStorage.setItem(NOTIF_PREF_KEY, String(newValue)); // Store as string "true" or "false"
    const userId = auth.currentUser.uid;

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, {
      fcmToken: deleteField(),
    });

    console.log("I reached here");
    console.log("Updated notif pref:", newValue); // Log the new value
  };

  const handleDeleteProfile = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      console.log(deleteConfirmation);
      Alert.alert("Error", 'You must type "delete" to confirm.');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const idToken = await auth.currentUser.getIdToken();

      const folderName = userId; // Assuming folder name follows a user-specific naming convention
      const response = await axios.post(
        `${SERVER_URL}/delete-profile`,
        { folderName: folderName },
        {
          headers: {
            Authorization: `Bearer ${idToken}`, // ✅ Add Bearer token here
          },
        }
      );

      console.log("Cloudinary folder deletion response:", response.data);
      if (response) {
        // unsubscribeRef.current();
        console.log("Now my listner should stop listening");
        // Delete the user document from Firestore
        // await deleteDoc(doc(db, "Users", userId));
        console.log("User profile deleted successfully.");
        dispatch(clearUserState());
        // Sign the user out
        await signOut(auth);
        console.log(
          "Sign out was also conducted smoothly, now its time to show the alert"
        );

        Alert.alert("Success", "Your profile has been deleted.");
        navigation.navigate("Home");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      Alert.alert("Error", "Failed to delete profile. Please try again later.");
    } finally {
      setDeleteModalVisible(false);
      setDeleteConfirmation("");
    }
  };

  const Myuser = useSelector((state) => state.user);
  // const calculateAge = (birthdate) => {
  //   if (!birthdate) return "N/A";
  //   const birthMoment = moment(birthdate, "DD/MM/YYYY");
  //   if (!birthMoment.isValid()) return "N/A";
  //   const age = moment().diff(birthMoment, "years");
  //   return age;
  // };
  const calculateAge = (birthdate) => {
    if (!birthdate) return "N/A";

    const [year, month, day] = birthdate.split(/[\/\-.]/);
    if (!day || !month || !year) return "N/A";

    const birthDate = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
    if (isNaN(birthDate.getTime())) return "N/A";

    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (!Myuser) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Loading your profile...</Text>
      </View>
    );
  }

  const SettingsRow = ({ icon, iconLibrary: Icon, label, rightComponent }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: horizontalScale(10),
        }}
      >
        <Icon name={icon} size={24} color="black" />
        <Text
          style={{
            fontWeight: "bold",
            fontSize: moderateScale(15),
            fontFamily: theme.fontFamily.bold,
            color: theme.colors.text,
          }}
        >
          {label}
        </Text>
      </View>
      {rightComponent}
    </View>
  );

  const handleLogout = async () => {
    const userId = auth.currentUser.uid;
    try {
      const userDocRef = doc(db, "Users", userId);
      await updateDoc(userDocRef, {
        fcmToken: deleteField(),
      });
      dispatch(clearUserState());

      signOut(auth).then(() => {
        console.log("User signed out!");
        setLogoutModal(false);
        navigation.replace("Home");
      });
    } catch (error) {
      console.error("❌ Error deleting field:", error);
      throw error;
    }
  };
  return (
    <Container>
      <Header title={"Profile"} />

      <View style={styles.profileHeader}>
        <Image
          source={{ uri: Myuser.photos[0] }}
          style={styles.profileImage}
          onError={(e) =>
            console.error("Error loading profile picture:", e.nativeEvent.error)
          }
        />

        <View
          style={{
            flexDirection: "column",
            gap: verticalScale(10),
            width: "full",
            marginTop: verticalScale(10),
          }}
        >
          <Text style={styles.nameText}>
            {Myuser.name}, {calculateAge(Myuser.dateOfBirth)}
          </Text>
          <Button
            mode="contained"
            buttonColor={theme.colors.primary}
            textColor={theme.colors.text}
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
          rightComponent={
            <Switch
              color={theme.colors.primary}
              value={notificationPref}
              onValueChange={onToggleSwitch}
            />
          }
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

        <TouchableOpacity onPress={handleReportPress}>
          <SettingsRow
            icon="report"
            iconLibrary={Octicons}
            label="Report A Bug"
            rightComponent={
              <FontAwesome name="caret-right" size={24} color="black" />
            }
          />
        </TouchableOpacity>
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
            <View style={{ flexDirection: "row", gap: horizontalScale(30) }}>
              <Button
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                mode="contained"
                onPress={handleLogout}
              >
                <Text>Yes</Text>
              </Button>
              <Button
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                mode="contained"
                onPress={() => setLogoutModal(false)}
              >
                <Text>No</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

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
              This action is permanent and cannot be undone. Type "delete" below
              to confirm.
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
    </Container>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.muted,
  },
  unmatchModal: {
    padding: 20,
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "snow",
    elevation: 3,
    borderRadius: moderateScale(10),
  },
  profileHeader: {
    flexDirection: "row",
    gap: horizontalScale(15),
    padding: 15,
  },
  profileImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    borderRadius: moderateScale(50),
  },
  placeholderProfileImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    backgroundColor: "#dfe4ea",
    borderRadius: moderateScale(50),
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: moderateScale(16),
  },
  nameText: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
    color: theme.colors.text,
    fontFamily: theme.fontFamily.bold,
  },

  section: {
    flexDirection: "column",
    gap: verticalScale(25),
    borderRadius: moderateScale(10),
    paddingHorizontal: horizontalScale(15),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
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
    borderRadius: moderateScale(10),
    alignItems: "center",
  },

  closeModalButton: {
    marginTop: verticalScale(10),
    backgroundColor: theme.colors.primary,
    paddingVertical: verticalScale(5),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(5),
  },
  closeModalText: {
    color: theme.colors.text,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
