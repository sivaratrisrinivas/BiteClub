import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import AuthContainer from './components/auth/AuthContainer';
import VerificationScreen from './components/auth/VerificationScreen';
import UsernameCreationScreen from './components/auth/UsernameCreationScreen';
import MainAppScreen from './components/MainAppScreen';
import CameraScreen from './components/CameraScreen';

type AppScreen = 'auth' | 'verification' | 'username' | 'main' | 'camera';

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

  const handleTakePhoto = () => {
    console.log('Opening camera screen');
    setCurrentScreen('camera');
  };

  const handlePhotoTaken = (photoUri: string) => {
    console.log('=== PHOTO TAKEN CALLBACK TRIGGERED ===');
    console.log('Photo taken:', photoUri);
    console.log('Current screen before alert:', currentScreen);
    // For now, just show success and return to main screen
    Alert.alert(
      'Photo Captured! 📸',
      'Your food photo has been captured successfully! We\'ll add scoring in the next task.',
      [
        {
          text: 'Continue',
          onPress: () => {
            console.log('Alert dismissed, navigating to main');
            setCurrentScreen('main');
          },
        },
      ]
    );
  };

  const handleCameraCancel = () => {
    console.log('=== CAMERA CANCEL CALLBACK TRIGGERED ===');
    console.log('Camera cancelled, returning to main');
    console.log('Current screen before navigation:', currentScreen);
    setCurrentScreen('main');
    console.log('Screen set to main');
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
            onTakePhoto={handleTakePhoto}
          />
        );
      case 'camera':
        return (
          <CameraScreen
            onPhotoTaken={handlePhotoTaken}
            onCancel={handleCameraCancel}
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
