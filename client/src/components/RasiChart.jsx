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

const RasiChart = ({ data }) => {
    // Determine effective data to render
    // If no data passed, use DEFAULT_DATA to show the design layout
    const chartData = (data && Object.keys(data).length > 0) ? data : { houses: DEFAULT_DATA, birthData: {}, moonNakshatra: {} };

    // Extract parts from the full data object
    // If data is just houses (old fallback), handle that, otherwise use full structure
    const housesData = chartData.houses || chartData;
    const birthData = chartData.birthData || {};
    const nakshatraData = chartData.moonNakshatra || {};

    // Helper to format date like "15 - March - 1994"
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

    // Debug log
    console.log("RasiChart Rendering. Data:", data, "Effective:", chartData);

    // Helper to find planets in a sign
    const getSignData = (signId) => {
        if (!housesData) return null;

        // Check if data is in the new "Houses" format (keys "1".."12" with signNumber)
        // We look for a value where signNumber matches our current signId
        const houses = Object.values(housesData);
        const houseData = houses.find(h => h.signNumber === signId);

        if (houseData) {
            // Map the simple string planets to objects for rendering
            const rawPlanets = houseData.planets || [];
            const mappedPlanets = rawPlanets.map(pName => {
                const isAsc = pName === 'Lagna' || pName === 'Asc';
                return {
                    name: isAsc ? 'Asc' : pName,
                    isAsc: isAsc,
                    // New data format doesn't seem to have per-planet degrees in this specific object
                    // but we can pass through if we find them later
                };
            });

            return {
                planets: mappedPlanets,
                signTamil: houseData.signTamil,
                degrees: houseData.degrees,
                aspectingPlanets: houseData.aspectingPlanets || [],
                isNewFormat: true
            };
        }

        // Fallback to old format logic if house structure not matched
        // This preserves backward compatibility if data is different
        let planets = [];
        if (housesData.planets) {
             if (Array.isArray(housesData.planets)) {
                 planets = housesData.planets.filter(p => p.sign === signId || p.signId === signId);
            } else if (typeof housesData.planets === 'object') {
                Object.keys(housesData.planets).forEach(key => {
                    const p = housesData.planets[key];
                     if (p.current_sign === signId || p.sign === signId) {
                         planets.push({ ...p, name: key });
                     }
                });
            }
        }
        if (housesData.ascendant && (housesData.ascendant.sign === signId || housesData.ascendant.current_sign === signId)) {
            planets.push({ name: 'Asc', isAsc: true });
        }

        return {
            planets: planets,
            signTamil: null,
            degrees: null,
            aspectingPlanets: [],
            isNewFormat: false
        };
    };

    return (
        <div
            className="w-full max-w-md mx-auto aspect-square shadow-lg relative p-1"
            style={{ backgroundColor: '#fff8e7', border: '2px solid #8b0000', aspectRatio: '1/1' }}
        >
             {/* Decorative Outer Border Effect */}
            <div className="absolute inset-0 m-1 pointer-events-none" style={{ border: '1px solid #8b0000' }}></div>

            <div
                className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: 'repeat(4, 1fr)',
                    backgroundColor: '#8b0000',
                    border: '1px solid #8b0000'
                }}
            >
                {gridMap.map((signId, index) => {
                    if (signId === null) {
                         // Center box (merged)
                         if (index === 5) {
                            return (
                                <div key="center"
                                     className="col-span-2 row-span-2 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden"
                                     style={{
                                         gridColumn: 'span 2',
                                         gridRow: 'span 2',
                                         backgroundColor: '#fff8e7'
                                     }}>

                                    {/* Ganesha Watermark - Using reliable data URI for Om/Pillayar */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                        <img
                                            src={GANESHA_SVG}
                                            alt="Pillayar 🕉️"
                                            className="w-3/4 h-3/4 object-contain"
                                            style={{ filter: 'sepia(1) hue-rotate(-50deg)' }}
                                        />
                                    </div>

                                    {/* Content matching the image */}
                                    <div className="relative z-10 flex flex-col items-center gap-1 font-serif" style={{ color: '#2a2a2a' }}>
                                        {formattedDate && <span className="text-sm font-bold tracking-wide">{formattedDate}</span>}
                                        {timeStr && <span className="text-sm font-bold tracking-wide mb-1">{timeStr}</span>}

                                        <span className="text-xl font-bold uppercase tracking-wider mt-1 leading-none pb-0.5" style={{ color: '#8b0000', borderBottom: '1px solid #8b0000' }}>Rasi</span>

                                        {nakshatraData.name && (
                                            <span className="text-sm font-semibold mt-1 px-2 rounded" style={{ backgroundColor: 'rgba(255, 248, 231, 0.8)' }}>
                                                {nakshatraData.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                         }
                         return null; // Skip occupied cells
                    }

                    const { planets, signTamil, degrees, aspectingPlanets } = getSignData(signId) || { planets: [] };

                    return (
                        <div
                            key={signId}
                            className="relative p-1 flex flex-col items-center justify-between hover:bg-[#fffdf5] transition-colors overflow-hidden h-full"
                            style={{
                                backgroundColor: '#fff8e7',
                                border: '0.5px solid #8b0000'
                            }}
                        >
                            {/* Header: Sign ID (Top Left) & Tamil Name (Top Center) */}
                            <div className="w-full flex justify-between items-start px-1 pt-0.5">
                                <span className="text-[10px] font-bold leading-none" style={{ color: '#b91c1c' }}>
                                    {signId}
                                </span>
                                {signTamil && (
                                     <span className="text-[9px] font-serif font-bold leading-none mt-0.5 opacity-90" style={{ color: '#5c3a21' }}>
                                        {signTamil}
                                     </span>
                                )}
                                <span className="w-2"></span> {/* Spacer */}
                            </div>

                            {/* Planets List - Center - Traditional Look */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 w-full my-1">
                                {planets.map((p, idx) => (
                                    <div key={idx} className="flex items-center leading-none">
                                        <span
                                            className={`text-sm font-bold font-serif`}
                                            style={{ color: p.isAsc ? '#b91c1c' : '#1a1a1a' }}
                                        >
                                            {planetShortTamilMap[p.name] || p.name.substring(0, 2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer: Aspecting Planets & Degrees */}
                            <div className="w-full flex flex-col items-center">
                                {/* Aspecting Planets - Very Small */}
                                {aspectingPlanets && aspectingPlanets.length > 0 && (
                                    <div className="text-[7px] leading-none text-center opacity-70 mb-0.5" style={{ color: '#8b4513' }}>
                                        (Pa: {aspectingPlanets.map(ap => planetShortTamilMap[ap] || ap.substring(0,2)).join(' ')})
                                    </div>
                                )}

                                {/* Degrees - Bottom Right Corner */}
                                {degrees !== null && degrees !== undefined && degrees > 0 && (
                                    <div className="self-end text-[8px] font-mono leading-none px-0.5 uppercase" style={{ color: '#4a5568' }}>

                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RasiChart;
