import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
    Animated,
    Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

interface CameraScreenProps {
    onPhotoTaken: (photoUri: string) => void;
    onCancel: () => void;
    isUploading?: boolean;
}

export default function CameraScreen({ onPhotoTaken, onCancel, isUploading = false }: CameraScreenProps) {
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);
    const flashOpacity = useRef(new Animated.Value(0)).current;

    const handlePermissionRequest = async () => {
        const result = await requestPermission();
        if (!result.granted) {
            Alert.alert(
                'Camera Permission Required',
                'BiteClub needs camera access to take photos of your meals. Please enable camera permission in your device settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings', onPress: () => {
                            // On real devices, this would open settings
                            Alert.alert('Info', 'Please go to Settings > BiteClub > Camera and enable camera access.');
                        }
                    },
                ]
            );
        }
    };

    const compressImage = async (uri: string): Promise<string> => {
        try {
            console.log('Compressing image:', uri);

            // Get image info to determine compression needed
            const imageInfo = await ImageManipulator.manipulateAsync(
                uri,
                [],
                { format: ImageManipulator.SaveFormat.JPEG }
            );

            console.log('Original image size:', imageInfo.width, 'x', imageInfo.height);

            // If image width is greater than 800px, compress it
            if (imageInfo.width > 800) {
                const aspectRatio = imageInfo.height / imageInfo.width;
                const newHeight = Math.round(800 * aspectRatio);

                console.log('Compressing to:', 800, 'x', newHeight);

                const compressedImage = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 800, height: newHeight } }],
                    {
                        compress: 0.8,
                        format: ImageManipulator.SaveFormat.JPEG,
                    }
                );

                console.log('Compressed image URI:', compressedImage.uri);
                return compressedImage.uri;
            }

            // Image is already small enough, just compress quality
            const compressedImage = await ImageManipulator.manipulateAsync(
                uri,
                [],
                {
                    compress: 0.8,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            return compressedImage.uri;
        } catch (error) {
            console.error('Error compressing image:', error);
            // Return original URI if compression fails
            return uri;
        }
    };

    const showFlashEffect = () => {
        // Flash animation - use JS driver for web compatibility
        Animated.sequence([
            Animated.timing(flashOpacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: false, // Use JS driver for web compatibility
            }),
            Animated.timing(flashOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false, // Use JS driver for web compatibility
            }),
        ]).start();
    };

    const takePicture = async () => {
        console.log('=== CAPTURE BUTTON PRESSED ===');
        console.log('=== TAKE PICTURE STARTED ===');
        console.log('cameraRef.current:', cameraRef.current);
        console.log('isCapturing:', isCapturing);

        if (!cameraRef.current) {
            console.error('Camera ref is null!');
            Alert.alert('Error', 'Camera is not ready. Please try again.');
            return;
        }

        if (isCapturing) {
            console.log('Already capturing, returning...');
            return;
        }

        try {
            setIsCapturing(true);
            console.log('Taking picture...');

            // For web, we need different options
            const photoOptions = Platform.OS === 'web' ? {
                quality: 0.8,
                base64: true, // Web requires base64
                skipProcessing: true, // Skip processing on web
            } : {
                quality: 0.8,
                base64: false,
                skipProcessing: false,
            };

            console.log('Photo options:', photoOptions);

            const photo = await cameraRef.current.takePictureAsync(photoOptions);
            console.log('Photo result:', photo);

            if (photo?.uri || photo?.base64) {
                console.log('Photo taken successfully!');

                // Show flash effect
                showFlashEffect();

                let photoUri = photo.uri;

                // On web, create blob from base64 if needed
                if (Platform.OS === 'web' && photo.base64 && !photoUri) {
                    photoUri = `data:image/jpeg;base64,${photo.base64}`;
                    console.log('Created data URI for web:', photoUri.substring(0, 50) + '...');
                }

                if (photoUri) {
                    // Compress the image (skip compression on web for simplicity)
                    let finalUri = photoUri;
                    if (Platform.OS !== 'web') {
                        finalUri = await compressImage(photoUri);
                        console.log('Photo compressed:', finalUri);
                    } else {
                        console.log('Skipping compression on web, using original URI');
                    }

                    // Show preview of captured photo
                    setCapturedPhoto(finalUri);
                    setIsCapturing(false); // Reset capturing state for preview
                } else {
                    throw new Error('No photo URI or base64 data received');
                }
            } else {
                console.error('No photo data received:', photo);
                Alert.alert('Error', 'Failed to capture photo. Please try again.');
                setIsCapturing(false);
            }
        } catch (error) {
            console.error('Error taking picture:', error);
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Error', `Failed to capture photo: ${errorMessage}`);
            setIsCapturing(false);
        }
    };

    const handleCancelPress = () => {
        console.log('=== CANCEL BUTTON PRESSED ===');
        onCancel();
    };

    const handleFlipPress = () => {
        console.log('=== FLIP BUTTON PRESSED ===');
        toggleCameraFacing();
    };

    const retakePhoto = () => {
        console.log('=== RETAKE BUTTON PRESSED ===');
        setCapturedPhoto(null);
        setIsCapturing(false);
    };

    const usePhoto = () => {
        console.log('=== USE PHOTO BUTTON PRESSED ===');
        console.log('capturedPhoto:', capturedPhoto);
        if (capturedPhoto) {
            onPhotoTaken(capturedPhoto);
        } else {
            console.error('No captured photo to use!');
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Loading state while permission is being checked
    if (permission === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading camera...</Text>
            </View>
        );
    }

    // Permission denied state
    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>📸 Camera Access Needed</Text>
                <Text style={styles.permissionMessage}>
                    BiteClub needs camera access to take photos of your delicious meals!
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
                    <Text style={styles.permissionButtonText}>Enable Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Photo preview state
    if (capturedPhoto) {
        return (
            <View style={styles.container}>
                <View style={styles.previewContainer}>
                    <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />

                    {/* Header with title */}
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewTitle}>📸 Photo Captured!</Text>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={[styles.retakeButton, isUploading && styles.buttonDisabled]}
                            onPress={retakePhoto}
                            activeOpacity={0.7}
                            disabled={isUploading}
                        >
                            <Text style={[styles.retakeButtonText, isUploading && styles.buttonTextDisabled]}>
                                🔄 Retake
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.usePhotoButton, isUploading && styles.buttonDisabled]}
                            onPress={usePhoto}
                            activeOpacity={0.7}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <View style={styles.uploadingContainer}>
                                    <ActivityIndicator color="white" size="small" />
                                    <Text style={styles.usePhotoButtonText}>Uploading...</Text>
                                </View>
                            ) : (
                                <Text style={styles.usePhotoButtonText}>✓ Use Photo</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {(isUploading || isCapturing) && (
                        <Text style={styles.autoNavText}>
                            {isUploading ? '📤 Uploading to cloud...' : 'Processing...'}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mode="picture"
            />

            {/* Flash overlay - positioned absolutely */}
            <Animated.View
                style={[
                    styles.flashOverlay,
                    { opacity: flashOpacity }
                ]}
                pointerEvents="none"
            />

            {/* Header with title and cancel - positioned absolutely */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelPress}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.cancelButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Take Food Photo</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Camera controls overlay - positioned absolutely */}
            <View style={styles.controlsContainer}>
                <View style={styles.topControls}>
                    <TouchableOpacity style={styles.flipButton} onPress={handleFlipPress}>
                        <Text style={styles.flipButtonText}>🔄</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomControls}>
                    <View style={styles.captureButtonContainer}>
                        <TouchableOpacity
                            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                            onPress={takePicture}
                            disabled={isCapturing}
                        >
                            {isCapturing ? (
                                <ActivityIndicator color="white" size="large" />
                            ) : (
                                <View style={styles.captureButtonInner} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.captureHint}>
                        {isCapturing ? 'Taking photo...' : 'Tap to capture your meal'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 40,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#333',
    },
    permissionMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 25,
        marginBottom: 16,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    camera: {
        flex: 1,
    },
    flashOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 200, // Reduced from 1000 to avoid interference
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 150, // Higher than controlsContainer to ensure X button works
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        padding: 12, // Increased from 8 for easier tapping
        backgroundColor: 'rgba(0,0,0,0.3)', // Add background for better visibility
        borderRadius: 20,
        minWidth: 40,
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    placeholder: {
        width: 36,
    },
    controlsContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100, // Start below header to avoid overlap
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        zIndex: 100,
    },
    topControls: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    flipButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButtonText: {
        fontSize: 20,
    },
    bottomControls: {
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    },
    captureButtonContainer: {
        marginBottom: 16,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 4,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 150, // Ensure button is above other elements
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    captureHint: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    // Preview styles
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewImage: {
        flex: 1,
        width: '100%',
        resizeMode: 'contain',
    },
    previewHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    previewTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    previewActions: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 80 : 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        zIndex: 100, // Ensure buttons are touchable
    },
    retakeButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fff',
    },
    retakeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    usePhotoButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    usePhotoButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    autoNavText: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#fff',
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonTextDisabled: {
        opacity: 0.7,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
}); 