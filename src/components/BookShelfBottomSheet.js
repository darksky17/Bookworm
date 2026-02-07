import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    View,
    Text,
    Share,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    Modal,
    BackHandler,
    StatusBar,
    Keyboard,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import useFetchChats from "../hooks/useFetchChats.js";
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SHARE_PREFIX } from "../constants/api.js";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
    verticalScale,
    horizontalScale,
    moderateScale,
} from "../design-system/theme/scaleUtils.js";
import theme from "../design-system/theme/theme.js";
import { Button } from "react-native-paper";
import Clipboard from '@react-native-clipboard/clipboard';
import { collection, db, auth, serverTimestamp, increment, doc, addDoc, updateDoc, deleteDoc } from "../Firebaseconfig.js";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const BookShelfBottomSheet = ({ book, onClose, bottomSheetRef, bottomSheetVisible, navigation }) => {



    useEffect(() => {
        const backAction = () => {
            if (bottomSheetVisible) {
                bottomSheetRef.current.close()
                onClose(); // Call your onClose function
                return true; // Prevent default behavior
            }
            return false; // Allow default behavior
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [bottomSheetVisible, onClose]);


    const handleDelete = async () => {
        try {
            const parentDocRef = doc(db, "Users", auth.currentUser.uid);


            const subCollectionRef = collection(parentDocRef, "Bookshelf");
            const specificDoc = doc(subCollectionRef, book.id)


            await deleteDoc(specificDoc);
            bottomSheetRef.current.close()
            onClose(); // Call your onClose function
        } catch (e) {
            console.log("Something went wrong while deleting doc", e);
        }
    }

    const deleteBook = async () => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to Delete this book from your bookshelf?",
            [
                {
                    text: "No",
                    style: "cancel",
                },
                {
                    text: "Yes",
                    onPress: () => { handleDelete(); } // run your function
                }
            ],
            { cancelable: true } // true allows dismiss on tapping outside (optional)
        );
    }







    return (


        <BottomSheet
            ref={bottomSheetRef}
            index={bottomSheetVisible ? 0 : -1} // -1 to hide, 0+ to show
            snapPoints={['45%']}
            enablePanDownToClose={true}
            onClose={onClose}
        >
            <BottomSheetView>
                <View style={{ flex: 1, padding: horizontalScale(20), gap: 15 }}>
                    <Pressable onPress={() => { navigation.navigate("EditStatusScreen", { book: book }) }} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                        <AntDesign name="edit" size={24} color="black" />
                        <Text style={{ fontWeight: "bold", color: theme.colors.text, fontSize: theme.fontSizes.medium }}>Edit Status</Text>
                        <View style={{ backgroundColor: theme.colors.secondary, marginLeft: "auto", borderColor: theme.colors.primary, borderWidth: 2, padding: 5, borderRadius: 8 }}>
                            <Text style={{ fontSize: theme.fontSizes.xs }}>{book.status}</Text>
                        </View>
                    </Pressable>
                    <Pressable onPress={() => { deleteBook() }} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                        <FontAwesome name="trash-o" size={24} color={theme.colors.error} />
                        <Text style={{ color: theme.colors.error, fontSize: theme.fontSizes.medium }}> Delete Book</Text>

                    </Pressable>

                </View>

            </BottomSheetView>



        </BottomSheet>


    )
};

const styles = StyleSheet.create({
    avatarContainer_list: {
        width: horizontalScale(40), // was 40
        height: verticalScale(40), // was 40
        borderRadius: moderateScale(20), // was 20
        backgroundColor: theme.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: theme.spacing.horizontal.xs, // was sm

    },
    avatarText_list: {
        fontSize: theme.fontSizes.medium, // was medium
        fontFamily: theme.fontFamily.bold,
        color: theme.colors.text,
    },
});

export default BookShelfBottomSheet;