import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AuthContainer from './components/auth/AuthContainer';
import VerificationScreen from './components/auth/VerificationScreen';
import UsernameCreationScreen from './components/auth/UsernameCreationScreen';
import MainAppScreen from './components/MainAppScreen';

type AppScreen = 'auth' | 'verification' | 'username' | 'main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('auth');
  const [userEmail, setUserEmail] = useState<string>('');

  const handleSignupSuccess = (email: string) => {
    console.log('Signup success for:', email);
    setUserEmail(email);
    setCurrentScreen('verification');
  };

  const handleLoginSuccess = () => {
    console.log('Login successful! Navigating to main app');
    setCurrentScreen('main');
  };

  const handleVerificationComplete = () => {
    console.log('Verification complete! Navigating to username creation');
    setCurrentScreen('username');
  };

  const handleUsernameCreated = () => {
    console.log('Username created! Navigating to main app');
    setCurrentScreen('main');
  };

  const handleSignOut = () => {
    console.log('User signed out, returning to auth');
    setCurrentScreen('auth');
    setUserEmail('');
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
      case 'username':
        return (
          <UsernameCreationScreen
            onUsernameCreated={handleUsernameCreated}
            onBackToAuth={handleBackToAuth}
          />
        );
      case 'main':
        return (
          <MainAppScreen
            onSignOut={handleSignOut}
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
