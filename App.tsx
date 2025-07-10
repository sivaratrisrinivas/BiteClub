import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AuthContainer from './components/auth/AuthContainer';
import VerificationScreen from './components/auth/VerificationScreen';

type AppScreen = 'auth' | 'verification';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('auth');
  const [userEmail, setUserEmail] = useState<string>('');

  const handleSignupSuccess = (email: string) => {
    console.log('Signup success for:', email);
    setUserEmail(email);
    setCurrentScreen('verification');
  };

  const handleLoginSuccess = () => {
    console.log('Login successful! Will implement main app next');
    // Will navigate to main app next
  };

  const handleVerificationComplete = () => {
    console.log('Verification complete! Will implement username creation next');
    // Will navigate to username creation screen next
  };

  const handleBackToAuth = () => {
    setCurrentScreen('auth');
    setUserEmail('');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return (
          <AuthContainer
            onSignupSuccess={handleSignupSuccess}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            email={userEmail}
            onVerificationComplete={handleVerificationComplete}
            onBackToSignup={handleBackToAuth}
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
