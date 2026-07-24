import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Card, useTheme, Chip, Button, IconButton } from 'react-native-paper';
import { customColors } from '../utils/theme';

const MOCK_MATCHES = [
    {
        id: '1',
        series: 'Syed Mushtaq Ali Trophy',
        matchNo: 'Match 115',
        team1: 'PUN',
        team1Full: 'Punjab',
        team2: 'JHA',
        team2Full: 'Jharkhand',
        score1: '163/5 (16.4)',
        score2: 'Yet to Bat',
        status: 'LIVE',
        note: 'Jharkhand elected to bowl',
        aiAnalysis: { win: '57%', fan: '50%', expert: '97%' }
    },
    {
        id: '2',
        series: 'South Africa Tour of India',
        matchNo: '3rd ODI',
        team1: 'IND',
        team1Full: 'India',
        team2: 'RSA',
        team2Full: 'South Africa',
        score1: '280/7 (50.0)',
        score2: '140/3 (25.0)',
        status: 'UPCOMING',
        startTime: 'Tomorrow, 01:30 pm',
        note: '',
        aiAnalysis: { win: '60%', fan: '70%', expert: '80%' }
    }
];

const HomeScreen = ({ navigation }) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState('Live');

    const renderMatchCard = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('MatchDetail', { match: item })}>
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.seriesText, { color: theme.colors.onSurface }]}>
                            {item.matchNo}, {item.series}
                        </Text>
                        {item.status === 'LIVE' && (
                            <Chip style={styles.liveChip} textStyle={styles.liveChipText} icon="video">LIVE</Chip>
                        )}
                    </View>
                    <Text style={{ color: theme.colors.placeholder, fontSize: 12, marginBottom: 10 }}>
                        {item.startTime || '12th Dec, 01:30 pm'}
                    </Text>

                    <View style={styles.teamsRow}>
                        <View style={styles.teamContainer}>
                            {/* Placeholder Logo */}
                            <View style={[styles.teamLogo, { backgroundColor: '#3b82f6' }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.team1[0]}</Text>
                            </View>
                            <Text style={[styles.teamCode, { color: theme.colors.text }]}>{item.team1}</Text>
                        </View>

                        <View style={styles.scoreContainer}>
                            <Text style={[styles.scoreText, { color: theme.colors.text }]}>{item.score1}</Text>
                            <Text style={[styles.vsText, { color: theme.colors.placeholder }]}>VS</Text>
                            <Text style={[styles.scoreText, { color: theme.colors.text }]}>{item.score2}</Text>
                        </View>

                        <View style={styles.teamContainer}>
                            <View style={[styles.teamLogo, { backgroundColor: '#10b981' }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.team2[0]}</Text>
                            </View>
                            <Text style={[styles.teamCode, { color: theme.colors.text }]}>{item.team2}</Text>
                        </View>
                    </View>

                    {/* AI Stats Row */}
                    <View style={styles.aiRow}>
                        <View style={styles.statItem}>
                            <IconButton icon="robot" size={16} iconColor={theme.colors.primary} />
                            <Text style={{ color: theme.colors.text, fontSize: 12 }}>{item.aiAnalysis.win}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <IconButton icon="account-group" size={16} iconColor="#60a5fa" />
                            <Text style={{ color: theme.colors.text, fontSize: 12 }}>{item.aiAnalysis.fan}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <IconButton icon="fountain-pen-tip" size={16} iconColor="#f472b6" />
                            <Text style={{ color: theme.colors.text, fontSize: 12 }}>{item.aiAnalysis.expert}</Text>
                        </View>
                    </View>

                    <View style={[styles.noteContainer, { backgroundColor: '#f3f4f6' }]}>
                        <Text style={{ color: '#374151', fontSize: 12, textAlign: 'center' }}>{item.note || 'Match starts soon'}</Text>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={{ uri: 'https://via.placeholder.com/150' }} // Replace with AC Logo
                    style={{ width: 40, height: 25, resizeMode: 'contain' }}
                />
                <View style={styles.coinBadge}>
                    <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>28D01H</Text>
                </View>
                {/* AI Robot Icon Mock */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton icon="chart-timeline-variant" iconColor="#f59e0b" size={28} onPress={() => navigation.navigate('KPDetail')} />
                    <IconButton icon="atom" iconColor="#6366f1" size={30} />
                </View>
            </View>

            {/* Toggle Switch */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === 'Live' && { backgroundColor: customColors.neon }]}
                    onPress={() => setActiveTab('Live')}
                >
                    <Text style={{ color: activeTab === 'Live' ? 'black' : 'gray', fontWeight: 'bold' }}>Live</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === 'Upcoming' && { backgroundColor: customColors.neon }]}
                    onPress={() => setActiveTab('Upcoming')}
                >
                    <Text style={{ color: activeTab === 'Upcoming' ? 'black' : 'gray', fontWeight: 'bold' }}>Upcoming</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={MOCK_MATCHES}
                renderItem={renderMatchCard}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 15 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginTop: 30 },
    coinBadge: { backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    toggleContainer: { flexDirection: 'row', marginHorizontal: 15, backgroundColor: '#334155', borderRadius: 25, padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
    card: { marginBottom: 15, borderRadius: 16, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seriesText: { fontSize: 13, fontWeight: 'bold' },
    liveChip: { backgroundColor: '#ef4444', height: 24 },
    liveChipText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
    teamContainer: { alignItems: 'center' },
    teamLogo: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    teamCode: { fontWeight: 'bold' },
    scoreContainer: { alignItems: 'center' },
    scoreText: { fontWeight: 'bold', fontSize: 16 },
    vsText: { fontSize: 12, fontWeight: 'bold' },
    aiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
    statItem: { flexDirection: 'row', alignItems: 'center' },
    noteContainer: { padding: 8, borderRadius: 8, marginTop: 5 }
});

export default HomeScreen;
