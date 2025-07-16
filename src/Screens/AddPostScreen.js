import React, { useEffect, useState } from "react";
import { View, Text, BackHandler, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, Keyboard, Image, Pressable } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from "react-redux";
import { auth } from "../Firebaseconfig";
import { SERVER_URL, GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";
import Container from "../components/Container";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { horizontalScale, moderateScale, verticalScale } from "../design-system/theme/scaleUtils";
import { Button, Modal as PModal } from "react-native-paper";
import storage from "@react-native-firebase/storage";
const MAX_IMAGES = 3;

const AddPostScreen = ({navigation}) => {
  const user = auth.currentUser;
  const reduxUser = useSelector((state) => state.user);
  const [postType, setPostType] = useState("BookReview");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  // Book search modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookOptions, setBookOptions] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [discardModal, setDiscardModal] = useState(false);

  // Image picker state
  const [images, setImages] = useState([]); // array of {uri, ...}

  React.useEffect(() => {
    const onBackPress = () => {
      if (
        
        content.length > 0 ||
        images.length > 0 ||
        bookTitle.length > 0 ||
        tags.length > 0 ||
        title.length > 0
      ) {
        setDiscardModal(true);
        console.log("I reached here");
  
        return true; // prevent the screen from exiting!
      }
  
      return false; // no changes — allow default back action
    };
  
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
  
    return () => backHandler.remove();
  }, [content, images, bookTitle, tags, title]);

  const storeDraft = async () => {
    try {
      const postData = {
        type: postType,
        Content: content,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        images: images?.map(img => img.uri) || null, // send URIs for now
       
      };

 
      

      if (postType === "BookReview") {
        postData.BookTitle = bookTitle;
        postData.BookAuthor = bookAuthor;
      } else {
        postData.title = title;
      }
      const draftData = JSON.stringify(postData);
      await AsyncStorage.setItem('my-draft', draftData);
    } catch (e) {
      console.error("Failed to save draft locally:", error);
    }
    Alert.alert(
      "Draft Saved",
      "Your draft has been saved successfully.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(), // only called when user taps OK
        },
      ],
      { cancelable: false }
    );
    };
    const getDraft = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('my-draft');
        return jsonValue != null ? JSON.parse(jsonValue) : null;
      } catch (e) {
        // error reading value
      }
    };

    useEffect(() => {
   
      const fetchDraft = async () => {

        const postData = await getDraft();
   
        if (postData) {
          // Set your form fields here
          setPostType(postData.type || "BookReview");
          setContent(postData.Content || "");
          setTags((postData.tags || []).join(", "));
          setImages((postData.images || []).map(uri => ({ uri })));
    
          if (postData.type === "BookReview") {
            setBookTitle(postData.BookTitle || "");
            setBookAuthor(postData.BookAuthor || "");
          } else {
            setTitle(postData.title || "");
          }
        }
      };
    
      fetchDraft();
    }, []);
  

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

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        
        allowsEditing: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 1,
      });
      if (!result.canceled) {
        // result.assets is an array
        const newImages = result.assets.slice(0, MAX_IMAGES - images.length);
        setImages([...images, ...newImages]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick images.');
    }
  };

  const removeImage = (uri) => {
    setImages(images.filter(img => img.uri !== uri));
  };

  function generateRandomString(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Alphanumeric characters
    let result = '';
    const charsLength = chars.length;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return result;
  }
  
  

// Upload the image to Firebase Storage
const uploadImage = async (uri, storageRef) => {
  try {
    // Upload the file
    const result = await storageRef.putFile(uri);
    console.log('File uploaded successfully:', result);
    
    // Get the file download URL if needed
    const downloadURL = await storageRef.getDownloadURL();
    console.log('Download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
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
        Likes: 0,
        Dislikes: 0,
        Reports: 0,
        Saved: 0,
        Shares: 0,
        commentsCount: 0,
        images: images?.map(img => img.uri) || null, // send URIs for now
       
      };
      if (postType === "BookReview") {
        postData.BookTitle = bookTitle;
        postData.BookAuthor = bookAuthor;
      } else {
        postData.title = title;
        
      }
      if (postData.images != null) {
        randomId= generateRandomString();


        for (let i=0; i<postData.images.length; i++){
          const storageRef = storage().ref(`images/posts/${auth.currentUser.uid}/${randomId}/image${i}.jpg`);
          postData.images[i] = await uploadImage(postData.images[i], storageRef);
        }
        postData.postId = randomId;
        console.log("Whyyyy", postData.images);
   
      }
            
            const response = await fetch(`${SERVER_URL}/posts/add`, {
        method: "POST",
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
      setImages([]);
      Alert.alert("Success", "Your post has been added!");
      await AsyncStorage.removeItem('my-draft'); 
      navigation.navigate("MainTabs", {screen: "Feed"});
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add post");
    } finally {
      setLoading(false);
    }
  };

  // Helper to split images into rows of 3
  const getImageRows = () => {
    const rows = [];
    for (let i = 0; i < images.length; i += 3) {
      rows.push(images.slice(i, i + 3));
    }
    return rows;
  };


  return (
    
    <Container>
      <Header title="Add Post" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          {/* Post Type Selector */}
          <Text style={styles.label}>Post Type *</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                postType === "BookReview" && styles.typeButtonActive
              ]}
              onPress={() => setPostType("BookReview")}
            >
              <Text style={[
                styles.typeButtonText,
                postType === "BookReview" && styles.typeButtonTextActive
              ]}>
                Book Review
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                postType === "Discussion" && styles.typeButtonActive
              ]}
              onPress={() => setPostType("Discussion")}
            >
              <Text style={[
                styles.typeButtonText,
                postType === "Discussion" && styles.typeButtonTextActive
              ]}>
                Discussion
              </Text>
            </TouchableOpacity>
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
                placeholder="Enter discussion title"
                placeholderTextColor={theme.colors.muted}
              />
            </>
          )}

          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder={postType === "BookReview" ? "Write your review or thoughts..." : "Write your discussion content..."}
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

          {/* Image Picker */}
          <Text style={styles.label}>Images (max 3)</Text>
          <View style={styles.imagePickerGrid}>
            {getImageRows().map((row, rowIdx) => (
              <View key={rowIdx} style={styles.imageRow}>
                {row.map((img, idx) => (
                  <View key={img.uri} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(img.uri)}>
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {/* Add button in the row if not maxed out and this is the last row */}
                {rowIdx === getImageRows().length - 1 && images.length < MAX_IMAGES && (
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                    <Text style={styles.addImageText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {/* If no images, show add button in first row */}
            {images.length === 0 && (
              <View style={styles.imageRow}>
                <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                  <Text style={styles.addImageText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {images.length >= MAX_IMAGES && (
            <Text style={styles.imageLimitText}>You can select up to 3 images.</Text>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Post</Text>
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
                  setImages([]);
                
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
  imagePickerGrid: {
    marginBottom: theme.spacing.vertical.md,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 0,
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addImageButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  addImageText: {
    fontSize: 36,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  imageLimitText: {
    color: theme.colors.muted,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.vertical.sm,
    marginLeft: 2,
  },
});

export default AddPostScreen; 