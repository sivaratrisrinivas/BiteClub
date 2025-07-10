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

interface UsernameCreationScreenProps {
    onUsernameCreated: () => void;
    onBackToAuth: () => void;
}

export default function UsernameCreationScreen({ onUsernameCreated, onBackToAuth }: UsernameCreationScreenProps) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    const validateUsername = (text: string) => {
        // Remove spaces and convert to lowercase
        const cleaned = text.replace(/\s/g, '').toLowerCase();

        // Only allow alphanumeric characters and underscores
        const alphanumeric = cleaned.replace(/[^a-z0-9_]/g, '');

        return alphanumeric;
    };

    const handleUsernameChange = (text: string) => {
        const validatedUsername = validateUsername(text);
        setUsername(validatedUsername);
    };

    const checkUsernameValidation = () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return false;
        }

        if (username.length < 3) {
            Alert.alert('Error', 'Username must be at least 3 characters long');
            return false;
        }

        if (username.length > 20) {
            Alert.alert('Error', 'Username must be 20 characters or less');
            return false;
        }

        if (username.startsWith('_') || username.endsWith('_')) {
            Alert.alert('Error', 'Username cannot start or end with underscore');
            return false;
        }

        return true;
    };

    const checkUsernameAvailability = async (usernameToCheck: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', usernameToCheck)
                .single();

            if (error && error.code === 'PGRST116') {
                // No rows returned, username is available
                return true;
            }

            if (data) {
                // Username exists
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking username:', error);
            throw error;
        }
    };

    const handleCreateUsername = async () => {
        console.log('Create username pressed:', username);

        if (!checkUsernameValidation()) return;

        setLoading(true);

        try {
            // Check if username is available
            setChecking(true);
            const isAvailable = await checkUsernameAvailability(username);
            setChecking(false);

            if (!isAvailable) {
                Alert.alert('Username Taken', 'This username is already taken. Please choose another one.');
                return;
            }

            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                Alert.alert('Error', 'Unable to get user information. Please try again.');
                return;
            }

            // Update user profile with username
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    username: username,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Profile update error:', updateError);
                Alert.alert('Error', 'Unable to create username. Please try again.');
                return;
            }

            console.log('Username created successfully:', username);
            Alert.alert(
                'Welcome to BiteClub! 🎉',
                `Your username @${username} has been created successfully!`,
                [
                    {
                        text: 'Continue',
                        onPress: onUsernameCreated,
                    },
                ]
            );

        } catch (error) {
            console.error('Username creation error:', error);
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
            <View style={styles.content}>
                <Text style={styles.title}>Choose Your Username</Text>
                <Text style={styles.subtitle}>
                    Pick a unique username for your BiteClub profile
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.atSymbol}>@</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="username"
                        value={username}
                        onChangeText={handleUsernameChange}
                        autoCapitalize="none"
                        autoComplete="username"
                        autoCorrect={false}
                        editable={!loading}
                        maxLength={20}
                    />
                </View>

                <View style={styles.guidelines}>
                    <Text style={styles.guidelinesTitle}>Username Guidelines:</Text>
                    <Text style={styles.guideline}>• 3-20 characters long</Text>
                    <Text style={styles.guideline}>• Letters, numbers, and underscores only</Text>
                    <Text style={styles.guideline}>• Cannot start or end with underscore</Text>
                    <Text style={styles.guideline}>• Must be unique</Text>
                </View>

                {checking && (
                    <View style={styles.checkingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.checkingText}>Checking availability...</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.createButton, (loading || !username) && styles.buttonDisabled]}
                    onPress={handleCreateUsername}
                    disabled={loading || !username}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Username</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBackToAuth}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>← Back to Sign In</Text>
                </TouchableOpacity>
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
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 28,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 24,
    },
    atSymbol: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007AFF',
        paddingLeft: 16,
        paddingRight: 4,
    },
    input: {
        flex: 1,
        padding: 16,
        paddingLeft: 8,
        fontSize: 16,
    },
    guidelines: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    guidelinesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    guideline: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    checkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    checkingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007AFF',
    },
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#666',
    },
}); 