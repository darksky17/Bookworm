import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  Alert,
  Platform,
  Image,
  Switch,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Geolocation from "react-native-geolocation-service";
import { useDispatch, useSelector } from "react-redux";
import {
  collection,
  setDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  getDoc,
  onSnapshot,
} from "@react-native-firebase/firestore";
import {
  setLocation,
  setUserState,
  setUnsubscribeUserListener,
  setPauseMatch,
} from "../redux/userSlice";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import geohash from "ngeohash";
import auth from "@react-native-firebase/auth";
import { getDistance } from "geolib";
import Icon from "react-native-vector-icons/FontAwesome";
import { db } from "../Firebaseconfig";
import moment from "moment";
import stringSimilarity from "string-similarity";

const MatchScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const location = useSelector((state) => state.user.location);
  const [matches, setMatches] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userDataa, setUserDataa] = useState(null);
  const Myuser = useSelector((state) => state.user);
  const unsubscribeRef = useRef(null);
  const pause = useSelector((state) => state.user.pauseMatch);

  const onToggleSwitch = async () => {
    const newValue = !pause; // Flip the current value
    if (pause) setScanning(false);
    dispatch(setPauseMatch(newValue)); // Update Redux state
    const userId = auth().currentUser.uid;

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, {
      pauseMatch: newValue,
    });
  };

  useEffect(() => {
    // Get the current user's phone number
    const user = auth().currentUser;
    if (!user) return; // No user — don’t continue
    const userPhoneNumber = auth().currentUser?.phoneNumber;
    const userId = auth().currentUser.uid;

    // Check if the phone number is valid
    if (!userPhoneNumber) return;

    userDocRef = doc(db, "Users", userId);

    // Set up a Firestore listener for real-time updates
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserDataa(docSnap.data()); // Update local state with real-time data
          //console.log('Real-time user data:', doc.data());
          const { lastUpdated, deletedAt, ...updatedData } = docSnap.data();
          dispatch(setUserState(updatedData));
        } else {
          console.warn("No user data found for this phone number.");
          setUserDataa(null);
          dispatch(setUserState({}));
        }
      },
      (error) => {
        console.error("Error fetching real-time updates:", error);
      }
    );
    dispatch(setUnsubscribeUserListener(unsubscribe));

    unsubscribeRef.current = unsubscribe;

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const scaleAnim = useState(new Animated.Value(1))[0];
  const matchAnim = useState(new Animated.Value(0))[0]; // For match pop effect
  let matchInterval = null;

  const calculateAge = (birthdate) => {
    if (!birthdate) return "N/A";
    const birthMoment = moment(birthdate, "DD/MM/YYYY");
    if (!birthMoment.isValid()) return "N/A";
    const age = moment().diff(birthMoment, "years");
    return age;
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (scanning) {
      if (pause) {
        setScanning(!scanning);
        Alert.alert(
          "You have paused matching, please turn on matching to find new friends"
        );

        return;
      }
      startScaleAnimation(); // Start book animation
      findNearbyUsers();
      matchInterval = setInterval(findNearbyUsers, 60 * 60 * 1000);
    } else {
      clearInterval(matchInterval);
      scaleAnim.setValue(1); // Reset book to static
      matchAnim.setValue(0); // Reset match animation
    }

    return () => clearInterval(matchInterval);
  }, [scanning]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (status === RESULTS.GRANTED) return true;
        Alert.alert("Permission Denied", "Enable location in settings.");
        return false;
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        dispatch(setLocation({ latitude, longitude }));

        const geoHash = geohash.encode(latitude, longitude, 10);
        const userId = auth().currentUser?.uid;

        if (userId) {
          const userRef = doc(db, "Users", userId);
          await updateDoc(userRef, {
            location: { latitude, longitude, geoHash },
            lastUpdated: serverTimestamp(),
          });
        }
      },
      (error) => console.error("Error getting location:", error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  function getGeohashPrefixLength(kilometers) {
    if (kilometers <= 0.5) return 9; // ~0.004 km
    if (kilometers <= 1) return 8; // ~0.019 km
    if (kilometers <= 5) return 7; // ~0.076 km
    if (kilometers <= 20) return 6; // ~0.61 km
    if (kilometers <= 80) return 5; // ~2.4 km
    if (kilometers <= 300) return 4; // ~20 km
    if (kilometers <= 1000) return 3; // ~78 km
    return 2; // ~630 km (for huge ranges)
  }
  const findNearbyUsers = async () => {
    if (!location) return;

    setShowMatches(false);
    matchAnim.setValue(0); // Reset match animation

    const { latitude, longitude } = location;
    const userGeohash = geohash.encode(latitude, longitude, 10);
    const kilometers = getGeohashPrefixLength(Myuser.distance);

    const geohashPrefix = userGeohash.substring(0, kilometers);

    try {
      const matchesRef = collection(db, "Users");
      const mainUserDocs = doc(db, "Users", auth().currentUser.uid);
      mainDocSnap = await getDoc(mainUserDocs);
      mainData = mainDocSnap.data();
      mainUserMatches = mainData.currentMatches;

      // Query users based on geohash range
      const q = query(
        matchesRef,
        where("location.geoHash", ">=", geohashPrefix),
        where("location.geoHash", "<=", geohashPrefix + "\uf8ff")
      );

      // Fetch the data
      const snapshot = await getDocs(q);
      let nearbyUsers = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        const userId = doc.id;
        if (userData.isDeleted || userData.pauseMatch) return;
        const age = calculateAge(userData.dateOfBirth);

        if (userId !== auth().currentUser?.uid) {
          const userLat = userData.location?.latitude;
          const userLng = userData.location?.longitude;

          if (userLat && userLng) {
            const distance_user = getDistance(
              { latitude, longitude },
              { latitude: userLat, longitude: userLng }
            );

            console.log(age);
            console.log(mainData.ageMax);
            console.log(mainData.ageMin);
            if (
              distance_user <= Myuser.distance * 1000 &&
              !mainUserMatches.includes(userId) &&
              age >= mainData.ageMin &&
              age <= mainData.ageMax
            ) {
              nearbyUsers.push({ id: userId, ...userData, distance_user });
            }
          }
        }
      });
      const scoredUsers = [];

      nearbyUsers.forEach((user) => {
        let score = 0;
        const commonAuthors = user.favAuthors?.filter((author) =>
          mainData.favAuthors?.includes(author)
        );
        const commonGenres = user.favGenres?.filter((genre) =>
          mainData.favGenres?.includes(genre)
        );

        score += (commonAuthors?.length || 0) * 5; // max 15
        score += (commonGenres?.length || 0) * 5; // max 15

        if (user.favBook && user.favBook === mainData.favBook) score += 10;

        const summarySimilarity = stringSimilarity.compareTwoStrings(
          user.favBookSummary?.toLowerCase() || "",
          mainData.favBookSummary?.toLowerCase() || ""
        );
        score += Math.round(summarySimilarity * 10); // max 10

        const distanceKm = user.distance_user / 1000;
        if (distanceKm <= 5) score += 5;
        else if (distanceKm <= 15) score += 3;
        else if (distanceKm <= 30) score += 1;

        const maxScore = 55;
        const matchPercentage = Math.round((score / maxScore) * 100);

        if (score >= 20) {
          scoredUsers.push({
            ...user,
            matchScore: score,
            matchPercentage,
          });
        }
      });

      nearbyUsers = scoredUsers.sort((a, b) => b.matchScore - a.matchScore);

      nearbyUsers.sort((a, b) => a.distance_user - b.distance_user);

      setTimeout(() => {
        setMatches(nearbyUsers);
        setShowMatches(true);

        // Start pop-out animation for matches
        Animated.timing(matchAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, 2500);
    } catch (error) {
      console.error("Error finding nearby users:", error);
    }
  };

  const startScaleAnimation = () => {
    scaleAnim.setValue(1);
    Animated.timing(scaleAnim, {
      toValue: 1.5, // Scale to max value
      duration: 2000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const openChatModal = (match) => {
    setSelectedMatch(match);
    setShowChatModal(true);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setSelectedMatch(null);
  };

  const newChat = async (userId, friendId) => {
    console.log("This is friend Id", friendId);

    const userDocRef = doc(db, "Users", userId);
    const friendDocRef = doc(db, "Users", friendId);
    const userSnap = await getDoc(userDocRef);
    const friendSnap = await getDoc(friendDocRef);

    const data = userSnap.data();
    const friend_data = friendSnap.data();

    const currentMatches = data.currentMatches || [];
    const friendCurrentMatches = friend_data.currentMatches || [];

    // Step 2: Avoid duplicates
    if (!currentMatches.includes(friendId)) {
      const updatedMatches = [...currentMatches, friendId];
      const friendUpdatedMatches = [...friendCurrentMatches, userId];

      // Step 3: Update Firestore
      await updateDoc(userDocRef, {
        currentMatches: updatedMatches,
      });

      await updateDoc(friendDocRef, {
        currentMatches: friendUpdatedMatches,
      });
    }

    const chatsRef = collection(db, "Chats");
    await addDoc(chatsRef, {
      participants: [userId, friendId],
      ascended: false,
      lastMessage: "",
      timestamp: serverTimestamp(),
      choices: [],
      unreadCounts: {
        [userId]: 0,
        [friendId]: 0,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <Text style={styles.title}>Find Bookworms</Text>

        <View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {scanning
                ? "Searching for matches..."
                : "Tap to start finding matches"}
            </Text>
            <Switch
              value={scanning}
              onValueChange={(value) => {
                setScanning(value);
                if (!value) setMatches([]); // Clear matches when turning off
              }}
            />
          </View>
        </View>
      </View>

      {/* Animated Book */}
      <Animated.View
        style={[styles.loadingContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        <Image
          source={require("../assets/matchscreenload-unscreen.gif")}
          style={styles.loadingGif}
        />
      </Animated.View>

      {/* Matches List with Pop-out Animation */}
      {showMatches && (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.displayName}
          numColumns={3}
          contentContainerStyle={styles.matchList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openChatModal(item)}
              style={({ pressed }) => [
                styles.matchItem,
                pressed, // Add press feedback without interfering with animation
              ]}
            >
              <Animated.View
                style={{
                  opacity: matchAnim, // Apply opacity animation
                  transform: [{ scale: matchAnim }], // Apply scaling animation
                }}
              >
                <Icon name="user-circle" size={50} color="lightgreen" />
                <Text style={styles.matchDistance}>
                  {(item.distance_user / 1000).toFixed(1)} km |{" "}
                  {item.matchPercentage}% match
                </Text>
              </Animated.View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.noMatches}>No matches found nearby.</Text>
          }
        />
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <Modal
          transparent={true}
          visible={showChatModal}
          animationType="fade"
          onRequestClose={closeChatModal}
        >
          <TouchableWithoutFeedback onPress={closeChatModal}>
            <View style={styles.modalBackground}>
              <Pressable style={styles.chatPrompt}>
                <Text style={styles.chatPromptText}>
                  Do you want to start a chat?
                </Text>
                <Pressable
                  onPress={() => {
                    newChat(auth().currentUser?.uid, selectedMatch.id);
                    setScanning(false);
                    setTimeout(() => {
                      navigation.navigate("Chats");
                    }, 500);
                  }}
                >
                  <Text style={styles.chatPromptButton}>Start Chat!</Text>
                </Pressable>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>
          Want to take a break? Go off the book here
        </Text>
        <Switch value={pause} onValueChange={onToggleSwitch} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 50,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  switchText: {
    fontSize: 16,
    marginRight: 10,
  },
  loadingContainer: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  loadingGif: {
    width: 150,
    height: 150,
    top: 45,
  },
  matchList: {
    width: "90%",
    alignItems: "center",
    //backgroundColor: 'transparent',
  },
  matchItem: {
    alignItems: "center",
    margin: 10,
    padding: 15,
    //borderRadius: 15,
    //backgroundColor: 'white',
    elevation: 3,
  },

  matchName: {
    fontSize: 14,
    marginTop: 5,
  },
  matchDistance: {
    fontSize: 12,
    color: "gray",
    left: 10,
  },
  noMatches: {
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  chatPrompt: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  chatPromptText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  chatPromptButton: {
    fontSize: 16,
    color: "blue",
  },
});

export default MatchScreen;
