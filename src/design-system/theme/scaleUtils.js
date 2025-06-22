import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const guidelineBaseWidth = 390; // use the width of your base design (e.g. iPhone 12)

export const scale = (size) => (width / guidelineBaseWidth) * size;
