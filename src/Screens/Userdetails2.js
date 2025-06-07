import React, { useState, useEffect } from "react";
import { firestore, db } from "../Firebaseconfig";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import {
  setFavGenres,
  setFavAuthors,
  setCurrentlyReading,
  setBookSummary,
} from "../redux/userSlice";
import auth from "@react-native-firebase/auth";
import { setDoc, updateDoc, doc } from "@react-native-firebase/firestore";
import {
  fetchUserDataByQuery,
  fetchUserDataById,
} from "../components/FirestoreHelpers";
import { MultiSelect } from "react-native-element-dropdown";
import { GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";
import { Button } from "react-native-paper";

const genres = [
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Horror",
  "Mystery",
  "Thriller",
  "Historical Fiction",
  "Young Adult",
  "Children's",
  "Adventure",
  "Dystopian",
  "Literary Fiction",
  "Contemporary",
  "Paranormal",
  "Graphic Novels",
  "Crime",
  "Memoir",
  "Biography",
  "Autobiography",
  "Self-Help",
  "Poetry",
  "Drama",
  "Satire",
  "Classics",
  "Spirituality",
  "Science",
  "Psychology",
  "Philosophy",
  "Health & Wellness",
  "Cookbooks",
  "True Crime",
  "Politics",
  "Travel",
  "Art & Photography",
  "Business",
  "Economics",
  "Religion",
  "Mythology",
  "Western",
  "Anthology",
  "Short Stories",
  "Education",
  "Parenting",
  "Technology",
  "Environment",
  "War & Military",
];
const authors = [
  "J.K. Rowling",
  "George Orwell",
  "Agatha Christie",
  "J.R.R. Tolkien",
  "Stephen King",
];

const Userdetails2 = ({ navigation }) => {
  const userId = auth().currentUser.uid;
  const dispatch = useDispatch();
  const globalSelected = useSelector((state) => state.user);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [genreOptions, setGenreOptions] = useState([]);
  const [authorOptions, setAuthorOptions] = useState([]);
  const [currentread, setCurrentRead] = useState("");
  const [bookSummary, setBooksummary] = useState("");

  const handleGenreChange = (selected) => {
    if (selected.length > 5) {
      Alert.alert("Limit reached", "You can select up to 5 genres.");
      return setSelectedGenres([...selectedGenres]);
    }
    setSelectedGenres(selected);
  };
  const filterGenres = (query) => {
    if (!query || query.length < 1) {
      setGenreOptions([]); // or reset to full list if you prefer
      return;
    }

    const filtered = genres
      .filter((genre) => genre.toLowerCase().includes(query.toLowerCase()))
      .map((genre) => ({
        label: genre,
        value: genre,
      }));

    setGenreOptions(filtered);
  };

  const handleFinish = async () => {
    if (
      selectedGenres.length < 3 ||
      selectedAuthors.length < 3 ||
      currentread.length < 1 ||
      bookSummary.length < 20
    ) {
      Alert.alert(
        "Error",
        "Please select 3 genres, 3 authors, and fill the remaining fields."
      );
      return;
    }

    try {
      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          favGenres: selectedGenres,
          favAuthors: selectedAuthors,
          distance: 10,
          ageMax: 100,
          ageMin: 18,
          currentRead: currentread,
          bookSummary: bookSummary,
        },
        { merge: true }
      );

      dispatch(setFavGenres(selectedGenres));
      dispatch(setFavAuthors(selectedAuthors));
      dispatch(setCurrentlyReading(currentread));
      dispatch(setBookSummary(bookSummary));

      await updateDoc(userDocRef, { step2Completed: true });
      navigation.navigate("AddPhotos");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };
  const fetchAuthors = async (query) => {
    if (!query || query.length < 3) return;

    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=inauthor:${query}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      const authorsSet = new Set(selectedAuthors); // preserve current selection

      if (data.items) {
        data.items.forEach((item) => {
          const authors = item.volumeInfo.authors || [];
          authors.forEach((author) => authorsSet.add(author));
        });
      }

      const formatted = Array.from(authorsSet).map((author) => ({
        label: author,
        value: author,
      }));

      setAuthorOptions(formatted);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const handleAuthorChange = (selected) => {
    if (selected.length > 5) {
      Alert.alert("Limit reached", "You can select up to 5 authors.");
      return setSelectedAuthors([...selectedAuthors]);
    }
    setSelectedAuthors(selected);
    console.log("I rann", selectedAuthors);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Other UI elements */}
      <Text style={styles.header}>Complete Your Details</Text>
      <View
        style={{
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 10 }}>
          <Text style={styles.subHeader}>
            Select Your Favorite Genres (max 5):
          </Text>
          <MultiSelect
            style={styles.dropdown}
            data={genres.map((g) => ({ label: g, value: g }))}
            labelField="label"
            valueField="value"
            placeholder="Search and select Genres"
            search
            value={selectedGenres}
            onChange={handleGenreChange}
            onChangeText={filterGenres}
            maxSelect={5}
            selectedTextStyle={styles.selectedText}
            containerStyle={{
              backgroundColor: "white",
              flex: 1,

              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 5,
              marginTop: 5,
            }}
            renderItem={(item, selected) => (
              <View
                style={[
                  styles.itemContainer,
                  selected && styles.selectedItemList,
                ]}
              >
                <Text
                  style={[styles.itemText, selected && styles.selectedText]}
                >
                  {item.label}
                </Text>
              </View>
            )}
            selectedStyle={styles.selectedItem}
            flatListProps={{
              ItemSeparatorComponent: () => <View style={{ height: 15 }} />,
            }}
          />
        </View>
        <View style={{ gap: 15 }}>
          <Text style={styles.subHeader}>
            Select Your Favorite Authors (max 5):
          </Text>

          <MultiSelect
            style={styles.dropdown}
            data={authorOptions}
            labelField="label"
            valueField="value"
            placeholder="Search and select authors"
            search
            value={selectedAuthors}
            onChange={handleAuthorChange}
            onChangeText={fetchAuthors} // Key line: fetch authors as user types
            maxSelect={5}
            selectedTextStyle={styles.selectedText}
            dropdownStyle={styles.dropdownList}
            selectedStyle={styles.selectedItem}
            containerStyle={{
              backgroundColor: "white",
              flex: 1,

              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 5,
              marginTop: 5,
            }}
            renderItem={(item, selected) => (
              <View
                style={[
                  styles.itemContainer,
                  selected && styles.selectedItemList,
                ]}
              >
                <Text
                  style={[styles.itemText, selected && styles.selectedText]}
                >
                  {item.label}
                </Text>
              </View>
            )}
            flatListProps={{
              ItemSeparatorComponent: () => <View style={{ height: 15 }} />,
            }}
          />
        </View>
        <View style={{ gap: 15 }}>
          <Text style={styles.subHeader}>
            Enter the book that has your attention currently:
          </Text>
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
            onChangeText={(text) => setCurrentRead(text)}
          />
        </View>
        <View style={{ gap: 15 }}>
          <Text style={styles.subHeader}>Summarize your favorite book:</Text>
          <View style={{ gap: 2 }}>
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
            <Text
              style={{
                flexDirection: "row",
                alignSelf: "flex-end",
                fontWeight: "bold",
                color: "grey",
              }}
            >
              {200 - bookSummary.length}/200
            </Text>
          </View>
        </View>

        <Button mode="contained" onPress={handleFinish} textColor="green">
          Continue
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "snow",
    flexGrow: 1,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    color: "lawngreen",
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "bold",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
    paddingTop: 10,
    gap: 15,
  },
  optionBox: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,

    borderRadius: 5,
  },
  selectedBox: {
    backgroundColor: "lightgreen",
  },
  optionText: {
    textAlign: "center",
  },
  photoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
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
  photoText: {
    fontSize: 30,
    color: "white",
  },
  photo: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  finishButton: {
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 10,
  },
  finishButtonText: {
    color: "white",
    fontSize: 16,
  },
  imageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    borderRadius: 15,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  itemContainer: {
    flex: 1,
    gap: 20,
    padding: 15,
    backgroundColor: "white",

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#eee",
  },

  dropdown: {
    height: 55,
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  dropdownList: {
    backgroundColor: "green",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 250,
    paddingVertical: 5,
    marginTop: 5,
  },

  selectedItem: {
    backgroundColor: "#4caf50",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  selectedItemList: {
    flex: 1,
    gap: 20,
    padding: 15,
    backgroundColor: "green",

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#eee",
  },

  selectedText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default Userdetails2;
