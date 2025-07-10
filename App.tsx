import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import SignupScreen from './components/auth/SignupScreen';

export default function App() {
  const handleLoginPress = () => {
    console.log('Login pressed - will implement next');
  };

  const handleSignupSuccess = (email: string) => {
    console.log('Signup success for:', email);
    // Will handle navigation to verification screen next
  };

  return (
    <View style={styles.container}>
      <SignupScreen
        onLoginPress={handleLoginPress}
        onSignupSuccess={handleSignupSuccess}
      />
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
