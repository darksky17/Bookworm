import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Based on standard mobile screen width (e.g., iPhone 12 = 390)
const guidelineBaseWidth = 390;

export const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / guidelineBaseWidth;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
