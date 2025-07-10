import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface MainAppScreenProps {
    onSignOut: () => void;
    onTakePhoto: () => void;
}

export default function MainAppScreen({ onSignOut, onTakePhoto }: MainAppScreenProps) {
    const handleSignOut = async () => {
        try {
            Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: async () => {
                            const { error } = await supabase.auth.signOut();
                            if (error) {
                                console.error('Sign out error:', error);
                                Alert.alert('Error', 'Failed to sign out. Please try again.');
                            } else {
                                console.log('Successfully signed out');
                                onSignOut();
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    const handleGetProfile = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                Alert.alert('Error', 'Unable to get user information');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Profile error:', profileError);
                Alert.alert('Error', 'Unable to get profile information');
                return;
            }

            Alert.alert(
                'Your Profile',
                `Email: ${user.email}\nUsername: @${profile.username}\nJoined: ${new Date(profile.created_at).toLocaleDateString()}`
            );
        } catch (error) {
            console.error('Get profile error:', error);
            Alert.alert('Error', 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>🍽️ Welcome to BiteClub!</Text>
                <Text style={styles.subtitle}>You're successfully logged in</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🎉 Authentication Complete!</Text>
                    <Text style={styles.cardText}>
                        You've successfully completed the BiteClub authentication flow:
                    </Text>
                    <View style={styles.checkList}>
                        <Text style={styles.checkItem}>✅ Email & Password Created</Text>
                        <Text style={styles.checkItem}>✅ Email Verified</Text>
                        <Text style={styles.checkItem}>✅ Username Chosen</Text>
                        <Text style={styles.checkItem}>✅ Logged In Successfully</Text>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    <Text style={styles.actionTitle}>Quick Actions:</Text>

                    <TouchableOpacity style={styles.actionButton} onPress={handleGetProfile}>
                        <Text style={styles.actionButtonText}>👤 View My Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onTakePhoto}
                    >
                        <Text style={styles.actionButtonText}>
                            📸 Take Food Photo
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.comingSoonButton]}
                        disabled={true}
                    >
                        <Text style={[styles.actionButtonText, styles.comingSoonText]}>
                            🏆 View Leaderboard (Coming Soon)
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    cardText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    checkList: {
        alignItems: 'flex-start',
    },
    checkItem: {
        fontSize: 16,
        color: '#28a745',
        marginBottom: 8,
        fontWeight: '500',
    },
    actionSection: {
        marginBottom: 32,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    actionButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    comingSoonButton: {
        backgroundColor: '#e9ecef',
        opacity: 0.7,
    },
    comingSoonText: {
        color: '#6c757d',
    },
    signOutButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#dc3545',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 'auto',
    },
    signOutButtonText: {
        color: '#dc3545',
        fontSize: 16,
        fontWeight: '600',
    },
}); 