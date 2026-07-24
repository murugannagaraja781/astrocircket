import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const RasiChart = ({ data }) => {
    // Basic defaults if data missing
    const chartData = (data && Object.keys(data).length > 0) ? data : { houses: {}, birthData: {}, moonNakshatra: {} };
    const housesData = chartData.houses || chartData;
    const birthData = chartData.birthData || {};
    const nakshatraData = chartData.moonNakshatra || {};

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).replace(/ /g, " - ");
    };
    const formattedDate = formatDate(birthData.date);
    const timeStr = birthData.time || "";

    // 4x4 Grid Logic
    // Row 0: 12, 1, 2, 3
    // Row 1: 11, C, C, 4  (C = Center)
    // Row 2: 10, C, C, 5
    // Row 3: 9, 8, 7, 6
    const gridMap = [
        12, 1, 2, 3,
        11, null, null, 4,
        10, null, null, 5,
        9, 8, 7, 6
    ];

    const planetShortTamilMap = {
        'Sun': 'சூ', 'Moon': 'சந்', 'Mars': 'செவ்', 'Mercury': 'பு',
        'Jupiter': 'குரு', 'Venus': 'சுக்', 'Saturn': 'சனி',
        'Rahu': 'ராகு', 'Ketu': 'கேது', 'Asc': 'ல', 'Lagna': 'ல'
    };

    const getSignData = (signId) => {
        // Naive lookup - assumes housesData is keyed by House Number (1-12) OR Sign ID?
        // Web code suggests keys are "1", "2"... which might be House Numbers or Sign Numbers.
        // Let's iterate values to find matching signNumber.
        const house = Object.values(housesData).find(h => h.signNumber === signId);
        return house || { planets: [] };
    };

    const renderCell = (signId, index) => {
        // Calculate Row and Col
        const row = Math.floor(index / 4);
        const col = index % 4;

        // Skip valid center cells - we render merged center separately
        if (signId === null) return null;

        const { planets, signTamil } = getSignData(signId);

        return (
            <View
                key={signId}
                style={[
                    styles.cell,
                    {
                        top: `${row * 25}%`,
                        left: `${col * 25}%`
                    }
                ]}
            >
                {/* Header: ID and Tamil Name */}
                <View style={styles.cellHeader}>
                    <Text style={styles.signId}>{signId}</Text>
                    {signTamil && <Text style={styles.signTamil}>{signTamil}</Text>}
                </View>

                {/* Planets */}
                <View style={styles.planetContainer}>
                    {planets && planets.map((p, idx) => (
                        <Text
                            key={idx}
                            style={[
                                styles.planetText,
                                (p.name === 'Asc' || p.name === 'Lagna' || p.isAsc) && styles.ascendant
                            ]}
                        >
                            {planetShortTamilMap[p.name] || p.name.substring(0, 2)}
                        </Text>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Outer Border Decor */}
            <View style={styles.outerBorder}>
                {/* Grid Container */}
                <View style={styles.grid}>
                    {/* Render standard cells */}
                    {gridMap.map((signId, i) => renderCell(signId, i))}

                    {/* Center Merged Box */}
                    <View style={styles.centerBox}>
                        {/* Watermark Image (Using a URL or Local Asset if bundled) */}
                        {/* For now using a placeholder color/text or the SVG if we can render SVG strings */}
                        <View style={styles.watermarkContainer}>
                            {/* Trying to use Text as placeholder for Om symbol if Image fails */}
                            <Text style={{ fontSize: 50, opacity: 0.2 }}>🕉️</Text>
                        </View>

                        <View style={styles.centerContent}>
                            {formattedDate ? <Text style={styles.centerText}>{formattedDate}</Text> : null}
                            {timeStr ? <Text style={styles.centerText}>{timeStr}</Text> : null}
                            <View style={styles.rasiTitleContainer}>
                                <Text style={styles.rasiTitle}>RASI</Text>
                            </View>
                            {nakshatraData.name && (
                                <View style={styles.starBadge}>
                                    <Text style={styles.starText}>{nakshatraData.name}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1, // Square
        padding: 5,
        backgroundColor: '#fff8e7',
        alignSelf: 'center',
        maxWidth: 320, // Limit max width
    },
    outerBorder: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#8b0000',
        padding: 2,
    },
    grid: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#8b0000', // Grid lines color
    },
    cell: {
        position: 'absolute',
        width: '24.5%', // Slightly less than 25% for gap (grid line)
        height: '24.5%',
        backgroundColor: '#fff8e7',
        padding: 2,
        justifyContent: 'space-between',
    },
    centerBox: {
        position: 'absolute',
        top: '25.5%',
        left: '25.5%',
        width: '49%', // Span 2 cols
        height: '49%', // Span 2 rows
        backgroundColor: '#fff8e7',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cellHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    signId: {
        fontSize: 8,
        color: '#b91c1c',
        fontWeight: 'bold',
    },
    signTamil: {
        fontSize: 7,
        color: '#5c3a21',
        fontWeight: 'bold',
    },
    planetContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        flexDirection: 'row',
    },
    planetText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1a1a1a',
        fontFamily: 'serif', // Platform dependent, works on Android usually
        marginHorizontal: 1,
    },
    ascendant: {
        color: '#b91c1c',
    },
    watermarkContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
        zIndex: 10,
    },
    centerText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2a2a2a',
    },
    rasiTitleContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#8b0000',
        marginVertical: 2,
    },
    rasiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#8b0000',
        letterSpacing: 2,
    },
    starBadge: {
        backgroundColor: 'rgba(255, 248, 231, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    starText: {
        fontSize: 9,
        fontWeight: 'bold',
    }
});

export default RasiChart;
