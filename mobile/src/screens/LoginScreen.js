import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, Card } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        try {
            await login(email, password);
            // Navigation is handled by App.js based on token state
        } catch (error) {
            Alert.alert("Login Failed", error.response?.data?.msg || "Invalid credentials or server error");
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>Astro Cricket 🏏</Text>
            <Card style={styles.card}>
                <Card.Content>
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="none"
                    />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        mode="outlined"
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        style={styles.button}
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        Login
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff8e7', // Parchment theme
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#8b0000',
        fontWeight: 'bold',
    },
    card: {
        padding: 10,
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#8b0000',
    },
});
