import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, ActivityIndicator, IconButton, Menu, Divider, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customColors } from '../utils/theme';
import axios from 'axios';
import { API_URL } from '../utils/config';

const KPSubTimelineScreen = ({ navigation }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [viewLevel, setViewLevel] = useState('Sub'); // 'Sign', 'Nakshatra', 'Sub'

    // Inputs
    const [lat, setLat] = useState('13.0827');
    const [lon, setLon] = useState('80.2707');
    const [tz, setTz] = useState('5.5');
    const [ayanamsa, setAyanamsa] = useState('Lahiri');
    const [showMenu, setShowMenu] = useState(false);

    // Date/Time
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear().toString());
    const [month, setMonth] = useState((now.getMonth() + 1).toString());
    const [day, setDay] = useState(now.getDate().toString());
    const [hour, setHour] = useState(now.getHours().toString());
    const [minute, setMinute] = useState(now.getMinutes().toString());

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/charts/kp-timeline`, {
                year: parseInt(year),
                month: parseInt(month),
                day: parseInt(day),
                hour: parseInt(hour),
                minute: parseInt(minute),
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                timezone: parseFloat(tz),
                ayanamsa: ayanamsa
            });
            setTimeline(response.data.timeline.filter(item => item.durationSeconds >= 5));
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Failed to fetch KP timeline. Please check inputs.');
        } finally {
            setLoading(false);
        }
    };

    const getDisplayTimeline = () => {
        if (!timeline.length) return [];
        if (viewLevel === 'Sub') return timeline;

        const merged = [];
        let current = { ...timeline[0] };

        for (let i = 1; i < timeline.length; i++) {
            const next = timeline[i];
            let shouldMerge = false;
            if (viewLevel === 'Sign') {
                shouldMerge = next.sign === current.sign;
            } else if (viewLevel === 'Nakshatra') {
                shouldMerge = next.nakshatra === current.nakshatra;
            }

            if (shouldMerge) {
                current.to = next.to;
                current.durationSeconds += next.durationSeconds;
            } else {
                merged.push(current);
                current = { ...next };
            }
        }
        merged.push(current);
        return merged;
    };

    const displayTimeline = getDisplayTimeline();

    const TAMIL_MAPS = {
        Signs: {
            'Aries': 'மேஷம்', 'Taurus': 'ரிஷபம்', 'Gemini': 'மிதுனம்', 'Cancer': 'கடகம்',
            'Leo': 'சிம்மம்', 'Virgo': 'கன்னி', 'Libra': 'துலாம்', 'Scorpio': 'விருச்சிகம்',
            'Sagittarius': 'தனுசு', 'Capricorn': 'மகரம்', 'Aquarius': 'கும்பம்', 'Pisces': 'மீனம்'
        },
        Nakshatras: {
            'Ashwini': 'அஸ்வினி', 'Bharani': 'பரணி', 'Krittika': 'கார்த்திகை', 'Rohini': 'ரோகிணி',
            'Mrigashirsha': 'மிருகசீரிஷம்', 'Ardra': 'திருவாதிரை', 'Punarvasu': 'புனர்பூசம்', 'Pushya': 'பூசம்',
            'Ashlesha': 'ஆயில்யம்', 'Magha': 'மகம்', 'Purva Phalguni': 'பூரம்', 'Uttara Phalguni': 'உத்திரம்',
            'Hasta': 'ஹஸ்தம்', 'Chitra': 'சித்திரை', 'Swati': 'சுவாதி', 'Vishakha': 'விசாகம்',
            'Anuradha': 'அனுஷம்', 'Jyeshtha': 'கேட்டை', 'Mula': 'மூலம்', 'Purva Ashadha': 'பூராடம்',
            'Uttara Ashadha': 'உத்திராடம்', 'Shravana': 'திருவோணம்', 'Dhanishta': 'அவிட்டம்', 'Shatabhisha': 'சதயம்',
            'Purva Bhadrapada': 'பூரட்டாதி', 'Uttara Bhadrapada': 'உத்திரட்டாதி', 'Revati': 'ரேவதி'
        },
        Planets: {
            'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
            'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது'
        }
    };

    const renderRow = ({ item }) => {
        const fromTime = new Date(item.from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const toTime = new Date(item.to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const durationMin = Math.floor(item.durationSeconds / 60);
        const durationSec = item.durationSeconds % 60;

        return (
            <Card style={styles.rowCard}>
                <View style={styles.rowContent}>
                    <View style={styles.timeCol}>
                        <Text style={styles.timeText}>{fromTime}</Text>
                        <Text style={styles.toText}>வரை {toTime}</Text>
                        <Text style={styles.durationText}>{durationMin}நி {durationSec}வி</Text>
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.dataCol}>
                        <Text style={[styles.signText, viewLevel === 'Sign' && { color: theme.colors.primary }]}>
                            {TAMIL_MAPS.Signs[item.sign] || item.sign}
                        </Text>
                        <Text style={[styles.nakText, viewLevel === 'Nakshatra' && { color: theme.colors.primary, fontWeight: 'bold' }]}>
                            {TAMIL_MAPS.Nakshatras[item.nakshatra] || item.nakshatra}
                        </Text>
                        <View style={[styles.subBadge, viewLevel !== 'Sub' && { backgroundColor: '#1e293b' }]}>
                            <Text style={[styles.subText, viewLevel !== 'Sub' && { color: 'gray' }]}>
                                உப அதிபதி: {TAMIL_MAPS.Planets[item.subLord] || item.subLord}
                            </Text>
                        </View>
                    </View>
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" iconColor="white" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>KP Sub Timeline (நேரக் கணிப்பு)</Text>
                <IconButton icon="refresh" iconColor={theme.colors.primary} onPress={fetchTimeline} />
            </View>

            <ScrollView style={styles.inputArea} keyboardShouldPersistTaps="handled">
                <View style={styles.inputRow}>
                    <TextInput mode="outlined" label="Lat" value={lat} onChangeText={setLat} style={styles.smallInput} keyboardType="numeric" />
                    <TextInput mode="outlined" label="Lon" value={lon} onChangeText={setLon} style={styles.smallInput} keyboardType="numeric" />
                    <TextInput mode="outlined" label="TZ" value={tz} onChangeText={setTz} style={styles.smallInput} keyboardType="numeric" />
                </View>

                <View style={styles.inputRow}>
                    <TextInput mode="outlined" label="YYYY" value={year} onChangeText={setYear} style={styles.smallInput} keyboardType="numeric" />
                    <TextInput mode="outlined" label="MM" value={month} onChangeText={setMonth} style={styles.smallInput} keyboardType="numeric" />
                    <TextInput mode="outlined" label="DD" value={day} onChangeText={setDay} style={styles.smallInput} keyboardType="numeric" />
                </View>

                <View style={styles.inputRow}>
                    <TextInput mode="outlined" label="HH" value={hour} onChangeText={setHour} style={styles.smallInput} keyboardType="numeric" />
                    <TextInput mode="outlined" label="Min" value={minute} onChangeText={setMinute} style={styles.smallInput} keyboardType="numeric" />

                    <Menu
                        visible={showMenu}
                        onDismiss={() => setShowMenu(false)}
                        anchor={
                            <Button mode="outlined" onPress={() => setShowMenu(true)} style={styles.ayanamsaBtn}>
                                {ayanamsa}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => { setAyanamsa('Lahiri'); setShowMenu(false); }} title="Lahiri" />
                        <Menu.Item onPress={() => { setAyanamsa('KP'); setShowMenu(false); }} title="KP" />
                        <Menu.Item onPress={() => { setAyanamsa('KP Straight'); setShowMenu(false); }} title="KP Straight" />
                    </Menu>
                </View>

                <Button mode="contained" onPress={fetchTimeline} style={styles.calculateBtn} loading={loading}>
                    Calculate 24h Timeline (கணக்கிடு)
                </Button>

                {timeline.length > 0 && (
                    <View style={styles.levelRow}>
                        <RadioButton.Group onValueChange={value => setViewLevel(value)} value={viewLevel}>
                            <View style={styles.radioGroup}>
                                <View style={styles.radioOption}>
                                    <RadioButton value="Sign" size={20} />
                                    <Text style={styles.radioLabel}>Sign (ராசி)</Text>
                                </View>
                                <View style={styles.radioOption}>
                                    <RadioButton value="Nakshatra" size={20} />
                                    <Text style={styles.radioLabel}>Nak (நட்சத்திரம்)</Text>
                                </View>
                                <View style={styles.radioOption}>
                                    <RadioButton value="Sub" size={20} />
                                    <Text style={styles.radioLabel}>Sub (உப அதிபதி)</Text>
                                </View>
                            </View>
                        </RadioButton.Group>
                    </View>
                )}
            </ScrollView>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 10, color: 'gray' }}>Calculating High-Precision Timeline...</Text>
                </View>
            ) : (
                <FlatList
                    data={displayTimeline}
                    renderItem={renderRow}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContainer}
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginTop: 30 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    inputArea: { maxHeight: 250, paddingHorizontal: 15 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
    smallInput: { flex: 1, marginHorizontal: 4, height: 45 },
    ayanamsaBtn: { flex: 1, marginHorizontal: 4, height: 45, justifyContent: 'center' },
    calculateBtn: { marginVertical: 10, borderRadius: 8 },
    listContainer: { padding: 15 },
    rowCard: { marginBottom: 10, backgroundColor: '#1e293b', borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
    rowContent: { flexDirection: 'row', padding: 12, alignItems: 'center' },
    timeCol: { flex: 1 },
    timeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    toText: { color: 'gray', fontSize: 12 },
    durationText: { color: '#60a5fa', fontSize: 12, marginTop: 4 },
    divider: { width: 1, height: '80%', marginHorizontal: 15, backgroundColor: '#334155' },
    dataCol: { flex: 1.5 },
    signText: { color: 'white', fontWeight: 'bold' },
    nakText: { color: '#94a3b8', fontSize: 13 },
    subBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 5, alignSelf: 'flex-start' },
    subText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 12 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    levelRow: { marginTop: 5, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#334155' },
    radioGroup: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    radioOption: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
    radioLabel: { color: 'white', fontSize: 13, marginLeft: 2 }
});

export default KPSubTimelineScreen;
