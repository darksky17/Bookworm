import React, { useState, useEffect } from "react";
import { firestore, db, setDoc, updateDoc, auth } from "../Firebaseconfig";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import {
  setFavGenres,
  setFavAuthors,
  setCurrentlyReading,
  setBookSummary,
} from "../redux/userSlice";
import {
  fetchUserDataByQuery,
  fetchUserDataById,
} from "../components/FirestoreHelpers";
import { MultiSelect, Dropdown } from "react-native-element-dropdown";
import { GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";
import { Button } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import theme from "../design-system/theme/theme";

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

const Userdetails2 = ({ navigation }) => {
  const userId = auth.currentUser.uid;
  const dispatch = useDispatch();
  const globalSelected = useSelector((state) => state.user);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [genreOptions, setGenreOptions] = useState([]);
  const [authorOptions, setAuthorOptions] = useState([]);
  const [currentread, setCurrentRead] = useState("");
  const [bookSummary, setBooksummary] = useState("");
  const [bookOptions, setBookOptions] = useState([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(false);

  const fetchBooksWithAuthors = async (query) => {
    if (!query || query.length < 3) {
      setBookOptions([]);
      return;
    }

    setLoadingBooks(true);
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(
          query
        )}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      if (!data.items) {
        setBookOptions([]);
        return;
      }

      const formatted = data.items.map((item) => {
        const title = item.volumeInfo.title || "Untitled";
        const authors = item.volumeInfo.authors || ["Unknown Author"];
        const authorNames = authors.join(", ");

        return {
          label: `${title} by ${authorNames}`,
          value: title,
        };
      });

      setBookOptions(formatted);
    } catch (error) {
      console.error("Error fetching books:", error);
      Alert.alert("Error", "Failed to fetch books. Please try again.");
    } finally {
      setLoadingBooks(false);
    }
  };

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
          currentlyReading: currentread,
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
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={100} // Increase significantly
      keyboardShouldPersistTaps="handled"
      enableAutomaticScroll={true}
      enableResetScrollToCoords={false}
      keyboardOpeningTime={0}
      scrollEnabled={true}
    >
      {/* Other UI elements */}
      <View style={{ flex: 1 }}>
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

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBookModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !currentread && styles.placeholderText,
                ]}
              >
                {currentread || "Search or pick a book"}
              </Text>
            </TouchableOpacity>
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

          <Button
            mode="contained"
            onPress={handleFinish}
            textColor={theme.colors.text}
            buttonColor={theme.colors.primary}
          >
            Continue
          </Button>
        </View>
      </View>
      <Modal
        visible={showBookModal}
        animationType="slide"
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Books</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowBookModal(false);
                setSearchQuery("");
                setBookOptions([]);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type book title or author..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                // Use debounced version if you installed lodash.debounce
                // debouncedFetchBooks(text);
                // Or use direct call:
                fetchBooksWithAuthors(text);
              }}
              autoFocus
              returnKeyType="search"
            />
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {loadingBooks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Searching books...</Text>
              </View>
            ) : bookOptions.length === 0 && searchQuery.length >= 3 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No books found for "{searchQuery}"
                </Text>
                <Text style={styles.emptySubText}>
                  Try a different search term
                </Text>
              </View>
            ) : bookOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Start typing to search for books...
                </Text>
              </View>
            ) : (
              <FlatList
                data={bookOptions}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bookItem}
                    onPress={() => {
                      setCurrentRead(item.value);
                      setShowBookModal(false);
                      setSearchQuery("");
                      setBookOptions([]);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={styles.bookTitle}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          {/* Current Selection Footer */}
          {currentread && (
            <View style={styles.selectionFooter}>
              <Text style={styles.selectionLabel}>Currently selected:</Text>
              <Text style={styles.selectionValue}>{currentread}</Text>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "snow",
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    color: theme.colors.text,
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
  dropdownText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  placeholderText: {
    color: theme.colors.text,
    justifyContent: "center",
    alignContent: "center",
    paddingTop: theme.spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  bookItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  bookTitle: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 10,
  },
  selectionFooter: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f0f8f0",
    borderTopWidth: 1,
    borderTopColor: "#d4edda",
  },
  selectionLabel: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "600",
    marginBottom: 3,
  },
  selectionValue: {
    fontSize: 16,
    color: "#155724",
    fontWeight: "bold",
  },
});

export default Userdetails2;
