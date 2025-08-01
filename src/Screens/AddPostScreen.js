import React, { useEffect, useState } from "react";
import { View, Text, BackHandler, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, Keyboard, Image, Pressable } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from "react-redux";
import { auth } from "../Firebaseconfig";
import { SERVER_URL} from "../constants/api";
import Container from "../components/Container";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { horizontalScale, moderateScale, verticalScale } from "../design-system/theme/scaleUtils";
import { Button, Modal as PModal } from "react-native-paper";
import storage from "@react-native-firebase/storage";
import BookSelector from "../components/bookSelector";
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
;
  const [discardModal, setDiscardModal] = useState(false);


  // Image picker state
  const [images, setImages] = useState([]); // array of {uri, ...}

  const handleBookSelect=(bookTitle, bookAuthor)=>{
   setBookTitle(bookTitle);
   setBookAuthor(bookAuthor);
   console.log(bookAuthor);
  
  }


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
              
               <BookSelector
                        placeholder="Search by title or author"
                        value=
                          { bookTitle!=="" ?
                          `${bookTitle} by ${bookAuthor}`:""}
                        onBookSelect={handleBookSelect}
                      />
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