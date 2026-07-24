import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import axios from 'axios';
import Constants from 'expo-constants';
import config from '../utils/config';

const MatchPredictionControl = ({ visible, onClose, onPredictionComplete }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('19:30');
    const [location, setLocation] = useState('Mumbai');
    const [lat, setLat] = useState('19.0760');
    const [long, setLong] = useState('72.8777');
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const [year, month, day] = date.split('-');
            const [hour, minute] = time.split(':');

            const payload = {
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
                hour: parseInt(hour),
                minute: parseInt(minute),
                latitude: parseFloat(lat),
                longitude: parseFloat(long),
                timezone: 5.5 // Default to IST for now
            };

            // Mobile Config API URL
            const apiUrl = config.API_URL;
            // Token handling should be passed or retrieved from context in real app,
            // but for now assuming we might fail if auth needed.
            // Ideally pass token as prop or use context.

            // Note: If using Context in parent, maybe pass axios instance or token.
            // For now, let's assume the parent handles the auth part if we return payload?
            // Or we do the request here. Let's do request here if we can get token.

            // Actually, better to pass the payload back to Dashboard to handle API call with AuthContext
            // But user wants "Direct Release", so let's try to make it self-contained if possible
            // OR consistent with web: Web does the call inside component.
            // Let's rely on parent passing a "fetchMatchChart" function to keep it clean?
            // No, web implementation did axios call inside.

            // To avoid prop drilling auth token deep, let's just format the payload and let parent call API?
            // "onPredictionComplete" usually received the result data in Web.
            // Let's stick to that pattern but we need the token.
            // We'll create a new prop "fetchChartData" that the parent passes, which wraps the axios call with token.

            await onPredictionComplete(payload);
            onClose();

        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to generate prediction.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Title style={styles.modalText}>🏏 Predict Match</Title>

                    <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="2025-12-21"
                    />

                    <Text style={styles.label}>Time (HH:MM)</Text>
                    <TextInput
                        style={styles.input}
                        value={time}
                        onChangeText={setTime}
                        placeholder="14:30"
                    />

                    <Text style={styles.label}>Location Lat</Text>
                    <TextInput
                        style={styles.input}
                        value={lat}
                        onChangeText={setLat}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Location Long</Text>
                    <TextInput
                        style={styles.input}
                        value={long}
                        onChangeText={setLong}
                        keyboardType="numeric"
                    />

                    <View style={styles.buttonRow}>
                        <Button mode="outlined" onPress={onClose} style={styles.button}>Cancel</Button>
                        <Button mode="contained" onPress={handleRun} loading={loading} style={styles.button}>
                            Run
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalView: {
        width: '90%',
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        color: '#1e3a8a',
        fontWeight: 'bold'
    },
    input: {
        height: 40,
        width: '100%',
        margin: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f8fafc'
    },
    label: {
        alignSelf: 'flex-start',
        marginLeft: 10,
        fontSize: 12,
        color: '#666'
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-between',
        width: '100%'
    },
    button: {
        flex: 1,
        marginHorizontal: 5
    }
});

export default MatchPredictionControl;
