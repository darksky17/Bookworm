import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Easing, Alert, Platform, Image, Switch, Pressable, Modal, TouchableWithoutFeedback
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useDispatch, useSelector } from 'react-redux';
import { collection, setDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, addDoc, getDoc } from '@react-native-firebase/firestore';
import { setLocation } from '../redux/userSlice';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import geohash from 'ngeohash';
import auth from '@react-native-firebase/auth';
import { getDistance } from 'geolib';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from '../Firebaseconfig';
import  Container  from '../components/Container';
import Header from '../components/Header';

const MatchScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const location = useSelector((state) => state.user.location);
  const [matches, setMatches] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  

  const scaleAnim = useState(new Animated.Value(1))[0];
  const matchAnim = useState(new Animated.Value(0))[0]; // For match pop effect
  let matchInterval = null;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (scanning) {
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
      if (Platform.OS === 'android') {
        const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (status === RESULTS.GRANTED) return true;
        Alert.alert('Permission Denied', 'Enable location in settings.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
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
      (error) => console.error('Error getting location:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const findNearbyUsers = async () => {
    if (!location) return;

    setShowMatches(false);
    matchAnim.setValue(0); // Reset match animation

    const { latitude, longitude } = location;
    const userGeohash = geohash.encode(latitude, longitude, 10);
    const geohashPrefix = userGeohash.substring(0, 6);

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

        if (userId !== auth().currentUser?.uid) {
          const userLat = userData.location?.latitude;
          const userLng = userData.location?.longitude;

          if (userLat && userLng) {
            const distance = getDistance(
              { latitude, longitude },
              { latitude: userLat, longitude: userLng }
            );

            if (distance <= 10000 && !mainUserMatches.includes(userId)) {
              console.log("FRESH nearbyuser", nearbyUsers);
              nearbyUsers.push({ id: userId, ...userData, distance });
            }
          }
        }
      });

      nearbyUsers.sort((a, b) => a.distance - b.distance);

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
      console.error('Error finding nearby users:', error);
    }
  };

  const startScaleAnimation = () => {
    scaleAnim.setValue(1);
    Animated.timing(scaleAnim, {
      toValue: 1.5,  // Scale to max value
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

    const newChat = async (userId, friendId)=>{ 
       console.log("This is friend Id", friendId);

       const userDocRef = doc(db, "Users", userId);
       const userSnap = await getDoc(userDocRef);
     
        
         const data = userSnap.data();
         console.log("I DID REACH HERE", data);
         const currentMatches = data.currentMatches || [];
     
         // Step 2: Avoid duplicates
         if (!currentMatches.includes(friendId)) {
           const updatedMatches = [...currentMatches, friendId];
     
           // Step 3: Update Firestore
           await updateDoc(userDocRef, {
             currentMatches: updatedMatches,
           });
         }
       

      const chatsRef = collection(db, "Chats");
      await addDoc(chatsRef, {
                  participants: [userId, friendId],
                  ascended: false,
                  lastMessage: "",
                  timestamp: serverTimestamp(),
                  choices: [],
              });
            };

  return (
   
    
    <View style={styles.container}>
    
      
      <Text style={styles.title}>Find Bookworms</Text>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>{scanning ? 'Searching for matches...' : 'Tap to start finding matches'}</Text>
        <Switch
          value={scanning}
          onValueChange={(value) => {
            setScanning(value);
            if (!value) setMatches([]); // Clear matches when turning off
          }}
        />
      </View>

      {/* Animated Book */}
      <Animated.View style={[styles.loadingContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={require('../assets/matchscreenload-unscreen.gif')} style={styles.loadingGif} />
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
                pressed,  // Add press feedback without interfering with animation
              ]}
            >
              <Animated.View
                style={{
                  opacity: matchAnim,  // Apply opacity animation
                  transform: [{ scale: matchAnim }],  // Apply scaling animation
                }}
              >
                <Icon name="user-circle" size={50} color="lightgreen" />
                <Text style={styles.matchDistance}>{(item.distance / 1000).toFixed(1)} km</Text>
              </Animated.View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.noMatches}>No matches found nearby.</Text>}
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
                <Pressable onPress={()=>{newChat(auth().currentUser?.uid, selectedMatch.id); navigation.navigate("ChatScreenList");}}>
                  <Text style={styles.chatPromptButton}>Start Chat!</Text>
                </Pressable>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
   
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchText: {
    fontSize: 16,
    marginRight: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
  loadingGif: {
    width: 150,
    height: 150,
    top: 45,
  },
  matchList: {
    width: '90%',
    alignItems: 'center',
    //backgroundColor: 'transparent',
  },
  matchItem: {
    alignItems: 'center',
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
    color: 'gray',
    left: 10
  },
  noMatches: {
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatPrompt: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  chatPromptText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chatPromptButton: {
    fontSize: 16,
    color: 'blue',
  },
});

export default MatchScreen;