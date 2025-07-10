import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import SignupScreen from './SignupScreen';
import LoginScreen from './LoginScreen';

const { width } = Dimensions.get('window');

interface AuthContainerProps {
    onSignupSuccess: (email: string) => void;
    onLoginSuccess: () => void;
}

export default function AuthContainer({ onSignupSuccess, onLoginSuccess }: AuthContainerProps) {
    const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
    const [slideAnim] = useState(new Animated.Value(0));

    const switchToLogin = () => {
        setActiveTab('login');
        Animated.timing(slideAnim, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const switchToSignup = () => {
        setActiveTab('signup');
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            {/* Tab Header */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                    onPress={switchToSignup}
                >
                    <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                        Sign Up
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                    onPress={switchToLogin}
                >
                    <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                        Sign In
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Active Tab Indicator */}
            <View style={styles.indicatorContainer}>
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            transform: [
                                {
                                    translateX: slideAnim.interpolate({
                                        inputRange: [-width, 0],
                                        outputRange: [width / 2, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            </View>

            {/* Screen Container */}
            <View style={styles.screenContainer}>
                <Animated.View
                    style={[
                        styles.screenWrapper,
                        {
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    {/* Signup Screen */}
                    <View style={styles.screen}>
                        <SignupScreen
                            onLoginPress={switchToLogin}
                            onSignupSuccess={onSignupSuccess}
                        />
                    </View>

                    {/* Login Screen */}
                    <View style={styles.screen}>
                        <LoginScreen
                            onSignupPress={switchToSignup}
                            onLoginSuccess={onLoginSuccess}
                        />
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    indicatorContainer: {
        height: 3,
        backgroundColor: '#f8f9fa',
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width / 2,
        height: 3,
        backgroundColor: '#007AFF',
    },
    screenContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    screenWrapper: {
        flexDirection: 'row',
        width: width * 2,
        height: '100%',
    },
    screen: {
        width: width,
        flex: 1,
    },
}); 