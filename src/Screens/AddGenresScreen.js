import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Text, 
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { setFavGenres } from "../redux/userSlice";
import { setDoc, updateDoc, auth } from "../Firebaseconfig";

import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";

import { Button } from "react-native-paper";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
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

const AddGenresScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedGenres, setSelectedGenres] = useState([
    ...globalSelected.favGenres,
  ]);

  const [filteredGenres, setFilteredGenres] = useState([]);
  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const [showGenreModal, setShowGenreModal] = useState(false);

  const userId = auth.currentUser.uid;

  // Initialize filtered genres when component mounts
  useEffect(() => {
    setFilteredGenres(genres);
  }, []);

  const handleSave = async () => {
    if (selectedGenres.length < 3) {
      Alert.alert("Error", "Please select at least 3 genres.");
      return;
    }

    try {
      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          favGenres: selectedGenres,
        },
        { merge: true }
      );

      dispatch(setFavGenres(selectedGenres));

      navigation.navigate("EditProfile");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const filterGenres = (query) => {
    if (!query || query.length < 1) {
      setFilteredGenres(genres);
      return;
    }

    const filtered = genres.filter((genre) => 
      genre.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredGenres(filtered);
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

  return (
    <Container>
      <Header title={"Add Genres"} />
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.subHeader}>
            Select Your Favorite Genres (3-5):
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

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.buttonSave}
              onPress={handleSave}
              labelStyle={{ fontWeight: "700" }}
            >
              Save Changes
            </Button>

            <Button
              mode="contained"
              style={styles.buttonCancel}
              onPress={() => navigation.goBack()}
              labelStyle={{ color: "#333", fontWeight: "700" }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Genre Selection Modal */}
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
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: verticalScale(30),
    backgroundColor: theme.colors.background,
  },
  subHeader: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
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
  dropdownText: {
    fontSize: moderateScale(16),
    color: "#000",
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text,
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
  buttonContainer: {
    gap: 10,
    justifyContent: "space-between",
  },
  // Modal Styles
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
  selectionCounter: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(10),
  },
  selectionCounterText: {
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: horizontalScale(20),
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
  checkmark: {
    fontSize: moderateScale(18),
    color: "#4caf50",
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: horizontalScale(10),
  },
  modalFooter: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});

export default AddGenresScreen;