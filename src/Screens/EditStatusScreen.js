import Container from "../components/Container";
import { Text, View, Modal, StyleSheet, TouchableOpacity, Pressable, Image } from "react-native";
import theme from "../design-system/theme/theme";
import { Dropdown } from "react-native-element-dropdown";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Entypo from '@expo/vector-icons/Entypo';
import AddToShelf from "../components/addToShelf";
import { horizontalScale, verticalScale } from "../design-system/theme/scaleUtils";
import { Button } from "react-native-paper";
import { auth, db, collection, addDoc, doc, updateDoc } from "../Firebaseconfig";

const EditStatusScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState("");
    const { book } = route.params;

    console.log(book);
    const saveBookShelf = async () => {

        try {
            const parentDocRef = doc(db, "Users", auth.currentUser.uid);


            const subCollectionRef = collection(parentDocRef, "Bookshelf");
            const specificDoc = doc(subCollectionRef, book.id)


            const response = await updateDoc(specificDoc, {
                status: status,
            });


            navigation.goBack();

        } catch (e) {
            console.log("Soemthign went wrong while updating bookshelf", e);
        }

    }

    return (
        <Container containerStyle={{ paddingBottom: insets.bottom }}>

            <View style={{ flexDirection: "row", alignItems: "flex-start", padding: theme.spacing.horizontal.xs }}>
                <Pressable style={{ flex: 0.5 }} onPress={() => { navigation.goBack(); }}><Entypo name="cross" size={20} color="black" /></Pressable>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.medium, fontWeight: "bold" }}>Edit Status </Text>
            </View>


            <View style={{ flex: 0.6, justifyContent: "center", gap: 10, paddingHorizontal: 5 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, padding: 12 }}>
                    <Text> Selected Book:</Text>

                    <Text>{book.title}</Text>

                </View>
                {/* <AddToShelf
                    placeholder={selectedBook && selectedBook.label ? selectedBook.label : "Search Books"}
                    onBookSelect={setSelectedBook}
                /> */}

                <Dropdown data={[{ label: "Currently Reading", value: "Current" }, { label: "Finished Reading", value: "Finished" }, { label: "To be Read", value: "Tobe" }]}
                    style={{ borderRadius: 10, borderWidth: 1, padding: 12 }}
                    onChange={(item) => { setStatus(item.value) }}
                    placeholder={status ? `New Status: ${status}` : `Current Status: ${book.status}`}
                    labelField="label"
                    valueField="value"
                    selectedTextStyle={{ fontWeight: "bold" }}
                    containerStyle={{ borderRadius: 10 }}
                    activeColor={theme.colors.primary}
                    value={status}
                    maxHeight={300} />

            </View>

            <View style={{ justifyContent: "flex-end", paddingHorizontal: theme.spacing.horizontal.sm }}>
                <Button disabled={!status} onPress={() => { saveBookShelf() }} mode="contained" textColor={theme.colors.text} buttonColor={theme.colors.primary}>Save</Button>
            </View>
        </Container>
    )

};

const styles = StyleSheet.create({

})

export default EditStatusScreen;