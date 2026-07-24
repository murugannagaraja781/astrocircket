import React from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, useTheme, Avatar, Card, Button } from 'react-native-paper';
import { customColors } from '../utils/theme';

const EXPERTS = [
    { id: '1', name: 'Sam', acc: '90%', streak: 8, followers: '4k+' },
    { id: '2', name: 'Joe', acc: '84%', streak: 7, followers: '5k+' },
    { id: '3', name: 'Pradeep', acc: '88%', streak: 5, followers: '8k+' },
];

const ExpertListScreen = () => {
    const theme = useTheme();

    const renderExpert = ({ item }) => (
        <Card style={[styles.card, { backgroundColor: 'white' }]}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ position: 'relative' }}>
                    <Avatar.Image size={50} source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }} />
                    <View style={styles.rankBadge}><Text style={{ color: 'white', fontSize: 10 }}>{item.id}</Text></View>
                </View>

                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'black' }}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Text style={{ color: 'gray', fontSize: 12 }}>♥ {item.followers}</Text>
                        <Text style={{ color: 'gray', fontSize: 12 }}>👁 1k+</Text>
                    </View>
                </View>

                {/* Badges/Stats for Accuracy */}
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: 'green', fontSize: 10 }}>Accuracy</Text>
                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18 }}>{item.acc}</Text>
                </View>

                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                    <Text style={{ color: 'green', fontSize: 10 }}>Streak</Text>
                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18 }}>{item.streak}</Text>
                </View>

                <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontSize: 18 }}>ᐳ</Text>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={{ padding: 15, paddingTop: 40 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Hot Experts of the month</Text>
                <FlatList
                    data={EXPERTS}
                    renderItem={renderExpert}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ marginTop: 15 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginBottom: 10, borderRadius: 12 },
    rankBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#ca8a04', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }
});

export default ExpertListScreen;
