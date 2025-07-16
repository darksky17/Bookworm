import { horizontalScale, verticalScale, moderateScale } from "./scaleUtils";
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
    vertical: {
      xs: verticalScale(4),
      sm: verticalScale(8),
      md: verticalScale(16),
      lg: verticalScale(24),
      xl: verticalScale(32),
      xxl: verticalScale(48),
    },
    horizontal: {
      xs: horizontalScale(4),
      sm: horizontalScale(8),
      md: horizontalScale(16),
      lg: horizontalScale(24),
      xl: horizontalScale(32),
      xxl: horizontalScale(48),
    },
  },
  fontSizes: {
    xs:moderateScale(10),
    small: moderateScale(12),
    medium: moderateScale(16),
    large: moderateScale(20),
    xl: moderateScale(24),
    title: moderateScale(28),
  },
  borderRadius: {
    sm: moderateScale(4),
    md: moderateScale(8),
    lg: moderateScale(16),
  },
  fontFamily: {
    regular: Platform.OS === "ios" ? "Helvetica" : "Roboto",
    bold: Platform.OS === "ios" ? "Helvetica-Bold" : "Roboto-Bold",
  },
};

export default theme;
