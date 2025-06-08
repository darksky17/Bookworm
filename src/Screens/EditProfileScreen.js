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

import auth from "@react-native-firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentlyReading, setBookSummary } from "../redux/userSlice";
import { setDoc, updateDoc } from "@react-native-firebase/firestore";

import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button } from "react-native-paper";

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
  userId = auth().currentUser.uid;

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
        <Text style={{ crolor: "black", fontWeight: "bold" }}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={"Edit Profile"} />
      <ScrollView>
        <Container>
          <View style={styles.container}>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Image source={{ uri: selectedPhotos[0] }} style={styles.photo} />
              <TouchableOpacity
                onPress={() => navigation.navigate("AddPhotos")}
              >
                <Ionicons
                  name="add-circle-sharp"
                  size={37}
                  color="green"
                  style={{
                    marginTop: -30,
                    marginLeft: 60,
                    backgroundColor: "white",
                    borderRadius: 1000,
                  }}
                />
              </TouchableOpacity>
            </View>

            <InfoRow label="Name" value={globalSelected.name} />
            <InfoRow label="Phone" value={globalSelected.phoneNumber} />
            <InfoRow label="Gender" value={globalSelected.gender} />
            <InfoRow label="Date of Birth" value={globalSelected.dateOfBirth} />

            <View style={{ gap: 30 }}>
              <View style={styles.chipContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 10,
                  }}
                >
                  <Text>Your favorite Authors:</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("AddAuthors")}
                  >
                    <FontAwesome name="caret-right" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 5,
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 10,
                  }}
                >
                  <Text>Your favorite Genres:</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("AddGenres")}
                  >
                    <FontAwesome name="caret-right" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 5,
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
                    paddingHorizontal: 10,
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
                    gap: 5,
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {choicebook ? (
                    <View style={{ gap: 20 }}>
                      <TextInput
                        placeholder="Please only mention the name of the Book!"
                        editable
                        backgroundColor="snow"
                        numberOfLines={3}
                        maxLength={50}
                        style={{
                          borderColor: "grey",
                          borderWidth: 2,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                        }}
                        value={currentreade}
                        onChangeText={setCurrentRead}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
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
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
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
                    paddingHorizontal: 10,
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
                    gap: 5,
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  {choicesummary ? (
                    <View style={{ gap: 20 }}>
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
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingTop: 10,
                        }}
                        value={bookSummary}
                        onChangeText={setBooksummary}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
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
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                        {currentSummary}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Container>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 20,
    gap: 10,
  },
  chip: {
    backgroundColor: "#d1e7dd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: {
    color: "#0f5132",
    fontSize: 14,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    gap: 60,
    borderRadius: 10,
    marginTop: 80,
    padding: 10,
    backgroundColor: "white",
  },

  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "centre",
    paddingBottom: 10,
    borderBottomColor: "grey",
    borderBottomWidth: 1,
  },

  flatListContent: {
    alignItems: "center",
  },
  photoText: {
    fontSize: 30,
    color: "black",
  },

  photoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 10,
  },

  subHeader: {
    fontSize: 16,
    marginVertical: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  optionBox: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedBox: {
    backgroundColor: "lightgreen",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  imageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  imageButton: {
    marginLeft: 10,
    backgroundColor: "#007BFF",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  photo: {
    width: 120,
    aspectRatio: 1,
    borderRadius: 100,
    marginTop: -70,
    borderWidth: 3,
    borderColor: "brown",
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 15,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default EditProfileScreen;
