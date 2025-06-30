import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { db, auth } from "../Firebaseconfig";
import moment from "moment";

import { useSelector, useDispatch } from "react-redux";
import { setUserState, setAgeRange, setDistance } from "../redux/userSlice";
import Slider from "@react-native-community/slider";
import { doc, updateDoc } from "@react-native-firebase/firestore";
import RangeSlider from "../components/Slider";
import Header from "../components/Header";
import { Button } from "react-native-paper";
import theme from "../design-system/theme/theme";
import Container from "../components/Container";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";
const AccountSettings = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  const dispatch = useDispatch();
  const unsubscribeRef = useRef(null);
  const { ageMin, ageMax } = useSelector((s) => s.user);
  const [localMin, setLocalMin] = useState(ageMin);
  const [localMax, setLocalMax] = useState(ageMax);
  const reduxDistance = useSelector((state) => state.user.distance);
  const [value, setValue] = useState(reduxDistance ?? 10);

  const handleSave = async () => {
    dispatch(setAgeRange({ min: localMin, max: localMax }));

    await updateDoc(doc(db, "Users", auth.currentUser.uid), {
      ageMin: localMin,
      ageMax: localMax,
      distance: value,
    });
    navigation.goBack();
  };
  const handleValuesChange = (min, max) => {
    setLocalMin(min);
    setLocalMax(max);
  };

  const Myuser = useSelector((state) => state.user);

  return (
    <Container>
      <Header title={"Enter Your Prefrences"} />
      <View
        style={{
          padding: 20,
          paddingTop: verticalScale(25),
          gap: verticalScale(40),
          backgroundColor: theme.colors.background,
        }}
      >
        <View style={{ gap: verticalScale(20) }}>
          <Text style={{ fontWeight: "bold", fontSize: moderateScale(18) }}>
            How old should your new friend be?
          </Text>
          <View style={styles.chipContainer}>
            <View
              style={{
                paddingHorizontal: horizontalScale(10),
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: theme.fontSizes.medium }}
              >
                Between {localMin} and {localMax}
              </Text>
            </View>

            <RangeSlider
              initialMin={ageMin}
              initialMax={ageMax}
              onValuesChange={handleValuesChange}
            />
          </View>
        </View>
        <View style={{ gap: verticalScale(20) }}>
          <Text style={{ fontWeight: "bold", fontSize: moderateScale(18) }}>
            How close do you want them to yourself?
          </Text>
          <View style={styles.chipContainer}>
            <View
              style={{
                paddingHorizontal: horizontalScale(10),
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: theme.fontSizes.medium }}
              >
                Upto {Myuser.distance} Kilometers away
              </Text>
            </View>

            <Slider
              minimumValue={10}
              maximumValue={100}
              value={Myuser.distance}
              onValueChange={(val) => setValue(val)}
              onSlidingComplete={(val) => dispatch(setDistance(val))}
              step={1}
            />
          </View>
        </View>
        <Button
          buttonColor={theme.colors.primary}
          textColor={theme.colors.text}
          mode="contained"
          onPress={handleSave}
        >
          Save Settings
        </Button>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: verticalScale(80),
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderBlock: {
    flex: 1,
    paddingHorizontal: 0, // No spacing between blocks
  },
  sliderLabel: {
    textAlign: "center",
    marginBottom: verticalScale(5),
  },
  slider: {
    width: "100%",
    height: verticalScale(40),
  },

  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(15),
    paddingVertical: verticalScale(20),
    gap: verticalScale(20),
  },
});

export default AccountSettings;
