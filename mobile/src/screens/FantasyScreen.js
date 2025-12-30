import React from 'react';
import { View, StyleSheet, Image, ImageBackground, ScrollView } from 'react-native';
import { Text, useTheme, Button, Avatar } from 'react-native-paper';
import { customColors } from '../utils/theme';

const FantasyScreen = () => {
    const theme = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={{ padding: 15, paddingTop: 40 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Team Result: 972</Text>

                {/* Field Visualization */}
                <View style={styles.fieldContainer}>
                    {/* Green Field Background - using a simple view or existing image?
                         We'll use a plain green view with gradient simulation via styles for now */}
                    <View style={[styles.field, { backgroundColor: '#4ade80' }]}>
                        {/* Wicket Keeper Row */}
                        <View style={styles.playerRow}>
                            <View style={styles.playerNode}>
                                <Avatar.Image size={40} source={{ uri: 'https://via.placeholder.com/50' }} />
                                <View style={styles.nameTag}><Text style={styles.nameText}>De Kock</Text></View>
                            </View>
                            <View style={styles.playerNode}>
                                <Avatar.Image size={40} source={{ uri: 'https://via.placeholder.com/50' }} />
                                <View style={styles.nameTag}><Text style={styles.nameText}>KL Rahul</Text></View>
                            </View>
                        </View>

                        {/* Batsmen Row */}
                        <View style={styles.playerRow}>
                            <View style={styles.playerNode}>
                                <Avatar.Image size={40} source={{ uri: 'https://via.placeholder.com/50' }} />
                                <View style={styles.nameTag}><Text style={styles.nameText}>Brees</Text></View>
                            </View>
                            <View style={styles.playerNode}>
                                <Avatar.Image size={40} source={{ uri: 'https://via.placeholder.com/50' }} />
                                <View style={styles.nameTag}><Text style={styles.nameText}>Breetzke</Text></View>
                            </View>
                            <View style={styles.playerNode}>
                                <Avatar.Image size={40} source={{ uri: 'https://via.placeholder.com/50' }} />
                                <View style={styles.nameTag}><Text style={styles.nameText}>Jaiswal</Text></View>
                            </View>
                        </View>

                        {/* Center Pitch Area Visual */}
                        <View style={{ height: 100, width: 60, backgroundColor: '#d6d3d1', alignSelf: 'center', opacity: 0.5, borderRadius: 5 }} />

                    </View>
                </View>

                <Button mode="contained" buttonColor={customColors.neon} textColor="black" style={{ marginTop: 20 }}>
                    Copy Best Fantasy Team
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    fieldContainer: {
        height: 500,
        backgroundColor: '#15803d',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#22c55e',
        padding: 20
    },
    field: { flex: 1, backgroundColor: '#16a34a', borderRadius: 15, justifyContent: 'space-around' },
    playerRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
    playerNode: { alignItems: 'center' },
    nameTag: { backgroundColor: '#1e293b', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginTop: -5 },
    nameText: { color: 'white', fontSize: 10 }
});

export default FantasyScreen;
