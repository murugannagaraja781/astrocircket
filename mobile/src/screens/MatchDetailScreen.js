import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme, ActivityIndicator, List, Avatar, Chip, ProgressBar } from 'react-native-paper';
import axios from 'axios';
import config from '../utils/config';
import { AuthContext } from '../context/AuthContext';
import { customColors } from '../utils/theme';

const MatchDetailScreen = ({ route, navigation }) => {
    const { match } = route.params || {};
    const theme = useTheme();
    const { userToken } = useContext(AuthContext);
    const [subTab, setSubTab] = useState('Prediction');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState({});

    // Mock Team Logic - Assuming we select India players for now
    const fetchTeamPlayers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${config.API_URL}/api/players`, {
                headers: { 'x-auth-token': userToken }
            });
            // Just take first 5 players as "Top Picks"
            setPlayers(res.data.slice(0, 5));

            // Run predictions for them
            // We need a valid date. Mock Match date is "Tomorrow" (needs real date)
            // Let's use 2025-12-30 as per context
            const matchDate = "2025-12-30";
            const matchTime = "13:30";

            const newPreds = {};
            for (const p of res.data.slice(0, 5)) {
                if (p.id) {
                    try {
                        const predRes = await axios.post(`${config.API_URL}/api/prediction/evaluate`, {
                            playerId: p.id,
                            matchDate,
                            matchTime,
                            location: { lat: 13.0, lng: 80.0 } // Chennai Mock
                        }, { headers: { 'x-auth-token': userToken } });
                        newPreds[p.id] = predRes.data.prediction;
                    } catch (e) {
                        console.log("Pred Error", p.name, e.message);
                    }
                }
            }
            setPredictions(newPreds);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subTab === 'Prediction') {
            fetchTeamPlayers();
        }
    }, [subTab]);

    const renderPredictionTab = () => (
        <View style={styles.tabContent}>
            {/* Win Probability Card */}
            <View style={[styles.probCard, { backgroundColor: '#dcfce7' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: 'https://flagcdn.com/w40/in.png' }} style={{ width: 24, height: 16, marginRight: 8 }} />
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#166534' }}>India to win</Text>
                    <Image source={{ uri: 'https://img.icons8.com/emoji/48/trophy-emoji.png' }} style={{ width: 20, height: 20, marginLeft: 8 }} />
                </View>
                <ProgressBar progress={0.7} color="#22c55e" style={{ height: 8, borderRadius: 4, marginTop: 10, backgroundColor: '#bbf7d0' }} />
                <Text style={{ textAlign: 'right', fontSize: 12, color: '#166534', marginTop: 4 }}>70% Probability</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Player Analysis (Astro)</Text>

            {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} /> : (
                players.map((p) => {
                    const pred = predictions[p.id];
                    return (
                        <List.Item
                            key={p.id}
                            title={p.name}
                            titleStyle={{ color: theme.colors.text, fontWeight: 'bold' }}
                            description={p.role}
                            descriptionStyle={{ color: theme.colors.placeholder }}
                            left={props => <Avatar.Text {...props} label={p.name[0]} size={40} style={{ backgroundColor: theme.colors.primary }} color='black' />}
                            right={() => (
                                <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                    {pred ? (
                                        <View style={{ flexDirection: 'row', gap: 5 }}>
                                            <Chip style={{ backgroundColor: pred.batting.status === 'GOOD' ? customColors.neon : '#ef4444' }}>
                                                BAT: {pred.batting.status}
                                            </Chip>
                                            <Chip style={{ backgroundColor: pred.bowling.status === 'GOOD' ? customColors.neon : '#ef4444' }}>
                                                BOWL: {pred.bowling.status}
                                            </Chip>
                                        </View>
                                    ) : <Text style={{ color: 'gray' }}>Analyzing...</Text>}
                                </View>
                            )}
                            style={{ backgroundColor: customColors.cardBg, marginBottom: 8, borderRadius: 8 }}
                        />
                    )
                })
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header / Banner */}
            <View style={[styles.header, { backgroundColor: customColors.darkBg }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                    <Text style={{ color: 'white', fontSize: 20 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{match?.series || 'Match Details'}</Text>
                <TouchableOpacity style={{ padding: 10 }}>
                    <Text style={{ color: customColors.neon, fontWeight: 'bold' }}>Follow</Text>
                </TouchableOpacity>
            </View>

            {/* Match Score Summary (Mini) */}
            <View style={{ backgroundColor: customColors.cardBg, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>IND vs RSA</Text>
                <Chip icon="clock" style={{ backgroundColor: '#334155' }} textStyle={{ color: 'white' }}>01:30 PM</Chip>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: 'black' }}>
                {['Tips', 'Prediction', 'Fantasy'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtn, subTab === tab && { borderBottomWidth: 3, borderBottomColor: customColors.neon }]}
                        onPress={() => setSubTab(tab)}
                    >
                        <Text style={{ color: subTab === tab ? 'white' : 'gray', fontWeight: 'bold' }}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={{ padding: 15 }}>
                {subTab === 'Prediction' && renderPredictionTab()}
                {subTab === 'Fantasy' && (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: 'gray' }}>Fantasy Team Generator Coming Soon</Text>
                    </View>
                )}
                {subTab === 'Tips' && (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: 'gray' }}>Expert Tips Loading...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40, paddingBottom: 10 },
    tabBtn: { flex: 1, padding: 15, alignItems: 'center' },
    tabContent: {},
    probCard: { padding: 15, borderRadius: 12, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 }
});

export default MatchDetailScreen;
