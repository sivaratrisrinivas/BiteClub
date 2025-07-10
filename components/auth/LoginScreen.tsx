import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
    onSignupPress: () => void;
    onLoginSuccess: () => void;
}

export default function LoginScreen({ onSignupPress, onLoginSuccess }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return false;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return false;
        }

        return true;
    };

    const handleLogin = async () => {
        console.log('Login button pressed!');
        console.log('Form values:', { email, password });

        if (!validateForm()) {
            console.log('Login form validation failed');
            return;
        }

        console.log('Login form validation passed, starting login...');
        setLoading(true);

        try {
            console.log('Calling Supabase signIn...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: password,
            });

            console.log('Supabase login response:', { data, error });

            if (error) {
                console.error('Supabase login error:', error);
                Alert.alert('Login Error', error.message);
                return;
            }

            if (data.user) {
                console.log('Login successful! User:', data.user);
                if (!data.user.email_confirmed_at) {
                    Alert.alert(
                        'Email Not Verified',
                        'Please verify your email address before logging in. Check your inbox for the verification email.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                console.log('Navigating to main app...');
                onLoginSuccess();
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.form}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your BiteClub account</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    editable={!loading}
                />

                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.signupPrompt}>
                    <Text style={styles.signupPromptText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={onSignupPress} disabled={loading}>
                        <Text style={styles.signupLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        padding: 20,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    signupPrompt: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupPromptText: {
        fontSize: 16,
        color: '#666',
    },
    signupLink: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
}); 