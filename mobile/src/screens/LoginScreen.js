import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Button, Text, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { customColors } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    console.log('LoginScreen: Initializing...');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);
    const theme = useTheme();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        try {
            await login(email, password);
        } catch (error) {
            Alert.alert("Login Failed", error.message || "Invalid credentials or server error");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <LinearGradient
                colors={['#0f172a', '#1e1a4b', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {/* Abstract Background Shapes */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />

                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <MaterialCommunityIcons name="cricket" size={50} color={customColors.neon} />
                    </View>
                    <Text variant="headlineLarge" style={styles.appName}>
                        ASTRO<Text style={{ color: customColors.neon }}>CRIC</Text>
                    </Text>
                    <Text variant="titleMedium" style={styles.tagline}>
                        Win with the Stars
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.placeholder} style={styles.icon} />
                        <TextInput
                            placeholder="Email Address"
                            placeholderTextColor={theme.colors.placeholder}
                            value={email}
                            onChangeText={setEmail}
                            mode="flat"
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                            style={styles.input}
                            autoCapitalize="none"
                            textColor="white"
                            theme={{ colors: { background: 'transparent' } }}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.placeholder} style={styles.icon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor={theme.colors.placeholder}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            mode="flat"
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                            style={styles.input}
                            textColor="white"
                            theme={{ colors: { background: 'transparent' } }}
                        />
                    </View>

                    <TouchableOpacity onPress={() => Alert.alert("Reset", "Feature coming soon")}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                        <LinearGradient
                            colors={[customColors.neon, '#22c55e']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.loginBtn}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text style={styles.loginBtnText}>LOGIN</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.registerRow}>
                        <Text style={{ color: 'gray' }}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={{ color: customColors.neon, fontWeight: 'bold' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    // Background Shapes
    circle1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: customColors.neon,
        opacity: 0.1
    },
    circle2: {
        position: 'absolute',
        bottom: 100,
        right: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#3b82f6',
        opacity: 0.1
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    appName: {
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2
    },
    tagline: {
        color: 'gray',
        marginTop: 5,
        letterSpacing: 1
    },
    formContainer: {
        width: '100%'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10
    },
    icon: {
        marginRight: 5
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 16
    },
    forgotText: {
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 5,
        marginBottom: 25
    },
    loginBtn: {
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: customColors.neon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    loginBtnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30
    }
});
