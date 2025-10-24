import React from 'react';
import { View, Text, StatusBar, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../assets/BookWorm_logo.png';
import theme from '../design-system/theme/theme';
import { PRIVACY_POLICY, TERMS_N_CONDITIONS } from '../constants/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        gap: 20,
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'lightgreen',
        
      }}
    >
      <StatusBar backgroundColor="lightgreen" barStyle="dark-content" />
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={Logo}
          style={{ flex: 1, height: 250, width: 300 }}
          onError={(e) =>
            console.error('Error loading logo:', e.nativeEvent.error)
          }
        />
      </View>

      <View style={{ flex: 1, gap: 10 }}>
        <Button
          mode="contained"
          onPress={() => navigation.replace("Phoneauth")}
          style={{ backgroundColor: 'snow' }}
          textColor={theme.colors.text}
        >
          Get Started
        </Button>
      </View>
      
      <View
        style={{ alignItems: 'center', justifyContent: 'flex-start', gap: 12, marginBottom:insets.bottom }}
      >
        <Text style={{ fontWeight: 'bold' }}>
          Made with <Ionicons name="heart" size={16} color="red" /> by Soraaa
        </Text>
        <Text
          style={{
            fontSize: 7,
            color: theme.colors.text,
            fontWeight: 'bold',
          }}
        >
          By proceeding, you agree to{' '}
          <Text
            style={{ color: 'blue', textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(PRIVACY_POLICY)}
          >
            Privacy Policy
          </Text>{' '}
          and{' '}
          <Text
            style={{ color: 'blue', textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(TERMS_N_CONDITIONS)}
          >
            Terms & Conditions
          </Text>{' '}
          for using BookWorm.
        </Text>
      </View>
    </View>
  );
};

export default HomeScreen;