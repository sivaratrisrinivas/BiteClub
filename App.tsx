import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import AuthContainer from './components/auth/AuthContainer';
import VerificationScreen from './components/auth/VerificationScreen';
import UsernameCreationScreen from './components/auth/UsernameCreationScreen';
import MainAppScreen from './components/MainAppScreen';
import CameraScreen from './components/CameraScreen';
import { uploadImageAndCreatePost } from './lib/imageUpload';

type AppScreen = 'auth' | 'verification' | 'username' | 'main' | 'camera';

interface LatestScore {
  score: number;
  reasoning: string;
  timestamp: Date;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('auth');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [latestScore, setLatestScore] = useState<LatestScore | null>(null);

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

  const handlePhotoTaken = async (photoUri: string) => {
    console.log('=== PHOTO TAKEN CALLBACK TRIGGERED ===');
    console.log('Photo taken:', photoUri);
    console.log('Current screen before upload:', currentScreen);
    console.log('Is already uploading:', isUploading);

    // Prevent duplicate uploads
    if (isUploading) {
      console.log('Upload already in progress, ignoring duplicate call');
      return;
    }

    setIsUploading(true);

    // Navigate to main screen immediately
    console.log('Navigating to main screen immediately');
    setCurrentScreen('main');

    try {
      console.log('Starting image upload in background...');
      const result = await uploadImageAndCreatePost(photoUri, (score, reasoning) => {
        // Update the latest score when AI analysis completes
        setLatestScore({
          score,
          reasoning,
          timestamp: new Date()
        });
      });

      if (result.success) {
        console.log('Upload successful:', result.data);
        // Optional: Show a brief success notification without blocking UI
        Alert.alert(
          'Photo Uploaded! 🎉',
          'Your food photo has been uploaded and is being analyzed!',
          [{ text: 'OK' }]
        );
      } else {
        console.error('Upload failed:', result.error);
        Alert.alert(
          'Upload Failed',
          `Sorry, we couldn't upload your photo: ${result.error}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Unexpected upload error:', error);
      Alert.alert(
        'Upload Error',
        'An unexpected error occurred while uploading your photo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
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
            latestScore={latestScore}
          />
        );
      case 'camera':
        return (
          <CameraScreen
            onPhotoTaken={handlePhotoTaken}
            onCancel={handleCameraCancel}
            isUploading={isUploading}
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
