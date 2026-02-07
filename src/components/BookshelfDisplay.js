import { View, Text, Image } from "react-native";
import theme from "../design-system/theme/theme";
const BookshelfDisplay = ({ data }) => {
    return (
        <View style={{ flex: 1, overflow: "hidden", paddingHorizontal: theme.spacing.horizontal.sm, gap: 20 }} f>
            {data.length === 0 ? (
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold", color: theme.colors.muted, fontSize: theme.fontSizes.medium }}>No Books have been added yet.</Text>
                </View>
            ) : (
                <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                    {data.map((book) => (

                        <View style={{ width: "33.33%", padding: 8 }}>
                            <Image
                                source={{ uri: book.coverImage?.replace("http://", "https://") }}
                                style={{ height: 120, width: "100%" }}
                                resizeMode="contain"
                            />
                        </View>

                    ))}
                </View>
            )}
        </View>

    )
}

export default BookshelfDisplay;