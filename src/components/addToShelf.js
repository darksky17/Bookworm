import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import Entypo from '@expo/vector-icons/Entypo';
import BookSearchModal from "./bookSearchModal";
const AddToShelf = ({ placeholder = "Search or pick a book",
    value = "",
    onBookSelect,
    modalTitle = "Search Books",
    modalPlaceholder = "Type book title or author...",
    style, }) => {

    const [showModal, setShowModal] = useState(false);

    const handleBookSelect = (bookTitle, bookAuthor) => {
        if (onBookSelect) {
            onBookSelect(bookTitle, bookAuthor);
        }
    };

    return (
        <Pressable onPress={() => { setShowModal(true) }} style={{ flexDirection: "row", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, padding: 12 }}>
            <Text>{placeholder}</Text>
            <View >
                <Entypo name="chevron-thin-down" size={12} color="black" />
            </View>

            <BookSearchModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                onSelectBook={handleBookSelect}
                currentSelection={value}
                title={modalTitle}
                placeholder={modalPlaceholder}
                isbookshelf={true}
            />
        </Pressable>
    )
}

export default AddToShelf;