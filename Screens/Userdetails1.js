import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setName, setEmail, setDateOfBirth, setGender } from '../redux/userSlice';
import { Picker } from '@react-native-picker/picker';
import auth from '@react-native-firebase/auth';
//import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import { firestore } from '../Firebaseconfig';
const Screen1 = ({ navigation }) => {
  const dispatch = useDispatch();

  const [name, setNameState] = useState('');
  const [email, setEmailState] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGenderState] = useState('');
  

  const phoneNumber = auth().currentUser?.phoneNumber;
  const userId = auth().currentUser.uid;
  


  const validateAndContinue = async () => {
    if (!email || !name || !day || !month || !year || !gender) {
      Alert.alert('Error', 'All fields must be filled!');
      return;
    }

    const dateOfBirth = `${day}/${month}/${year}`;
    const formattedDOB = `${year}-${month}-${day}`;
    console.log("Formatted DOB:", formattedDOB);
    console.log("Gender:", gender);

    if (!moment(formattedDOB, 'YYYY-MM-DD', true).isValid()) {
      Alert.alert('Error', 'Invalid date. Please enter a valid date.');
      return;
    }

    const age = moment().diff(moment(formattedDOB, 'YYYY-MM-DD'), 'years');
    if (age < 18) {
      Alert.alert('Error', 'You must be at least 18 years old.');
      return;
    }

    dispatch(setName(name));
    dispatch(setEmail(email));
    dispatch(setDateOfBirth(dateOfBirth));
    dispatch(setGender(gender));

    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is missing.');
      return;
    }

    console.log('Preparing to write to Firestore:');
    console.log('Phone Number:', phoneNumber);
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Gender:', gender);
    console.log('Date of Birth:', formattedDOB);

    try {
      const payload = {
        name: name || 'Unknown',
        email: email || 'Unknown',
        gender: gender,
        dateOfBirth: formattedDOB || 'Not specified',
      };

      console.log('Payload sent to Firestore:', payload);

      const userDoc = await firestore().collection("Users").doc(userId).get();
 
      if (userDoc.exists) {
        // Update the document
        await firestore().collection("Users").doc(userId).set(payload, { merge: true });
        console.log("Firestore write successful.");

        // Update step1Completed and navigate to Userdeet2
        await firestore().collection("Users").doc(userId).update({
          step1Completed: true,
        });
        navigation.navigate("Userdeet2");
      } else {
        console.error("No document found for the phone number.");
        Alert.alert(
          "Error",
          "No user document found. Please restart the signup process."
        );
      }
    } catch (error) {
      console.error('Error writing to Firestore:', error);
      Alert.alert('Error', 'Failed to save user data.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setNameState}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmailState}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Date of Birth (DD/MM/YYYY):</Text>
      <View style={styles.dateInputContainer}>
        <TextInput
          style={[styles.dateInput, styles.dayInput]}
          placeholder="DD"
          value={day}
          onChangeText={(value) => setDay(value.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="numeric"
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          style={[styles.dateInput, styles.monthInput]}
          placeholder="MM"
          value={month}
          onChangeText={(value) => setMonth(value.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="numeric"
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          style={[styles.dateInput, styles.yearInput]}
          placeholder="YYYY"
          value={year}
          onChangeText={(value) => setYear(value.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="numeric"
        />
      </View>

      <Picker
        selectedValue={gender}
        onValueChange={(itemValue) => setGenderState(itemValue)}>
        <Picker.Item label="Select gender" value="" />
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other" value="other" />
      </Picker>

      <Button title="Continue" onPress={validateAndContinue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    textAlign: 'center',
    height: 50,
  },
  dayInput: {
    width: 60,
  },
  monthInput: {
    width: 60,
  },
  yearInput: {
    width: 100,
  },
  separator: {
    fontSize: 18,
    marginHorizontal: 5,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Screen1;
