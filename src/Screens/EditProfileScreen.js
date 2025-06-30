import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { setCurrentlyReading, setBookSummary } from "../redux/userSlice";
import { setDoc, updateDoc, auth } from "../Firebaseconfig";

import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button } from "react-native-paper";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";

const EditProfileScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedAuthors, setSelectedAuthors] = useState([
    ...globalSelected.favAuthors,
  ]);
  const [selectedGenres, setSelectedGenres] = useState([
    ...globalSelected.favGenres,
  ]);
  const [selectedPhotos, setSelectedPhotos] = useState([
    ...globalSelected.photos,
  ]);
  const tempphotos = [...globalSelected.photos];
  const currentread = useSelector((state) => state.user.currentlyReading);
  const currentSummary = useSelector((state) => state.user.bookSummary);
  const [currentreade, setCurrentRead] = useState("");
  const [choicebook, setChoiceBook] = useState(false);
  const [choicesummary, setChoiceSummary] = useState(false);
  const [bookSummary, setBooksummary] = useState("");
  userId = auth.currentUser.uid;

  const handleSaveBook = async () => {
    if (currentreade.length > 20 || currentreade.length < 1) {
      Alert.alert(
        "Error",
        "Please make sure that the book title is atleast 1 char long and at max 20."
      );
      return;
    }

    try {
      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          currentlyReading: currentreade,
        },
        { merge: true }
      );

      dispatch(setCurrentlyReading(currentreade));
      setChoiceBook(false);
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };
  const handleSaveSummary = async () => {
    if (bookSummary.length < 50) {
      Alert.alert(
        "Error",
        "Please make sure that the book summary is atleast 50 char long."
      );
      return;
    }

    try {
      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          bookSummary: bookSummary,
        },
        { merge: true }
      );

      dispatch(setBookSummary(bookSummary));

      setChoiceSummary(false);
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const InfoRow = ({ label, value }) => {
    return (
      <View style={styles.rowContainer}>
        <Text>{label}</Text>
        <Text
          style={{
            color: theme.colors.text,
            fontWeight: "bold",
          }}
        >
          {value}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Container>
        <Header title={"Edit Profile"} />
        <ScrollView>
          <View style={styles.container}>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image source={{ uri: selectedPhotos[0] }} style={styles.photo} />
              <TouchableOpacity
                onPress={() => navigation.navigate("AddPhotos")}
              >
                <Ionicons
                  name="add-circle-sharp"
                  size={37}
                  color="green"
                  style={{
                    marginTop: verticalScale(-30),
                    marginLeft: horizontalScale(60),
                    backgroundColor: "white",
                    borderRadius: moderateScale(1000),
                  }}
                />
              </TouchableOpacity>
            </View>

            <InfoRow label="Name" value={globalSelected.name} />
            <InfoRow label="Phone" value={globalSelected.phoneNumber} />
            <InfoRow label="Gender" value={globalSelected.gender} />
            <InfoRow label="Date of Birth" value={globalSelected.dateOfBirth} />

            <View style={{ gap: verticalScale(30) }}>
              <View style={styles.chipContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddAuthors")}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: horizontalScale(10),
                    }}
                  >
                    <Text>Your favorite Authors:</Text>

                    <FontAwesome name="caret-right" size={24} color="black" />
                  </View>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    gap: horizontalScale(5),
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {selectedAuthors.map((author, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{author}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.chipContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddGenres")}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: horizontalScale(10),
                    }}
                  >
                    <Text>Your favorite Genres:</Text>

                    <FontAwesome name="caret-right" size={24} color="black" />
                  </View>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    gap: horizontalScale(5),
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {selectedGenres.map((genre, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.chipContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: horizontalScale(10),
                  }}
                >
                  <Text>Your Current/Recent Read:</Text>
                  <TouchableOpacity onPress={() => setChoiceBook(true)}>
                    <FontAwesome name="edit" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: horizontalScale(5),
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {choicebook ? (
                    <View style={{ gap: verticalScale(20) }}>
                      <TextInput
                        placeholder="Please only mention the name of the Book!"
                        editable
                        backgroundColor="snow"
                        numberOfLines={3}
                        maxLength={50}
                        style={{
                          borderColor: "grey",
                          borderWidth: 2,
                          borderRadius: moderateScale(10),
                          paddingHorizontal: horizontalScale(10),
                        }}
                        value={currentreade}
                        onChangeText={setCurrentRead}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          gap: horizontalScale(10),
                          justifyContent: "space-evenly",
                        }}
                      >
                        <Button mode="contained" onPress={handleSaveBook}>
                          Save
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => setChoiceBook(false)}
                        >
                          Cancel
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: "100%", // ensure full width
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: theme.fontSizes.medium,
                        }}
                      >
                        {currentread}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.chipContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: horizontalScale(10),
                  }}
                >
                  <Text>Summary of your favorite book:</Text>
                  <TouchableOpacity onPress={() => setChoiceSummary(true)}>
                    <FontAwesome name="edit" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: horizontalScale(5),
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {choicesummary ? (
                    <View style={{ gap: verticalScale(20) }}>
                      <TextInput
                        placeholder="It would be fun if you let your matches guess what book it is ;)"
                        editable
                        backgroundColor="snow"
                        numberOfLines={5}
                        multiline={true}
                        textAlignVertical="top"
                        maxLength={200}
                        style={{
                          borderColor: "grey",
                          borderWidth: 2,
                          borderRadius: moderateScale(10),
                          paddingHorizontal: horizontalScale(10),
                          paddingTop: verticalScale(10),
                        }}
                        value={bookSummary}
                        onChangeText={setBooksummary}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          gap: horizontalScale(10),
                          justifyContent: "space-evenly",
                        }}
                      >
                        <Button mode="contained" onPress={handleSaveSummary}>
                          Save
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => setChoiceSummary(false)}
                        >
                          Cancel
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: "100%", // ensure full width
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: theme.fontSizes.medium,
                        }}
                      >
                        {currentSummary}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(20),
    gap: verticalScale(10),
  },
  chip: {
    backgroundColor: "#d1e7dd",
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(20),
  },
  chipText: {
    color: "#0f5132",
    fontSize: moderateScale(14),
  },
  container: {
    flex: 1,
    flexDirection: "column",
    gap: verticalScale(60),
    borderRadius: moderateScale(10),
    marginTop: verticalScale(80),
    padding: verticalScale(10),
    paddingHorizontal: horizontalScale(20),
    backgroundColor: theme.colors.background,
  },

  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "centre",
    paddingBottom: verticalScale(10),
    borderBottomColor: "grey",
    borderBottomWidth: 1,
  },

  photo: {
    width: horizontalScale(120),
    aspectRatio: 1,
    borderRadius: moderateScale(100),
    marginTop: verticalScale(-70),
    borderWidth: 3,
    borderColor: "brown",
  },
});

export default EditProfileScreen;
