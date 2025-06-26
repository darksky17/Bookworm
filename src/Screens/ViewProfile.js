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
  Linking,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import Menu from "../components/Menu";
import theme from "../design-system/theme/theme";
import { scale } from "../design-system/theme/scaleUtils";
const ViewProfile = ({ route, navigation }) => {
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
  console.log("This is all data", allData);

  console.log("I ran");
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Left icon container */}
        <View style={styles.sideContainer}>
          <TouchableOpacity onPress={navigation.goBack}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Center text container */}
        <View style={styles.centerContainer}>
          <Text
            style={styles.headerText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {allData.ascended ? allData.name : allData.displayName}
          </Text>
        </View>

        {/* Right spacer (same size as icon) */}
        <View style={styles.sideContainer} />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "flex-end",
          height: 30,
          backgroundColor: theme.colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text>Chat</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontWeight: "bold",
            color: theme.colors.text,
            fontSize: scale(14),
          }}
        >
          Profile
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.wrapper}>
          <View style={styles.Card}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              {" "}
              {calculateAge(allData.dateOfBirth)} years old{" "}
            </Text>
          </View>
          <View style={styles.Card}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Your friend is currently reading:
            </Text>
            <Text>{allData.currentlyReading}</Text>
          </View>
          <View style={styles.Card}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Can you guess which book is this ?
            </Text>
            <Text>{allData.bookSummary}</Text>
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
              {allData.photos?.[3] && (
                <Image
                  source={{ uri: allData.photos[3] }}
                  style={styles.displayImage}
                />
              )}

              {allData.photos?.[4] && (
                <Image
                  source={{ uri: allData.photos[4] }}
                  style={styles.displayImage}
                />
              )}

              {allData.photos?.[5] && (
                <Image
                  source={{ uri: allData.photos[5] }}
                  style={styles.displayImage}
                />
              )}
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
    backgroundColor: theme.colors.background,
    height: 60,
    width: "100%",
    elevation: 4,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  sideContainer: {
    width: 40, // Matches the icon area (24px icon + touch padding)
    alignItems: "flex-start",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "500",
    fontSize: 25,
  },
});

export default ViewProfile;
