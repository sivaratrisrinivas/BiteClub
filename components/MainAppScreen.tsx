import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface LatestScore {
    score: number;
    reasoning: string;
    timestamp: Date;
}

interface MainAppScreenProps {
    onSignOut: () => void;
    onTakePhoto: () => void;
    latestScore: LatestScore | null;
}

export default function MainAppScreen({ onSignOut, onTakePhoto, latestScore }: MainAppScreenProps) {
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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🍽️ BiteClub</Text>
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Latest Score Display */}
                {latestScore && (
                    <View style={styles.scoreCard}>
                        <View style={styles.scoreHeader}>
                            <Text style={styles.scoreTitle}>🤖 Latest AI Analysis</Text>
                            <Text style={styles.scoreValue}>{latestScore.score}/10</Text>
                        </View>
                        <Text style={styles.scoreReasoning}>{latestScore.reasoning}</Text>
                        <Text style={styles.scoreTimestamp}>
                            {latestScore.timestamp.toLocaleTimeString()} • {latestScore.timestamp.toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {/* Main Camera Button */}
                <TouchableOpacity style={styles.cameraButton} onPress={onTakePhoto}>
                    <Text style={styles.cameraButtonText}>📸 Take Food Photo</Text>
                    <Text style={styles.cameraButtonSubtext}>Capture your meal to get an AI health score</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    signOutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    signOutText: {
        color: '#dc3545',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cameraButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cameraButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cameraButtonSubtext: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
        textAlign: 'center',
    },
    scoreCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        width: '100%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    scoreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    scoreTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    scoreReasoning: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    scoreTimestamp: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
}); 