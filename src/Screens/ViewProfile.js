import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import Menu from "../components/Menu";

const ViewProfile = ({ route, navigation }) => {
  const fetchDetails = () => {
    userDocRef = doc(db, "Users", mateId);
  };
  const toggleMenu = () => {
    setMenuVisible((prev) => !prev); // ✅ This correctly toggles the modal
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob); // Convert string to Date object
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    // Adjust if birthday hasn't occurred yet this year
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  };

  const { allData } = route.params;
  const [modalState, setModalState] = useState(false);
  let clickedYes = [];
  const [isdisabled, setIsDisabled] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  console.log("I ran");
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="black"
            style={{ left: 5 }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {allData.ascended ? allData.name : allData.displayName}
        </Text>
        <TouchableOpacity onPress={toggleMenu}>
          <Feather name="more-vertical" size={24} color="black" />
        </TouchableOpacity>
        {/* < Menu visible={isMenuVisible} onClose={toggleMenu}/> */}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "flex-end",
          height: 30,
          backgroundColor: "lawngreen",
        }}
      >
        <Text>Chat</Text>
        <Text style={{ fontWeight: "bold" }}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.wrapper}>
          <View style={styles.Card}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              {" "}
              {calculateAge(allData.dateOfBirth)} years old{" "}
            </Text>
          </View>

          {allData.ascended && (
            <>
              <Image
                source={{ uri: allData.photos[0] }}
                style={styles.displayImage}
              />
              <View style={styles.Card}>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  Authors that got me hooked
                </Text>
                <Text>{allData.favAuthors.join(",  ")}</Text>
              </View>

              <Image
                source={{ uri: allData.photos[1] }}
                style={styles.displayImage}
              />

              <View style={styles.Card}>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  Genres that keep me going
                </Text>
                <Text>{allData.favGenres.join(",  ")}</Text>
              </View>
              <Image
                source={{ uri: allData.photos[2] }}
                style={styles.displayImage}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  wrapper: {
    paddingVertical: 30,
    paddingHorizontal: 15,
    gap: 20,
    backgroundColor: "transparent",
  },

  Card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 30,
    fontWeight: 800,
    gap: 10,
  },

  displayImage: {
    width: "auto",
    height: 400,
    borderRadius: 10,
    shadowColor: "blue",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // For Android shadow
  },

  header: {
    flexDirection: "row",
    backgroundColor: "lawngreen",
    height: 60,
    width: "100%",
    elevation: 4,
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
  headerText: {
    marginTop: "30",
    fontWeight: "500",
    fontSize: 25,
  },
});

export default ViewProfile;
