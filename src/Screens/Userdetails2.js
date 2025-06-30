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
import {
  moderateScale,
  verticalScale,
  horizontalScale,
} from "../design-system/theme/scaleUtils";

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
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authorSearchQuery, setAuthorSearchQuery] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [filteredGenres, setFilteredGenres] = useState([]);
  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const [showGenreModal, setShowGenreModal] = useState(false);

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
      setGenreOptions([]);
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

  const fetchAuthors = async (query) => {
    if (!query || query.length < 3) {
      setAuthorOptions([]);
      return;
    }

    setLoadingAuthors(true);
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=inauthor:${encodeURIComponent(
          query
        )}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      const authorsSet = new Set();

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
      Alert.alert("Error", "Failed to fetch authors. Please try again.");
    } finally {
      setLoadingAuthors(false);
    }
  };

  const handleAuthorSelection = (author) => {
    if (selectedAuthors.includes(author)) {
      // Remove author if already selected
      setSelectedAuthors(selectedAuthors.filter((a) => a !== author));
    } else {
      // Add author if not selected and under limit
      if (selectedAuthors.length >= 5) {
        Alert.alert("Limit reached", "You can select up to 5 authors.");
        return;
      }
      setSelectedAuthors([...selectedAuthors, author]);
    }
  };

  const handleFinish = async () => {
    if (selectedGenres.length < 3) {
      Alert.alert("Error", "Please select at least 3 genres.");
      return;
    }
    if (selectedAuthors.length < 3) {
      Alert.alert("Error", "Please select at least 3 authors.");
      return;
    }
    if (currentread.length < 1) {
      Alert.alert("Error", "Please select your current read.");
      return;
    }
    if (bookSummary.length < 50) {
      Alert.alert(
        "Error",
        "Please make sure that your book summary is at least 50 characters long."
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

  const toggleGenreSelection = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      if (selectedGenres.length >= 5) {
        Alert.alert("Limit reached", "You can select up to 5 genres.");
        return;
      }
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const openGenreModal = () => {
    setFilteredGenres(genres);
    setGenreSearchQuery("");
    setShowGenreModal(true);
  };

  const closeGenreModal = () => {
    setShowGenreModal(false);
    setGenreSearchQuery("");
    setFilteredGenres([]);
  };

  // Initialize filtered genres when component mounts
  useEffect(() => {
    setFilteredGenres(genres);
  }, []);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
      enableAutomaticScroll={true}
      enableResetScrollToCoords={false}
      keyboardOpeningTime={0}
      scrollEnabled={true}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.header}>Complete Your Details</Text>
        <View
          style={{
            flexDirection: "column",
            flex: 1,
            justifyContent: "space-between",
            gap: verticalScale(15),
          }}
        >
          <View style={{ gap: 10 }}>
            <Text style={styles.subHeader}>
              Select Your Favorite Genres (max 5):
            </Text>

            <TouchableOpacity style={styles.dropdown} onPress={openGenreModal}>
              <Text
                style={[
                  styles.dropdownText,
                  selectedGenres.length === 0 && styles.placeholderText,
                ]}
              >
                {selectedGenres.length > 0
                  ? `${selectedGenres.length} genre${
                      selectedGenres.length > 1 ? "s" : ""
                    } selected`
                  : "Search and select genres"}
              </Text>
            </TouchableOpacity>

            {/* Display selected genres */}
            {selectedGenres.length > 0 && (
              <View style={styles.selectedGenresContainer}>
                {selectedGenres.map((genre, index) => (
                  <View key={index} style={styles.selectedGenreChip}>
                    <Text style={styles.selectedGenreText}>{genre}</Text>
                    <TouchableOpacity
                      onPress={() => toggleGenreSelection(genre)}
                      style={styles.removeGenreButton}
                    >
                      <Text style={styles.removeGenreButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ gap: 15 }}>
            <Text style={styles.subHeader}>
              Select Your Favorite Authors (3-5):
            </Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowAuthorModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  selectedAuthors.length === 0 && styles.placeholderText,
                ]}
              >
                {selectedAuthors.length > 0
                  ? `${selectedAuthors.length} author${
                      selectedAuthors.length > 1 ? "s" : ""
                    } selected`
                  : "Search and select authors"}
              </Text>
            </TouchableOpacity>

            {/* Display selected authors */}
            {selectedAuthors.length > 0 && (
              <View style={styles.selectedAuthorsContainer}>
                {selectedAuthors.map((author, index) => (
                  <View key={index} style={styles.selectedAuthorChip}>
                    <Text style={styles.selectedAuthorText}>{author}</Text>
                    <TouchableOpacity
                      onPress={() => handleAuthorSelection(author)}
                      style={styles.removeAuthorButton}
                    >
                      <Text style={styles.removeAuthorText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
        visible={showGenreModal}
        animationType="slide"
        onRequestClose={closeGenreModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Genres</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeGenreModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search genres..."
              placeholderTextColor="#999"
              value={genreSearchQuery}
              onChangeText={(text) => {
                setGenreSearchQuery(text);
                filterGenres(text);
              }}
            />
          </View>

          {/* Selection Counter */}
          <View style={styles.selectionCounter}>
            <Text style={styles.selectionCounterText}>
              {selectedGenres.length}/5 selected (minimum 3 required)
            </Text>
          </View>

          {/* Genre List */}
          <View style={styles.resultsContainer}>
            <FlatList
              data={filteredGenres}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.genreItem,
                    selectedGenres.includes(item) && styles.selectedGenreItem,
                  ]}
                  onPress={() => toggleGenreSelection(item)}
                >
                  <Text
                    style={[
                      styles.genreItemText,
                      selectedGenres.includes(item) &&
                        styles.selectedGenreItemText,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedGenres.includes(item) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Done Button */}
          <View style={styles.modalFooter}>
            <Button
              mode="contained"
              onPress={closeGenreModal}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.text}
              disabled={selectedGenres.length < 3}
            >
              Done ({selectedGenres.length} selected)
            </Button>
          </View>
        </View>
      </Modal>

      {/* Author Selection Modal */}
      <Modal
        visible={showAuthorModal}
        animationType="slide"
        onRequestClose={() => setShowAuthorModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Authors</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowAuthorModal(false);
                setAuthorSearchQuery("");
                setAuthorOptions([]);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type author name..."
              placeholderTextColor="#999"
              value={authorSearchQuery}
              onChangeText={(text) => {
                setAuthorSearchQuery(text);
                fetchAuthors(text);
              }}
              autoFocus
              returnKeyType="search"
            />
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {loadingAuthors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Searching authors...</Text>
              </View>
            ) : authorOptions.length === 0 && authorSearchQuery.length >= 3 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No authors found for "{authorSearchQuery}"
                </Text>
                <Text style={styles.emptySubText}>
                  Try a different search term
                </Text>
              </View>
            ) : authorOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Start typing to search for authors...
                </Text>
              </View>
            ) : (
              <FlatList
                data={authorOptions}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const isSelected = selectedAuthors.includes(item.value);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.bookItem,
                        isSelected && styles.selectedBookItem,
                      ]}
                      onPress={() => handleAuthorSelection(item.value)}
                    >
                      <Text
                        style={[
                          styles.bookTitle,
                          isSelected && styles.selectedBookTitle,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Text style={styles.selectedIcon}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Current Selection Footer */}
          {selectedAuthors.length > 0 && (
            <View style={styles.selectionFooter}>
              <Text style={styles.selectionLabel}>
                Selected authors ({selectedAuthors.length}/5):
              </Text>
              <Text style={styles.selectionValue}>
                {selectedAuthors.join(", ")}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Book Selection Modal */}
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
    paddingBottom: theme.spacing.vertical.md,
  },
  header: {
    fontSize: moderateScale(32),
    fontWeight: "bold",
    marginBottom: verticalScale(20),
    color: theme.colors.text,
  },
  subHeader: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: verticalScale(20),
    paddingTop: verticalScale(10),
    gap: horizontalScale(15),
  },

  dropdown: {
    height: verticalScale(55),
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(15),
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    justifyContent: "center",
  },
  dropdownList: {
    backgroundColor: "green",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: verticalScale(250),
    paddingVertical: verticalScale(5),
    marginTop: verticalScale(5),
  },
  selectedItem: {
    backgroundColor: "#4caf50",
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(15),
    paddingVertical: verticalScale(5),
  },
  selectedItemList: {
    flex: 1,
    gap: verticalScale(20),
    padding: 15,
    backgroundColor: "green",
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedText: {
    color: "white",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },
  dropdownText: {
    fontSize: moderateScale(16),
    color: "#000",
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text,
  },
  searchIcon: {
    fontSize: moderateScale(18),
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
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    paddingTop: verticalScale(50),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: horizontalScale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#666",
  },
  searchContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    height: verticalScale(50),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(15),
    fontSize: moderateScale(16),
    backgroundColor: "#fafafa",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: horizontalScale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  loadingText: {
    marginTop: verticalScale(15),
    fontSize: theme.fontSizes.medium,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: theme.fontSizes.medium,
    color: "#666",
    textAlign: "center",
    marginBottom: verticalScale(5),
  },
  emptySubText: {
    fontSize: moderateScale(14),
    color: "#999",
    textAlign: "center",
  },
  bookItem: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: horizontalScale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedBookItem: {
    backgroundColor: "#e8f5e8",
  },
  bookTitle: {
    fontSize: theme.fontSizes.medium,
    color: "#333",
    lineHeight: verticalScale(22),
    flex: 1,
  },
  selectedBookTitle: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  selectedIcon: {
    fontSize: moderateScale(18),
    color: "#4caf50",
    fontWeight: "bold",
    marginLeft: horizontalScale(10),
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: horizontalScale(10),
  },
  selectionFooter: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: "#f0f8f0",
    borderTopWidth: 1,
    borderTopColor: "#d4edda",
  },
  selectionLabel: {
    fontSize: moderateScale(14),
    color: "#28a745",
    fontWeight: "600",
    marginBottom: 3,
  },
  selectionValue: {
    fontSize: theme.fontSizes.medium,
    color: "#155724",
    fontWeight: "bold",
  },
  selectedAuthorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: horizontalScale(8),
    marginTop: verticalScale(5),
  },
  selectedAuthorChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(6),
    paddingHorizontal: horizontalScale(12),
  },
  selectedAuthorText: {
    color: "white",
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginRight: verticalScale(6),
  },
  removeAuthorButton: {
    width: horizontalScale(16),
    height: verticalScale(16),
    borderRadius: moderateScale(9),
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeAuthorText: {
    color: "white",
    fontSize: theme.fontSizes.small,
    fontWeight: "bold",
  },
  selectedGenresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: horizontalScale(8),
    marginTop: verticalScale(10),
  },
  selectedGenreChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(6),
    gap: horizontalScale(6),
  },
  selectedGenreText: {
    color: "white",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  removeGenreButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: moderateScale(10),
    width: horizontalScale(16),
    height: verticalScale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  removeGenreButtonText: {
    color: "white",
    fontSize: theme.fontSizes.medium,
    fontWeight: "bold",
  },
  genreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(15),
    paddingHorizontal: horizontalScale(20),
    backgroundColor: "white",
  },
  selectedGenreItem: {
    backgroundColor: "#e8f5e8",
  },
  genreItemText: {
    fontSize: theme.fontSizes.medium,
    color: "#333",
  },
  selectedGenreItemText: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  selectionCounterText: {
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
  },
});

export default Userdetails2;
