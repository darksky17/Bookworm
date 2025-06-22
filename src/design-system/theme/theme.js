import { scale } from "./scaleUtils";
import { Text, View, StatusBar, Image, Platform } from "react-native";

const theme = {
  colors: {
    primary: "#98FF98",
    secondary: "#50E3C2",
    background: "#F9F9F9",
    text: "#1A1A1A",
    muted: "#888888",
    error: "#E94E77",
  },
  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  },
  fontSizes: {
    small: scale(12),
    medium: scale(16),
    large: scale(20),
    xl: scale(24),
    title: scale(28),
  },
  borderRadius: {
    sm: scale(4),
    md: scale(8),
    lg: scale(16),
  },
  fontFamily: {
    regular: Platform.OS === "ios" ? "Helvetica" : "Roboto",
    bold: Platform.OS === "ios" ? "Helvetica-Bold" : "Roboto-Bold",
  },
};

export default theme;
