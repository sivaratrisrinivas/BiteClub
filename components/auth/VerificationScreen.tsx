import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface VerificationScreenProps {
    email: string;
    onVerificationComplete: () => void;
    onBackToSignup: () => void;
}

export default function VerificationScreen({
    email,
    onVerificationComplete,
    onBackToSignup
}: VerificationScreenProps) {
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Check verification status periodically
    useEffect(() => {
        const checkVerification = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.email_confirmed_at) {
                    // User is verified!
                    onVerificationComplete();
                }
            } catch (error) {
                console.error('Error checking verification:', error);
            }
        };

        // Check immediately and then every 3 seconds
        checkVerification();
        const interval = setInterval(checkVerification, 3000);

        return () => clearInterval(interval);
    }, [onVerificationComplete]);

    const handleResendVerification = async () => {
        if (resendCooldown > 0) return;

        setLoading(true);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                Alert.alert('Error', error.message);
                return;
            }

            Alert.alert(
                'Email Sent!',
                `We've sent another verification email to ${email}. Please check your inbox.`
            );

            // Start 60-second cooldown
            setResendCooldown(60);
        } catch (error) {
            Alert.alert('Error', 'Failed to resend verification email. Please try again.');
            console.error('Resend error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckManually = async () => {
        setLoading(true);

        try {
            // Force refresh the user session
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                Alert.alert('Error', 'Failed to check verification status.');
                return;
            }

            if (user && user.email_confirmed_at) {
                Alert.alert('Success!', 'Your email has been verified!', [
                    { text: 'Continue', onPress: onVerificationComplete }
                ]);
            } else {
                Alert.alert(
                    'Not Verified Yet',
                    'Your email hasn\'t been verified yet. Please check your inbox and click the verification link.'
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
            console.error('Manual check error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Check Your Email</Text>

                <Text style={styles.subtitle}>
                    We've sent a verification email to:
                </Text>

                <Text style={styles.email}>{email}</Text>

                <Text style={styles.instructions}>
                    Please check your inbox and click the verification link to activate your account.
                </Text>

                <View style={styles.tips}>
                    <Text style={styles.tipsTitle}>📧 Email Tips:</Text>
                    <Text style={styles.tip}>• Check your spam/junk folder</Text>
                    <Text style={styles.tip}>• Look for an email from Supabase</Text>
                    <Text style={styles.tip}>• It may take a few minutes to arrive</Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleCheckManually}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.secondaryButton,
                        (resendCooldown > 0 || loading) && styles.buttonDisabled
                    ]}
                    onPress={handleResendVerification}
                    disabled={resendCooldown > 0 || loading}
                >
                    <Text style={styles.secondaryButtonText}>
                        {resendCooldown > 0
                            ? `Resend Email (${resendCooldown}s)`
                            : 'Resend Verification Email'
                        }
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBackToSignup}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>← Back to Signup</Text>
                </TouchableOpacity>
            </View>
        </View>
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
        marginBottom: 16,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 8,
    },
    email: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: '#007AFF',
        marginBottom: 24,
    },
    instructions: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 32,
        lineHeight: 22,
    },
    tips: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 16,
        marginBottom: 32,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    tip: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    button: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    backButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 16,
        color: '#666',
    },
}); 