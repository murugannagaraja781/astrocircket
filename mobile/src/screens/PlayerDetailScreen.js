import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, Card, Divider, Chip, List, useTheme } from 'react-native-paper';
import RasiChart from '../components/RasiChart';
import { runPrediction } from '../utils/predictionAdapter';

export default function PlayerDetailScreen({ route, navigation }) {
    const { player, matchChart } = route.params;
    const theme = useTheme();

    const batPred = useMemo(() => matchChart ? runPrediction(player.birthChart.data || player.birthChart, matchChart.data, "BAT") : null, [matchChart, player]);
    const bowlPred = useMemo(() => matchChart ? runPrediction(player.birthChart.data || player.birthChart, matchChart.data, "BOWL") : null, [matchChart, player]);

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
                <Appbar.Content title={player.name || player.englishName} titleStyle={{ color: 'white' }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Basic Info Card */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge" style={styles.name}>{player.englishName} ({player.tamilName})</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>{player.role} • {player.team}</Text>
                        <Divider style={{ marginVertical: 10 }} />
                        <Text variant="bodySmall">Born: {player.birthData?.date} at {player.birthData?.place}</Text>
                    </Card.Content>
                </Card>

                {/* Prediction Report Section */}
                {matchChart && (
                    <Card style={[styles.card, { backgroundColor: '#f0fdf4', borderColor: '#166534', borderWidth: 1 }]}>
                        <Card.Title title="🏏 Match Prediction Report" titleStyle={{ color: '#166534', fontWeight: 'bold' }} />
                        <Card.Content>
                            <View style={styles.scoreRow}>
                                <Chip icon="cricket" style={styles.chip}>Batting: {batPred?.label} ({batPred?.score})</Chip>
                                <Chip icon="bowling" style={styles.chip}>Bowling: {bowlPred?.label} ({bowlPred?.score})</Chip>
                            </View>
                            <Divider style={{ marginVertical: 10 }} />
                            {batPred?.report.length > 0 && (
                                <List.Section>
                                    <List.Subheader>Batting Rules Passed:</List.Subheader>
                                    {batPred.report.map((r, i) => (
                                        <List.Item key={i} title={r} titleNumberOfLines={3} left={() => <List.Icon icon="check-circle" color="green" />} />
                                    ))}
                                </List.Section>
                            )}
                            {bowlPred?.report.length > 0 && (
                                <List.Section>
                                    <List.Subheader>Bowling Rules Passed:</List.Subheader>
                                    {bowlPred.report.map((r, i) => (
                                        <List.Item key={i} title={r} titleNumberOfLines={3} left={() => <List.Icon icon="check-circle" color="green" />} />
                                    ))}
                                </List.Section>
                            )}
                            {batPred?.report.length === 0 && bowlPred?.report.length === 0 && (
                                <Text style={{ fontStyle: 'italic', color: '#666' }}>No specific beneficial rules found. Likely average performance.</Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* Rasi Chart Section */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Rasi Chart (Rasi Kadam)</Text>
                <View style={styles.chartContainer}>
                    <RasiChart data={player.birthChart} />
                </View>

                {/* Additional Details */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="bodyMedium">Star: {player.birthChart?.moonNakshatra?.name}</Text>
                        <Text variant="bodyMedium">Rasi: {player.birthChart?.moonSign?.englishName}</Text>
                    </Card.Content>
                </Card>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#8b0000',
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 20,
        backgroundColor: 'white',
    },
    name: {
        fontWeight: 'bold',
        color: '#8b0000',
    },
    subtitle: {
        color: '#666',
    },
    sectionTitle: {
        marginBottom: 10,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 5,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 20,
    }
});
