import React from 'react';

// South Indian Chart Layout
// The signs are fixed in position:
// 12 (Pisces) | 1 (Aries)   | 2 (Taurus) | 3 (Gemini)
// 11 (Aquar)  |             |            | 4 (Cancer)
// 10 (Capri)  |             |            | 5 (Leo)
// 9  (Sagit)  | 8 (Scorpio) | 7 (Libra)  | 6 (Virgo)

const signs = [
    { id: 12, name: 'Pisces', label: 'Pisces' },
    { id: 1, name: 'Aries', label: 'Aries' },
    { id: 2, name: 'Taurus', label: 'Taurus' },
    { id: 3, name: 'Gemini', label: 'Gemini' },
    { id: 11, name: 'Aquarius', label: 'Aquarius' },
    { id: 4, name: 'Cancer', label: 'Cancer' },
    { id: 10, name: 'Capricorn', label: 'Capricorn' },
    { id: 5, name: 'Leo', label: 'Leo' },
    { id: 9, name: 'Sagittarius', label: 'Sagittarius' },
    { id: 8, name: 'Scorpio', label: 'Scorpio' },
    { id: 7, name: 'Libra', label: 'Libra' },
    { id: 6, name: 'Virgo', label: 'Virgo' }
];

// Map grid position to Sign ID for the render loop
// We render a 4x4 grid.
// Row 1: 12, 1, 2, 3
// Row 2: 11, null, null, 4
// Row 3: 10, null, null, 5
// Row 4: 9, 8, 7, 6

const gridMap = [
    12, 1, 2, 3,
    11, null, null, 4,
    10, null, null, 5,
    9, 8, 7, 6
];

// Fallback/Demo Data to show if API returns empty
const DEFAULT_DATA = {
    "1": { "sign": "Karka", "signTamil": "கடகம்", "signNumber": 4, "planets": ["Lagna"], "lord": "Moon", "degrees": 5.72, "aspectingPlanets": ["Sun", "Venus", "Jupiter"] },
    "2": { "sign": "Simha", "signTamil": "சிம்மம்", "signNumber": 5, "planets": [], "lord": "Sun", "degrees": 0, "aspectingPlanets": [] },
    "3": { "sign": "Kanya", "signTamil": "கன்னி", "signNumber": 6, "planets": ["Mars", "Rahu"], "lord": "Mercury", "degrees": 0, "aspectingPlanets": ["Jupiter", "Saturn", "Ketu"] },
    "4": { "sign": "Tula", "signTamil": "துலாம்", "signNumber": 7, "planets": ["Moon"], "lord": "Venus", "degrees": 0, "aspectingPlanets": [] },
    "5": { "sign": "Vrishchika", "signTamil": "விருச்சிகம்", "signNumber": 8, "planets": [], "lord": "Mars", "degrees": 0, "aspectingPlanets": [] },
    "6": { "sign": "Dhanu", "signTamil": "தனுசு", "signNumber": 9, "planets": ["Mercury"], "lord": "Jupiter", "degrees": 0, "aspectingPlanets": ["Mars", "Saturn"] },
    "7": { "sign": "Makara", "signTamil": "மகரம்", "signNumber": 10, "planets": ["Sun", "Venus", "Jupiter"], "lord": "Saturn", "degrees": 0, "aspectingPlanets": [] },
    "8": { "sign": "Kumbha", "signTamil": "கும்பம்", "signNumber": 11, "planets": [], "lord": "Saturn", "degrees": 0, "aspectingPlanets": [] },
    "9": { "sign": "Meena", "signTamil": "மீனம்", "signNumber": 12, "planets": ["Saturn", "Ketu"], "lord": "Jupiter", "degrees": 0, "aspectingPlanets": ["Mars", "Rahu"] },
    "10": { "sign": "Mesha", "signTamil": "மேஷம்", "signNumber": 1, "planets": [], "lord": "Mars", "degrees": 0, "aspectingPlanets": ["Moon", "Mars"] },
    "11": { "sign": "Vrishabha", "signTamil": "ரிஷபம்", "signNumber": 2, "planets": [], "lord": "Venus", "degrees": 0, "aspectingPlanets": ["Jupiter", "Saturn"] },
    "12": { "sign": "Mithuna", "signTamil": "மிதுனம்", "signNumber": 3, "planets": [], "lord": "Mercury", "degrees": 0, "aspectingPlanets": ["Mercury"] }
};

const planetTamilMap = {
    'Sun': 'சூரியன்',
    'Moon': 'சந்திரன்',
    'Mars': 'செவ்வாய்',
    'Mercury': 'புதன்',
    'Jupiter': 'குரு',
    'Venus': 'சுக்கிரன்',
    'Saturn': 'சனி',
    'Rahu': 'ராகு',
    'Ketu': 'கேது',
    'Asc': 'ல',
    'Lagna': 'ல'
};

const planetShortTamilMap = {
    'Sun': 'சூ',
    'Moon': 'சந்',
    'Mars': 'செவ்',
    'Mercury': 'பு',
    'Jupiter': 'குரு',
    'Venus': 'சுக்',
    'Saturn': 'சனி',
    'Rahu': 'ராகு',
    'Ketu': 'கேது',
    'Asc': 'ல',
    'Lagna': 'ல'
};

// Reliable embedded SVG for Pillayar (Om Symbol) to ensure no broken images
const GANESHA_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50%25' y='60%25' font-size='80' text-anchor='middle' dominant-baseline='middle' fill='%238b0000'%3E%F0%9F%95%89%EF%B8%8F%3C/text%3E%3C/svg%3E";

// Parchment / Old Paper Style Colors matching the image
const themeColors = {
  primary: '#000000', // Black text
  secondary: '#8b0000', // Red for Ascendant highlight
  accent: '#a0522d', // Sienna/Brown
  dark: '#2c1810', // Dark brown border
  light: '#e0c097', // Parchment color (darker beige)
  gridLine: '#000000', // Black grid lines
  bg: '#e6ccb3' // Overall background
};

// Map full names to the short lowercase style seen in image (ju, sa, asc, ra...)
const planetShortCode = {
    'Sun': 'su', 'Moon': 'mo', 'Mars': 'ma', 'Mercury': 'me',
    'Jupiter': 'ju', 'Venus': 've', 'Saturn': 'sa', 'Rahu': 'ra', 'Ketu': 'ke',
    'Asc': 'asc', 'Lagna': 'asc'
};

const RasiChart = ({ data }) => {
    // Zoom State
    const [scale, setScale] = React.useState(1);
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));

    // Determine effective data to render... (omitted lines match, skipping re-definition for brevity in replacement if possible, but easier to replace block)
    // If no data passed, use DEFAULT_DATA to show the design layout
    const chartData = (data && Object.keys(data).length > 0) ? data : { houses: DEFAULT_DATA, birthData: {}, moonNakshatra: {} };

    const housesData = chartData.houses || chartData;
    const birthData = chartData.birthData || {};
    const nakshatraData = chartData.moonNakshatra || {};

    // Helper to format date...
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `${day} - ${month} - ${year}`;
    };

    const formattedDate = formatDate(birthData.date);
    const timeStr = birthData.time || "";

    // Helper to find planets in a sign...
    const getSignData = (signId) => {
        if (!housesData) return null;
        const houses = Object.values(housesData);
        const houseData = houses.find(h => h.signNumber === signId);

        if (houseData) {
            const rawPlanets = houseData.planets || [];
            const mappedPlanets = rawPlanets.map(pName => {
                const isAsc = pName === 'Lagna' || pName === 'Asc';
                const nameKey = isAsc ? 'Asc' : pName;
                const displayName = planetShortCode[nameKey] || nameKey.substring(0, 2).toLowerCase();

                let details = {}; // Omit degrees in this style as per image
                return { name: displayName, isAsc: isAsc, ...details };
            });
            return {
                planets: mappedPlanets,
                signNumber: signId,
                isAscendantSign: mappedPlanets.some(p => p.isAsc)
            };
        }
        // Fallback...
        return { planets: [], signNumber: signId, isAscendantSign: false };
    };

    return (
        <div className="flex flex-col items-center">
            {/* Zoom Controls */}
            <div className="flex gap-2 mb-2">
                <button
                    onClick={handleZoomOut}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold border border-gray-400"
                    title="Zoom Out"
                >
                    -
                </button>
                <span className="text-xs self-center font-mono text-gray-500">{(scale * 100).toFixed(0)}%</span>
                <button
                    onClick={handleZoomIn}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold border border-gray-400"
                    title="Zoom In"
                >
                    +
                </button>
            </div>

            {/* Scrollable Container for Zoomed Chart */}
            <div className="overflow-auto p-1 flex justify-center w-full">
                <div
                    className="w-64 mx-auto aspect-square relative p-0 transition-transform origin-top"
                    style={{
                        backgroundColor: '#e6ccb3', // Outer bg
                        border: '1px solid #000',
                        aspectRatio: '1/1',
                        transform: `scale(${scale})`,
                        fontFamily: '"Brush Script MT", cursive' // Handwriting font
                    }}
                >

                <div
                    className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0"
                    style={{
                        backgroundColor: '#000', // Grid lines color
                        border: '1px solid #000'
                    }}
                >
                    {gridMap.map((signId, index) => {
                        if (signId === null) {
                             if (index === 5) {
                                return (
                                    <div key="center"
                                         className="col-span-2 row-span-2 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden"
                                         style={{
                                             gridColumn: 'span 2',
                                             gridRow: 'span 2',
                                             backgroundColor: '#e0c097' // Center box bg
                                         }}>
                                        <div className="relative z-10 flex flex-col items-center gap-1 leading-tight text-black">
                                            {formattedDate && <span className="text-sm italic">{formattedDate}</span>}
                                            {timeStr && <span className="text-sm italic mb-2">{timeStr}</span>}

                                            <span className="text-lg italic font-bold">Rasi</span>

                                            {nakshatraData.name && (
                                                <span className="text-sm italic">
                                                    {nakshatraData.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                             }
                             return null;
                        }

                        const { planets, signNumber, isAscendantSign } = getSignData(signId) || { planets: [], signNumber: signId };

                        return (
                            <div
                                key={signId}
                                className="relative flex flex-col items-center justify-center h-full"
                                style={{
                                    backgroundColor: '#e0c097', // Cell bg
                                    border: '1px solid #000' // Cell border
                                }}
                            >
                                {/* Sign Number - Top Left */}
                                <span className="absolute top-0 left-1 text-xs italic font-bold text-black">
                                    {signNumber}
                                </span>

                                {/* Ascendant Highlight Box */}
                                {isAscendantSign && (
                                    <div className="absolute inset-0 border-2 border-red-600 pointer-events-none z-0"></div>
                                )}

                                {/* Planets List - Vertical/Centered */}
                                <div className="flex flex-col items-center justify-center w-full h-full z-10 pt-3">
                                    {planets.map((p, idx) => (
                                        <span
                                            key={idx}
                                            className="text-sm italic font-bold text-black leading-none my-0.5"
                                        >
                                            {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                </div>
                </div>
        </div>
    );
};

export default RasiChart;
