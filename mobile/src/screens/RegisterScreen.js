import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { Button, Text, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { customColors } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    console.log('RegisterScreen: Initializing...');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, isLoading } = useContext(AuthContext);
    const theme = useTheme();

    const handleRegister = async () => {
        if (!email || !password || !name) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        try {
            await register(email, password);
            // Firebase automatically logs in a new user, so redirect will happen via AuthContext
        } catch (error) {
            Alert.alert("Registration Failed", error.message || "An error occurred during registration");
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
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {/* Abstract Background Shapes */}
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />

                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={styles.logoCircle}>
                            <MaterialCommunityIcons name="account-plus" size={40} color={customColors.neon} />
                        </View>
                        <Text variant="headlineLarge" style={styles.title}>
                            CREATE <Text style={{ color: customColors.neon }}>ACCOUNT</Text>
                        </Text>
                        <Text variant="titleMedium" style={styles.tagline}>
                            Join the Winning Team
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.placeholder} style={styles.icon} />
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor={theme.colors.placeholder}
                                value={name}
                                onChangeText={setName}
                                mode="flat"
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                style={styles.input}
                                textColor="white"
                                theme={{ colors: { background: 'transparent' } }}
                            />
                        </View>

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

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-check-outline" size={20} color={theme.colors.placeholder} style={styles.icon} />
                            <TextInput
                                placeholder="Confirm Password"
                                placeholderTextColor={theme.colors.placeholder}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                mode="flat"
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                style={styles.input}
                                textColor="white"
                                theme={{ colors: { background: 'transparent' } }}
                            />
                        </View>

                        <TouchableOpacity onPress={handleRegister} disabled={isLoading} style={{ marginTop: 20 }}>
                            <LinearGradient
                                colors={[customColors.neon, '#22c55e']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.registerBtn}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <Text style={styles.registerBtnText}>SIGN UP</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.loginRow}>
                            <Text style={{ color: 'gray' }}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={{ color: customColors.neon, fontWeight: 'bold' }}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        padding: 24,
        justifyContent: 'center',
        minHeight: '100%'
    },
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
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 10
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
    title: {
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
    registerBtn: {
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: customColors.neon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    registerBtnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30
    }
});
