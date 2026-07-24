import React, { useContext, useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, ActivityIndicator, Chip, Avatar, Text } from 'react-native-paper';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import config from '../utils/config';
import MatchPredictionControl from '../components/MatchPredictionControl';
import { runPrediction } from '../utils/predictionAdapter';

const DashboardScreen = ({ navigation }) => {
    const { logout, userToken } = useContext(AuthContext);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Prediction State
    const [matchChart, setMatchChart] = useState(null);
    const [showPredictModal, setShowPredictModal] = useState(false);

    const fetchPlayers = async () => {
        try {
            const res = await axios.get(`${config.API_URL}/api/players`, {
                headers: { 'x-auth-token': userToken }
            });
            setPlayers(res.data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                Alert.alert("Session Expired", "Please login again.");
                logout();
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPlayers();
    };

    const handlePredict = async (payload) => {
        // Fetch Match Chart here using the payload from Modal
        try {
            const res = await axios.post(`${config.API_URL}/api/charts/birth-chart`, payload, {
                headers: { 'x-auth-token': userToken }
            });
            if (res.data) {
                setMatchChart(res.data);
            }
        } catch (err) {
            console.error("Match Chart Error", err);
            Alert.alert("Error", "Failed to fetch Match Chart");
        }
    };

    const getFlag = (player) => {
        const tz = player.timezone || '';
        const place = player.birthPlace || '';
        if (tz.includes('Kolkata') || place.includes('India')) return '🇮🇳';
        if (tz.includes('Australia') || place.includes('Australia')) return '🇦🇺';
        if (tz.includes('London') || place.includes('UK')) return '🇬🇧';
        return '🏳️';
    };

    const renderItem = ({ item }) => {
        let batResult = null;
        let bowlResult = null;

        const playerChart = item.birthChart?.data || item.birthChart;
        const transitChart = matchChart?.data || matchChart;

        if (transitChart && playerChart) {
            batResult = runPrediction(playerChart, transitChart, "BAT");
            bowlResult = runPrediction(playerChart, transitChart, "BOWL");
        }

        const isSpecial = batResult?.isSpecial || bowlResult?.isSpecial;

        return (
            <TouchableOpacity onPress={() => navigation.navigate('PlayerDetail', { player: item, matchChart: matchChart })}>
                <Card style={[styles.card, isSpecial && { borderLeftWidth: 5, borderLeftColor: '#D4AF37', backgroundColor: '#fffdf5' }]}>
                    <Card.Content style={styles.cardContent}>
                        <View style={styles.avatarContainer}>
                            <Avatar.Text size={40} label={item.name.charAt(0)} style={{ backgroundColor: '#1e40af' }} />
                        </View>
                        <View style={styles.infoContainer}>
                            <Title style={styles.cardTitle}>{item.name} {getFlag(item)}</Title>
                            <Paragraph style={styles.cardSubtitle}>{item.role || 'Player'}</Paragraph>
                            <Paragraph style={styles.cardDetail}>
                                {item.birthChart?.data?.moonSign?.english || '-'} | {item.birthChart?.data?.moonNakshatra?.name || '-'}
                            </Paragraph>

                            {/* Prediction Badges */}
                            {matchChart && (
                                <View style={styles.badgeRow}>
                                    <Chip
                                        icon="cricket"
                                        style={[styles.chip, { backgroundColor: batResult?.score >= 6 ? '#dcfce7' : batResult?.score >= 4 ? '#e0f2fe' : '#fee2e2' }]}
                                        textStyle={{ fontSize: 10, color: '#333' }}
                                    >
                                        BAT: {batResult?.verdict}
                                    </Chip>
                                    <Chip
                                        icon="bowling"
                                        style={[styles.chip, { backgroundColor: bowlResult?.score >= 6 ? '#dcfce7' : bowlResult?.score >= 4 ? '#e0f2fe' : '#fee2e2' }]}
                                        textStyle={{ fontSize: 10, color: '#333' }}
                                    >
                                        BOWL: {bowlResult?.verdict}
                                    </Chip>
                                </View>
                            )}
                        </View>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content title="Astro Cricket" titleStyle={styles.headerTitle} />
                <Appbar.Action icon="crystal-ball" onPress={() => setShowPredictModal(true)} color="#1e3a8a" />
                <Appbar.Action icon="logout" onPress={logout} color="#1e3a8a" />
            </Appbar.Header>

            {matchChart && (
                <View style={styles.predictionBanner}>
                    <Text style={styles.predictionText}>🔮 Prediction Active</Text>
                    <Button compact mode="text" onPress={() => setMatchChart(null)}>Clear</Button>
                </View>
            )}

            {loading ? (
                <ActivityIndicator animating={true} size="large" style={styles.loader} color="#1e40af" />
            ) : (
                <FlatList
                    data={players}
                    renderItem={renderItem}
                    keyExtractor={item => item._id || item.id}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            <MatchPredictionControl
                visible={showPredictModal}
                onClose={() => setShowPredictModal(false)}
                onPredictionComplete={handlePredict}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { backgroundColor: '#fff', elevation: 2 },
    headerTitle: { color: '#1e3a8a', fontWeight: 'bold' },
    loader: { flex: 1, justifyContent: 'center' },
    list: { padding: 10 },
    card: { marginBottom: 10, backgroundColor: 'white', borderRadius: 8 },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 15 },
    infoContainer: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
    cardSubtitle: { fontSize: 14, color: '#64748b' },
    cardDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    badgeRow: { flexDirection: 'row', marginTop: 8, gap: 5 },
    chip: { height: 26, alignItems: 'center' },
    predictionBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 15, paddingVertical: 5 },
    predictionText: { fontWeight: 'bold', color: '#166534' }
});

export default DashboardScreen;
