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
import { auth, db, collection, addDoc, doc } from "../Firebaseconfig";

const AddBookShelf = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState("");
    const [selectedBook, setSelectedBook] = useState("");


    const saveBookShelf = async () => {

        try {
            const parentDocRef = doc(db, "Users", auth.currentUser.uid);


            const subCollectionRef = collection(parentDocRef, "Bookshelf");


            const response = await addDoc(subCollectionRef, {
                title: selectedBook.value,
                author: selectedBook.author,
                coverImage: selectedBook.thumbnail,
                status: status,
                addedAt: new Date(),
            });

            if (response.id) {
                navigation.goBack();
            }
        } catch (e) {
            console.log("Soemthign went wrong while updating bookshelf", e);
        }

    }

    return (
        <Container containerStyle={{ paddingBottom: insets.bottom }}>

            <View style={{ flexDirection: "row", alignItems: "flex-start", padding: theme.spacing.horizontal.xs }}>
                <Pressable style={{ flex: 0.5 }} onPress={() => { navigation.goBack(); }}><Entypo name="cross" size={20} color="black" /></Pressable>
                <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.medium, fontWeight: "bold" }}>Add a Book </Text>
            </View>
            {selectedBook.length < 1 ? (
                <View style={{ justifyContent: "center", alignItems: "center" }}><Image
                    source={require("../assets/addbookshelfImage.png")}
                    style={{
                        width: horizontalScale(250),
                        height: verticalScale(300),
                        borderRadius: theme.borderRadius.sm,
                    }}
                    resizeMode="contain"
                />
                </View>
            ) : (<View style={{ flex: 0.2, justifyContent: "center" }}>
                <View style={{ gap: 50 }}>
                    <Text style={{ fontWeight: "bold", fontSize: theme.fontSizes.medium, color: theme.colors.text, alignSelf: "center" }}>You selected:</Text>
                    <View style={{ flexDirection: "row", justifyContent: "center" }}>
                        <Image
                            source={{ uri: selectedBook.thumbnail }}
                            height={60} width={60}
                            resizeMode="contain"
                        />
                        <View>
                            <Text>{selectedBook.value}</Text>
                            <Text>{selectedBook.author} | {selectedBook.pageCount} pages</Text>
                        </View>
                    </View>
                </View>

            </View>)}

            <View style={{ flex: 0.6, justifyContent: "center", gap: 10, paddingHorizontal: 5 }}>
                {/* <View style={{ flexDirection: "row", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, padding: 12 }}>
                    <Text> Select a Book</Text>
                    <View >
                        <Entypo name="chevron-thin-down" size={12} color="black" />
                    </View>
                </View> */}
                <AddToShelf
                    placeholder={selectedBook && selectedBook.label ? selectedBook.label : "Search Books"}
                    onBookSelect={setSelectedBook}
                />

                <Dropdown data={[{ label: "Currently Reading", value: "Current" }, { label: "Finished Reading", value: "Finished" }, { label: "To be Read", value: "Tobe" }]}
                    style={{ borderRadius: 10, borderWidth: 1, padding: 12 }}
                    onChange={(item) => { setStatus(item.value) }}
                    placeholder="Select Status"
                    labelField="label"
                    valueField="value"
                    selectedTextStyle={{ fontWeight: "bold" }}
                    containerStyle={{ borderRadius: 10 }}
                    activeColor={theme.colors.primary}
                    value={status}
                    maxHeight={300} />

            </View>

            <View style={{ justifyContent: "flex-end", paddingHorizontal: theme.spacing.horizontal.sm }}>
                <Button disabled={!status || selectedBook.length < 1} onPress={() => { saveBookShelf() }} mode="contained" textColor={theme.colors.text} buttonColor={theme.colors.primary}>Save</Button>
            </View>
        </Container>
    )

};

const styles = StyleSheet.create({

})

export default AddBookShelf;