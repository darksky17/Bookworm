import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { 
  runOnJS, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from "react-native-reanimated";
import Animated from 'react-native-reanimated';
import theme from "../design-system/theme/theme";

const SwipeableTabs = ({
  tabs = [], // Array of tab objects: [{ label: "Posts", content: <Component /> }]
  onScroll, // Function to handle scroll events
  stickyHeaderIndices = [],
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 15,
  scrollEnabled = true,
  onProfileSectionLayout, // For measuring profile section height
  profileSection, // Profile section component to render above tabs
  style,
  contentContainerStyle,
  initialTab = 0,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const screenWidth = Dimensions.get('window').width;
  const translateX = useSharedValue(-initialTab * screenWidth);
  const AnimatedView = Animated.createAnimatedComponent(View);
  const scrollRef = useRef(null);
  const scrollYSwipe = useRef(0);

  // Store scroll position for first tab
  const handleScroll = useCallback((event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    if (currentTab === 0) {
      scrollYSwipe.current = scrollY;
    }
    
    // Pass scroll event to parent if provided
    if (onScroll) {
      onScroll(event);
    }
  }, [currentTab, onScroll]);

  // Scroll to appropriate position when switching tabs
  const scrollToProfile = useCallback((newTab) => {
    if (newTab === 1) {
      // For "About" tab, scroll to top
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      // For "Posts" tab, restore previous scroll position
      scrollRef.current?.scrollTo({ x: 0, y: scrollYSwipe.current, animated: true });
    }
  }, []);

  // Handle swipe gesture
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const newTranslateX = -currentTab * screenWidth + event.translationX;
      translateX.value = newTranslateX;
    })
    .onEnd((event) => {
      const swipeThreshold = screenWidth * 0.25;
      let newTab = currentTab;

      if (event.translationX > swipeThreshold && currentTab > 0) {
        newTab = currentTab - 1;
      } else if (event.translationX < -swipeThreshold && currentTab < tabs.length - 1) {
        newTab = currentTab + 1;
      }

      translateX.value = withSpring(-newTab * screenWidth, {
        stiffness: 100,
        damping: 8,
      });

      if (newTab !== currentTab) {
        runOnJS(scrollToProfile)(newTab);
        runOnJS(setCurrentTab)(newTab);
      }
    });

  // Animated style for horizontal sliding
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Handle tab press
  const handleTabPress = useCallback((tabIndex) => {
    translateX.value = withSpring(-tabIndex * screenWidth, {
      stiffness: 100,
      damping: 8,
    });
    
    // If switching from Posts tab, scroll to profile section first
    if (currentTab === 0 && tabIndex !== 0) {
      // Scroll to profile section height (passed from parent)
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
    
    setCurrentTab(tabIndex);
  }, [currentTab, screenWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      stickyHeaderIndices={stickyHeaderIndices}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={handleScroll}
      scrollEnabled={scrollEnabled && currentTab === 0} // Only enable scroll for first tab
      style={style}
      contentContainerStyle={contentContainerStyle}
    >
      {/* Profile Section */}
      {profileSection && (
        <View onLayout={onProfileSectionLayout}>
          {profileSection}
        </View>
      )}

      {/* Tab Headers */}
      <View style={{
        backgroundColor: theme.colors.background,
        flex: 1,
        marginTop: theme.spacing.vertical.lg,
        borderRadius: 5
      }}>
        <View style={{
          flexDirection: "row",
          paddingVertical: theme.spacing.vertical.md
        }}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flex: 1 / tabs.length,
                borderBottomWidth: currentTab === index ? 1 : 0,
                justifyContent: "center",
                alignItems: "center"
              }}
              onPress={() => handleTabPress(index)}
            >
              <Text style={{
                color: theme.colors.text,
                fontWeight: "bold",
                fontSize: theme.fontSizes.medium
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      <GestureDetector gesture={swipeGesture}>
        <AnimatedView style={[
          {
            flex: 1,
            flexDirection: "row",
            width: screenWidth * tabs.length
          },
          animatedStyle
        ]}>
          {tabs.map((tab, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                width: screenWidth,
                paddingHorizontal: theme.spacing.horizontal.xs
              }}
            >
              {tab.content}
            </View>
          ))}
        </AnimatedView>
      </GestureDetector>
    </ScrollView>
  );
};

export default SwipeableTabs;