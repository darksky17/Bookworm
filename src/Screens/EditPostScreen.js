import React, { useEffect, useState } from "react";
import { View, Text, BackHandler, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, Keyboard, Pressable } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { auth } from "../Firebaseconfig";
import { SERVER_URL, GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";
import Container from "../components/Container";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { horizontalScale, moderateScale, verticalScale } from "../design-system/theme/scaleUtils";
import { Button, Modal as PModal } from "react-native-paper";


const EditPostScreen = ({navigation}) => {
  
  const user = auth.currentUser;
  const reduxUser = useSelector((state) => state.user);
  const route = useRoute();
  const { initialPost} = route.params;
  const [postType, setPostType] = useState(initialPost.type);
  const [bookTitle, setBookTitle] = useState(initialPost.BookTitle);
  const [bookAuthor, setBookAuthor] = useState(initialPost.BookAuthor);
  const [title, setTitle] = useState(initialPost.title);
  const [content, setContent] = useState(initialPost.Content);
  const [tags, setTags] = useState(() => {
    if (Array.isArray(initialPost.tags)) {
      return initialPost.tags.join(", ");
    } else if (typeof initialPost.tags === 'string') {
      return initialPost.tags;
    } else {
      return "";
    }
  });

  const [loading, setLoading] = useState(false);


  // Book search modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookOptions, setBookOptions] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [discardModal, setDiscardModal] = useState(false);


  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        "Discard Changes?",
        "Are you sure you want to discard your changes?",
        [
          { text: "Cancel", onPress: () => {}, style: "cancel" }, // Do nothing, stay on screen
          { text: "Discard", onPress: () => navigation.goBack() } // Go back to previous screen
        ]
      );
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );});

  

  const fetchBooksWithAuthors = async (query) => {
    if (!query || query.length < 3) {
      setBookOptions([]);
      return;
    }
    setLoadingBooks(true);
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&key=${BOOKS_API_KEY}`
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
          author: authorNames,
        };
      });
      setBookOptions(formatted);
    } catch (error) {
      setBookOptions([]);
    } finally {
      setLoadingBooks(false);
    }
  };




  
  



  const handleSubmit = async () => {
    if (postType === "BookReview") {
      if (!bookTitle || !bookAuthor || !content) {
        Alert.alert("Error", "Please fill in all required fields.");
        return;
      }
    } else {
      if (!title || !content) {
        Alert.alert("Error", "Please fill in all required fields.");
        return;
      }
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const postData = {
        type: postType,
        Content: content,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        authorId: user.uid,
        displayName: reduxUser.displayName || user.displayName || "Unknown User",
        timestamp: new Date().toISOString(),
        edited:true

       
      };
      if (postType === "BookReview") {
        postData.BookTitle = bookTitle;
        postData.BookAuthor = bookAuthor;
      } else {
        postData.title = title;
        
      }

            
            const response = await fetch(`${SERVER_URL}/posts/${initialPost.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(postData),
  
        
      });
      if (!response.ok) {
        throw new Error("Failed to add post");
      }
      setBookTitle("");
      setBookAuthor("");
      setTitle("");
      setContent("");
      setTags("");

      Alert.alert("Success", "Your post has been added!");

      navigation.navigate("MainTabs", { screen: "Feed"});
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add post");
    } finally {
      setLoading(false);
    }
  };




  return (
    
    <Container>
      <Header title="Edit Post" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          {/* Post Type Selector */}
          <Text style={styles.label}>Post Type</Text>
          <View style={styles.typeSelector}>
      

           
            <View
              style={[
                styles.typeButton,
                 styles.typeButtonActive
              ]}
              
            >
              <Text style={[
                styles.typeButtonText,
                styles.typeButtonTextActive
              ]}>
                          
       {postType === "Discussion" ? "Discussion" : "Book Review"}
                         
              </Text>
              </View>
   
          </View>

          {/* Conditional Fields based on Post Type */}
          {postType === "BookReview" ? (
            <>
              <Text style={styles.label}>Book Title & Author *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowBookModal(true)}
              >
                <Text style={{ color: bookTitle ? theme.colors.text : theme.colors.muted }}>
                  {bookTitle ? `${bookTitle} by ${bookAuthor}` : "Search and select a book"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="title of your post goes here"
                placeholderTextColor={theme.colors.muted}
              />
            </>
          )}

          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Mention your content here"
            placeholderTextColor={theme.colors.muted}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. classic, fiction, psychology"
            placeholderTextColor={theme.colors.muted}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
                <ActivityIndicator size="large" color={theme.colors.primary} />
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
                      setBookTitle(item.value);
                      setBookAuthor(item.author);
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
          {bookTitle && bookAuthor && (
            <View style={styles.selectionFooter}>
              <Text style={styles.selectionLabel}>Currently selected:</Text>
              <Text style={styles.selectionValue}>{bookTitle} by {bookAuthor}</Text>
            </View>
          )}
        </View>
      </Modal>
      <Modal visible={loading} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Modal>

      <PModal
        transparent={true}
        visible={discardModal}
        animationType="slide"
        onRequestClose={() => setDiscardModal(false)}
      >
        <View
          style={{
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.unmatchModal}>
            <Text>Do you want to save a draft?</Text>
            <View style={{ flexDirection: "row", gap:horizontalScale(50), alignItems:"center" }}>
            <View>
  <Pressable onPress={() => setDiscardModal(false)}>
    <Text style={{ color: theme.colors.muted }}>Cancel</Text>
  </Pressable>
</View>
              <View style={{flexDirection:"row", alignItems:"center", gap:horizontalScale(10)}}>
              <Button
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                mode="contained"
                onPress={()=>{setDiscardModal(false); storeDraft();}}
              >
                <Text>Yes</Text>
              </Button>
              <Button
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                mode="contained"
                onPress={async () =>  { setDiscardModal(false);
                  await AsyncStorage.removeItem('my-draft'); 
                  setBookTitle("");
                  setBookAuthor("");
                  setTitle("");
                  setContent("");
                  setTags("");
     
                
                  navigation.goBack(); 
                }}
              >
                <Text>No</Text>
              </Button>
              </View>
            </View>
          </View>
        </View>
      </PModal>
    </Container>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    padding: theme.spacing.horizontal.md,
    paddingTop: theme.spacing.vertical.lg,
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
  label: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.vertical.md,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.spacing.vertical.sm,
    paddingHorizontal: theme.spacing.horizontal.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.muted,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.muted,
  },
  typeButtonTextActive: {
    color: theme.colors.text,
    fontWeight:"bold",
    fontFamily: theme.fontFamily.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.muted,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.vertical.sm,
    marginBottom: theme.spacing.vertical.md,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.vertical.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.vertical.md,
  },
  submitButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.bold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: theme.spacing.vertical.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingBottom: theme.spacing.vertical.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.horizontal.sm,
  },
  closeButtonText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.muted,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingBottom: theme.spacing.vertical.sm,
    paddingTop:theme.spacing.vertical.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.vertical.sm,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text,
    backgroundColor: '#f0f0f0',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingBottom: theme.spacing.vertical.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.vertical.lg,
  },
  loadingText: {
    marginTop: theme.spacing.vertical.sm,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.vertical.lg,
  },
  emptyText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.muted,
    marginTop: theme.spacing.vertical.sm,
  },
  separator: {
    height: theme.spacing.vertical.sm,
  },
  bookItem: {
    paddingVertical: theme.spacing.vertical.sm,
    paddingHorizontal: theme.spacing.horizontal.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#f5f5f5',
  },
  bookTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
  },
  selectionFooter: {
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingBottom: theme.spacing.vertical.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  selectionLabel: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.vertical.sm,
  },
  selectionValue: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },

});

export default EditPostScreen; 