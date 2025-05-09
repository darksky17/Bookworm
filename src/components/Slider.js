import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMB_SIZE = 24;
const TRACK_PADDING = 16;
const MIN_VALUE = 18;
const MAX_VALUE = 100;
const MIN_SPACING = THUMB_SIZE; // minimum distance between thumbs

// total draggable translation length (thumb-to-thumb)
const TRACK_LENGTH = SCREEN_WIDTH - 2 * TRACK_PADDING - THUMB_SIZE;

const RangeSlider = ({
  initialMin = MIN_VALUE,
  initialMax = MAX_VALUE,
  onValuesChange = () => {},
}) => {
  // initialize shared values from props
  const leftX = useSharedValue(
    ((initialMin - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * TRACK_LENGTH
  );
  const rightX = useSharedValue(
    ((initialMax - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * TRACK_LENGTH
  );

  const panLeft = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.start = leftX.value;
    },
    onActive: (e, ctx) => {
      const next = ctx.start + e.translationX;
      leftX.value = Math.max(0, Math.min(next, rightX.value - MIN_SPACING));
    },
    onEnd: () => {
      "worklet";
      const l = Math.round(
        MIN_VALUE + (leftX.value / TRACK_LENGTH) * (MAX_VALUE - MIN_VALUE)
      );
      const r = Math.round(
        MIN_VALUE + (rightX.value / TRACK_LENGTH) * (MAX_VALUE - MIN_VALUE)
      );
      runOnJS(onValuesChange)(l, r);
    },
  });

  const panRight = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.start = rightX.value;
    },
    onActive: (e, ctx) => {
      const next = ctx.start + e.translationX;
      rightX.value = Math.max(
        leftX.value + MIN_SPACING,
        Math.min(next, TRACK_LENGTH)
      );
    },
    onEnd: () => {
      "worklet";
      const l = Math.round(
        MIN_VALUE + (leftX.value / TRACK_LENGTH) * (MAX_VALUE - MIN_VALUE)
      );
      const r = Math.round(
        MIN_VALUE + (rightX.value / TRACK_LENGTH) * (MAX_VALUE - MIN_VALUE)
      );
      runOnJS(onValuesChange)(l, r);
    },
  });

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }],
  }));
  const selectedStyle = useAnimatedStyle(() => ({
    left: leftX.value + THUMB_SIZE / 2,
    width: rightX.value - leftX.value,
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <View
        style={[styles.trackContainer, { width: TRACK_LENGTH + THUMB_SIZE }]}
      >
        <View style={styles.track} />
        <Animated.View style={[styles.selectedTrack, selectedStyle]} />
        <PanGestureHandler onGestureEvent={panLeft}>
          <Animated.View style={[styles.thumb, leftStyle]} />
        </PanGestureHandler>
        <PanGestureHandler onGestureEvent={panRight}>
          <Animated.View style={[styles.thumb, rightStyle]} />
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: TRACK_PADDING,
  },
  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
  },
  selectedTrack: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#007AFF",
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007AFF",
    zIndex: 2,
  },
});

export default RangeSlider;
