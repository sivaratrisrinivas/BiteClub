import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import SignupScreen from './components/auth/SignupScreen';
import VerificationScreen from './components/auth/VerificationScreen';

type AppScreen = 'signup' | 'verification';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('signup');
  const [userEmail, setUserEmail] = useState<string>('');

  const handleLoginPress = () => {
    console.log('Login pressed - will implement next');
  };

  const handleSignupSuccess = (email: string) => {
    console.log('Signup success for:', email);
    setUserEmail(email);
    setCurrentScreen('verification');
  };

  const handleVerificationComplete = () => {
    console.log('Verification complete! Will implement username creation next');
    // Will navigate to username creation screen next
  };

  const handleBackToSignup = () => {
    setCurrentScreen('signup');
    setUserEmail('');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'signup':
        return (
          <SignupScreen
            onLoginPress={handleLoginPress}
            onSignupSuccess={handleSignupSuccess}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            email={userEmail}
            onVerificationComplete={handleVerificationComplete}
            onBackToSignup={handleBackToSignup}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
