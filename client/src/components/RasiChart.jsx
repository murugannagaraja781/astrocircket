import React from 'react';

// South Indian Chart Layout
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

// Grid Map (4x4)
const gridMap = [
    12, 1, 2, 3,
    11, null, null, 4,
    10, null, null, 5,
    9, 8, 7, 6
];

// Default Data
const DEFAULT_DATA = {
    "1": { "sign": "Karka", "signNumber": 4, "planets": ["Lagna"], "lord": "Moon" },
    "2": { "sign": "Simha", "signNumber": 5, "planets": [], "lord": "Sun" },
    "3": { "sign": "Kanya", "signNumber": 6, "planets": ["Mars", "Rahu"], "lord": "Mercury" },
    "4": { "sign": "Tula", "signNumber": 7, "planets": ["Moon"], "lord": "Venus" },
    "5": { "sign": "Vrishchika", "signNumber": 8, "planets": [], "lord": "Mars" },
    "6": { "sign": "Dhanu", "signNumber": 9, "planets": ["Mercury"], "lord": "Jupiter" },
    "7": { "sign": "Makara", "signNumber": 10, "planets": ["Sun", "Venus", "Jupiter"], "lord": "Saturn" },
    "8": { "sign": "Kumbha", "signNumber": 11, "planets": [], "lord": "Saturn" },
    "9": { "sign": "Meena", "signNumber": 12, "planets": ["Saturn", "Ketu"], "lord": "Jupiter" },
    "10": { "sign": "Mesha", "signNumber": 1, "planets": [], "lord": "Mars" },
    "11": { "sign": "Vrishabha", "signNumber": 2, "planets": [], "lord": "Venus" },
    "12": { "sign": "Mithuna", "signNumber": 3, "planets": [], "lord": "Mercury" }
};

const planetShortTamilMap = {
    'Sun': 'சூ', 'Moon': 'சந்', 'Mars': 'செவ்', 'Mercury': 'பு',
    'Jupiter': 'குரு', 'Venus': 'சுக்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
    'Asc': 'ல', 'Lagna': 'ல',
    'Jup': 'குரு', 'Mar': 'செவ்', 'Ven': 'சுக்', 'Sat': 'சனி', 'Mer': 'பு',
    'Mon': 'சந்', 'Rah': 'ராகு', 'Ket': 'கேது', 'Sun': 'சூ'
};



export const planetFullTamilMap = {
    'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
    'Jupiter': 'குரு', 'Venus': 'சுக்ரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
    'Asc': 'லக்னம்', 'Lagna': 'லக்னம்'
};

export const tamilSigns = {
    1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
    5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
    9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்"
};

export const signLords = {
    1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon",
    5: "Sun", 6: "Mercury", 7: "Venus", 8: "Mars",
    9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter"
};

export const signLordsTamil = {
    "Mars": "செவ்வாய்", "Venus": "சுக்ரன்", "Mercury": "புதன்", "Moon": "சந்திரன்",
    "Sun": "சூரியன்", "Jupiter": "குரு", "Saturn": "சனி"
};

export const nakshatraTamilMap = {
    "Ashwini": "அசுவினி", "Bharani": "பரணி", "Krittika": "கார்த்திகை",
    "Rohini": "ரோகிணி", "Mrigashirsha": "மிருகசீரிடம்", "Ardra": "திருவாதிரை",
    "Punarvasu": "புனர்பூசம்", "Pushya": "பூசம்", "Ashlesha": "ஆயில்யம்",
    "Magha": "மகம்", "Purva Phalguni": "பூரம்", "Uttara Phalguni": "உத்திரம்",
    "Hasta": "அஸ்தம்", "Chitra": "சித்திரை", "Swati": "சுவாதி",
    "Vishakha": "விசாகம்", "Anuradha": "அனுஷம்", "Jyeshtha": "கேட்டை",
    "Mula": "மூலம்", "Purva Ashadha": "பூராடம்", "Uttara Ashadha": "உத்திராடம்",
    "Shravana": "திருவோணம்", "Dhanishta": "அவிட்டம்", "Shatabhisha": "சதயம்",
    "Purva Bhadrapada": "பூரட்டாதி", "Uttara Bhadrapada": "உத்திரட்டாதி", "Revati": "ரேவதி",
    // Common alternative spellings
    "Aswini": "அசுவினி", "Karthigai": "கார்த்திகை", "Mirugasirish": "மிருகசீரிடம்",
    "Thiruvadhirai": "திருவாதிரை", "Punarpusam": "புனர்பூசம்", "Poosam": "பூசம்",
    "Ayilyam": "ஆயில்யம்", "Makam": "மகம்", "Pooram": "பூரம்", "Uthiram": "உத்திரம்",
    "Hastham": "அஸ்தம்", "Chithirai": "சித்திரை", "Swathi": "சுவாதி",
    "Visakam": "விசாகம்", "Anusham": "அனுஷம்", "Kettai": "கேட்டை",
    "Moolam": "மூலம்", "Pooradam": "பூராடம்", "Uthiradam": "உத்திராடம்",
    "Thiruvonam": "திருவோணம்", "Avittam": "அவிட்டம்", "Sadhayam": "சதயம்",
    "Poorattathi": "பூரட்டாதி", "Uthirattathi": "உத்திரட்டாதி"
};

const RasiChart = ({ data, style = {}, planetsData = null }) => {


    const chartData = (data && Object.keys(data).length > 0) ? data : { houses: DEFAULT_DATA, birthData: {}, moonNakshatra: {} };
    const housesData = chartData.houses || chartData;
    const birthData = chartData.birthData || {};
    const nakshatraData = chartData.moonNakshatra || {};

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return `${date.getDate()} - ${date.toLocaleString('default', { month: 'long' })} - ${date.getFullYear()}`;
    };

    const formattedDate = formatDate(birthData.date);
    const timeStr = birthData.time || "";

    // Get planet dignity color from planetsData
    const getPlanetColor = (planetName) => {
        if (!planetsData) return '#000';
        const pData = planetsData[planetName];
        if (pData && pData.dignityColor) {
            return pData.dignityColor;
        }
        return '#000'; // default black
    };

    const getSignData = (signId) => {
        const signTamil = tamilSigns[signId];
        // Use provided lord if available, else lookup
        let lord = signLords[signId];

        if (!housesData) {
             return { planets: [], signNumber: signId, isAscendantSign: false, signTamil, lord };
        }

        const houses = Object.values(housesData);
        const houseData = houses.find(h => h.signNumber === signId);

        if (houseData) {
            const rawPlanets = houseData.planets || [];
            const mappedPlanets = rawPlanets.map(pName => {
                const isAsc = pName === 'Lagna' || pName === 'Asc';
                const nameKey = isAsc ? 'Asc' : pName;
                // Use Tamil Short Map
                const displayName = planetShortTamilMap[nameKey] || nameKey.substring(0, 2);
                // Get dignity color
                const color = isAsc ? '#dc2626' : getPlanetColor(pName);
                return { name: displayName, isAsc: isAsc, color: color, fullName: pName };
            });
            return {
                planets: mappedPlanets,
                signNumber: signId,
                isAscendantSign: mappedPlanets.some(p => p.isAsc),
                signTamil: houseData.signTamil || signTamil, // Prefer data if exists
                lord: houseData.lord || lord
            };
        }
        return { planets: [], signNumber: signId, isAscendantSign: false, signTamil, lord };
    };

    // Styles
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Arial, Helvetica, sans-serif', // Normal font
        position: 'relative', // for absolute controls
        ...style
    };

    const controlsStyle = {
        position: 'absolute',
        top: '4px',
        right: '4px',
        display: 'flex',
        gap: '4px',
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: '2px',
        borderRadius: '4px',
        backdropFilter: 'blur(2px)'
    };

    const btnStyle = {
        padding: '2px 8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '1px solid #9ca3af',
        cursor: 'pointer'
    };

    const chartWrapperStyle = {
        overflow: 'auto',
        padding: '4px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
    };

    const chartBoxStyle = {
        width: '256px',
        margin: '0 auto',
        aspectRatio: '1/1',
        position: 'relative',
        transition: 'transform 0.2s',
        transformOrigin: 'top',
        transform: 'scale(1)',
        backgroundColor: '#000', // Black background for gaps (borders)
        border: '1px solid #000',
        boxSizing: 'border-box'
    };

    const gridStyle = {
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: '1px', // Creates the border lines
        backgroundColor: '#000',
    };

    const cellStyle = {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e0c097', // Content color
        // border: '1px solid #000', // Removed double border
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden' // Prevent spill
    };

    const centerBoxStyle = {
        gridColumn: 'span 2',
        gridRow: 'span 2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        textAlign: 'center',
        position: 'relative',
        backgroundColor: '#e0c097',
        overflow: 'hidden'
    };

    const signNumStyle = {
        position: 'absolute',
        top: '1px',
        left: '2px',
        fontSize: '9px',
        fontStyle: 'italic',
        fontWeight: 'bold',
        color: '#4b5563', // lighter gray for less distraction
        zIndex: 5
    };

    const ascBorderBoxStyle = {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        border: '2px solid #dc2626',
        zIndex: 0,
        pointerEvents: 'none'
    };

    const planetsContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        zIndex: 10,
        paddingTop: '10px' // reduced padding
    };

    const planetTextStyle = {
        fontSize: '11px', // Smaller font for planets
        fontStyle: 'italic',
        fontWeight: 'bold',
        color: '#000',
        lineHeight: '1.1',
        margin: '0'
    };

    return (
        <div style={containerStyle}>


            <div style={chartWrapperStyle}>
                <div style={chartBoxStyle}>
                    <div style={gridStyle}>
                        {gridMap.map((signId, index) => {
                            if (signId === null) {
                                if (index === 5) {
                                    return (
                                        <div key="center" style={centerBoxStyle}>
                                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#000', fontSize: '10px', fontWeight: 'bold', width: '100%', height: '100%' }}>
                                                <div style={{textAlign: 'center'}}>
                                                    <span style={{ fontSize: '16px', fontStyle: 'italic', fontWeight: 'bold' }}>இராசி கட்டம்</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            const { planets, signNumber, isAscendantSign, signTamil, lord } = getSignData(signId);

                            return (
                                <div key={signId} style={cellStyle}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: '2px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        pointerEvents: 'none'
                                    }}>
                                        {/* House number removed - only showing Tamil sign name */}
                                        <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'bold' }}>{signTamil}</span>
                                    </div>

                                    {isAscendantSign && <div style={ascBorderBoxStyle}></div>}

                                    <div style={planetsContainerStyle}>
                                        {planets.map((p, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    ...planetTextStyle,
                                                    color: p.color || '#000',
                                                    textShadow: p.color ? '0 0 2px rgba(255,255,255,0.8)' : 'none'
                                                }}
                                                title={p.fullName}
                                            >
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>

                                     <div style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        fontSize: '8px',
                                        color: '#9ca3af',
                                        pointerEvents: 'none'
                                    }}>
                                        {lord && lord.substring(0, 3)}
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