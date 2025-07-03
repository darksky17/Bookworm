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
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  db,
  auth,
} from "../Firebaseconfig.js";
import {
  setLocation,
  setUserState,
  setUnsubscribeUserListener,
  setPauseMatch,
} from "../redux/userSlice";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import geohash from "ngeohash";
import Icon from "react-native-vector-icons/FontAwesome";
import { SERVER_URL } from "../constants/api";
import { scaleFont } from "../utils/responsiveFont";
import Container from "../components/Container.js";
import Header from "../components/Header.js";
import theme from "../design-system/theme/theme.js";
import { Button } from "react-native-paper";
import {
  verticalScale,
  moderateScale,
  horizontalScale,
} from "../design-system/theme/scaleUtils.js";
import { useNearbyUsers } from "../hooks/useNearbyUsers.js";
import { useQueryClient } from "@tanstack/react-query";
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
  const scanningRef = useRef(scanning);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  const {
    data: matche = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useNearbyUsers(
    Myuser.location,
    Myuser.distance,
    Myuser.ageMin,
    Myuser.ageMax,
    scanning && !pause
  );

  const onToggleSwitch = async () => {
    const newValue = !pause; // Flip the current value
    if (pause) setScanning(false);
    if (newValue) {
      setScanning(false);
      setMatches([]);
      setShowMatches(false);
    }
    dispatch(setPauseMatch(newValue)); // Update Redux state
    const userId = auth.currentUser.uid;

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, {
      pauseMatch: newValue,
    });
  };

  useEffect(() => {
    // Get the current user's phone number
    const user = auth.currentUser;
    if (!user) return; // No user — don’t continue
    const userPhoneNumber = auth.currentUser?.phoneNumber;
    const userId = auth.currentUser.uid;

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

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (scanning) {
      if (pause) {
        setScanning(false);
        Alert.alert(
          "You have paused matching, please turn on matching to find new friends"
        );
        return;
      }

      // Start the book scaling animation when scanning begins
      startBookScaleAnimation();
    } else {
      // Reset everything when scanning stops
      resetAnimations();
    }
  }, [scanning]);

  useEffect(() => {
    // Handle loading state changes during scanning
    if (scanning && !pause && !isFetching) {
      if (!isLoading) {
        // Data has loaded, but we need to wait for minimum animation time
        checkAndShowMatches();
      }
      // If isLoading is true, keep the book scaled (do nothing)
    }
  }, [isLoading, scanning, pause, isFetching]);

  const startBookScaleAnimation = () => {
    // Reset states
    setShowMatches(false);
    setMatches([]);
    matchAnim.setValue(0);

    // Record the start time for minimum duration enforcement
    const animationStartTime = Date.now();

    // Start scaling the book
    scaleAnim.setValue(1);
    Animated.timing(scaleAnim, {
      toValue: 1.5,
      duration: 2500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      // Animation completed after 2.5 seconds
      // Check if we should show matches now
      if (scanningRef.current && !pause && !isLoading && !isFetching) {
        showMatchesWithAnimation();
      }
    });

    // Store start time for reference
    scanningRef.animationStartTime = animationStartTime;
  };

  const checkAndShowMatches = () => {
    if (!scanningRef.animationStartTime) return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - scanningRef.animationStartTime;
    const minimumDuration = 2500; // 2.5 seconds

    if (elapsedTime >= minimumDuration) {
      // Minimum time has passed, show matches immediately
      showMatchesWithAnimation();
    } else {
      // Wait for remaining time, then show matches
      const remainingTime = minimumDuration - elapsedTime;
      setTimeout(() => {
        if (scanningRef.current && !pause) {
          showMatchesWithAnimation();
        }
      }, remainingTime);
    }
  };

  const showMatchesWithAnimation = () => {
    // Reset book scale
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      // Only proceed if still scanning
      if (scanningRef.current && !pause && !isFetching) {
        setShowMatches(true);
        setMatches(matche);

        // Start match animation
        Animated.timing(matchAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const resetAnimations = () => {
    // Clear the animation start time
    scanningRef.animationStartTime = null;

    // Reset book scale immediately
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Reset match animation
    matchAnim.setValue(0);
    setShowMatches(false);
    setMatches([]);
  };
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
        const userId = auth.currentUser?.uid;

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

  const openChatModal = (match) => {
    setSelectedMatch(match);
    setShowChatModal(true);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setSelectedMatch(null);
  };

  const newChat = async (friendId) => {
    console.log("This is friend Id", friendId);

    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch(`${SERVER_URL}/new-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        friendId: friendId,
      }),
    });
  };

  return (
    <Container>
      <Header title={"BookWorm"} />
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
                  setShowMatches(value);
                  if (!value) setMatches([]); // Clear matches when turning off
                }}
              />
            </View>
          </View>
        </View>

        {/* Animated Book */}

        {!showMatches && (
          <Animated.View
            style={[
              styles.loadingContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Image
              source={require("../assets/matchscreenload-unscreen.gif")}
              style={styles.loadingGif}
            />
          </Animated.View>
        )}

        {/* Matches List with Pop-out Animation */}
        {showMatches && (
          <View
            style={{
              flex: 1,
              paddingHorizontal: theme.spacing.horizontal.sm,
              paddingTop: theme.spacing.vertical.md,
            }}
          >
            <FlatList
              data={matches.slice(0, 5)}
              keyExtractor={(item) => item.uid}
              numColumns={1}
              contentContainerStyle={styles.matchList}
              renderItem={({ item }) => (
                <View style={styles.matchItem}>
                  <Animated.View
                    style={{
                      opacity: matchAnim, // Apply opacity animation
                      transform: [{ scale: matchAnim }], // Apply scaling animation
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          gap: horizontalScale(10),
                        }}
                      >
                        <Icon
                          name="user-circle"
                          size={50}
                          color={theme.colors.primary}
                        />
                        <View
                          style={{
                            gap: verticalScale(5),
                            justifyContent: "flex-end",
                          }}
                        >
                          <Text
                            style={{
                              color: theme.colors.text,
                              fontFamily: theme.fontFamily.regular,
                              fontSize: moderateScale(14),
                            }}
                          >
                            {item.displayName}
                          </Text>
                          <Text style={styles.matchDistance}>
                            {item.distance.toFixed(1)} km |{" "}
                            {item.matchPercentage}% match
                          </Text>
                        </View>
                      </View>

                      <Button
                        onPress={() => openChatModal(item)}
                        mode="contained"
                      >
                        Connect
                      </Button>
                    </View>
                  </Animated.View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.noMatches}>No matches found nearby.</Text>
              }
            />
          </View>
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
                      newChat(selectedMatch.uid);
                      setScanning(false);
                      setShowMatches(false);
                      setShowChatModal(false);
                      setTimeout(() => {
                        navigation.navigate("Chats");
                      }, 700);
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
          <Switch
            color={theme.colors.primary}
            value={pause}
            onValueChange={onToggleSwitch}
          />
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: verticalScale(50),
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.vertical.lg,
  },
  title: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(15),
    paddingTop: theme.spacing.vertical.lg,
    paddingHorizontal: theme.spacing.horizontal.md,
  },
  switchText: {
    fontSize: theme.fontSizes.medium,
  },
  loadingContainer: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  loadingGif: {
    width: horizontalScale(150),
    height: verticalScale(150),
    top: verticalScale(45),
  },
  matchList: {
    backgroundColor: "white",
    padding: theme.spacing.horizontal.sm,
    elevation: 3,
    borderRadius: theme.borderRadius.md,
  },
  matchItem: {
    // backgroundColor: "white",
    // elevation: 2,
    padding: theme.spacing.vertical.md,
    paddingHorizontal: theme.spacing.horizontal.sm,
  },

  matchDistance: {
    fontSize: theme.fontSizes.small,
    color: "gray",
    left: horizontalScale(10),
  },
  noMatches: {
    fontSize: theme.fontSizes.medium,
    color: "gray",
    marginTop: verticalScale(20),
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  chatPrompt: {
    backgroundColor: "white",
    paddingVertical: verticalScale(20),
    paddingHorizontal: verticalScale(20),
    borderRadius: moderateScale(10),
    alignItems: "center",
    elevation: 5,
  },
  chatPromptText: {
    fontSize: theme.fontSizes.medium,
    fontWeight: "bold",
    marginBottom: verticalScale(10),
  },
  chatPromptButton: {
    fontSize: theme.fontSizes.medium,
    color: "blue",
  },
});

export default MatchScreen;
