import React from 'react';
import { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, planetFullTamilMap, getSignId } from './RasiChart';

// Helper to find Star Lord if missing from API
const getNakshatraLordHelper = (nakName) => {
    if (!nakName) return '-';
    const lordMap = {
        'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
        'Rohini': 'Moon', 'Mrigashirsha': 'Mars', 'Ardra': 'Rahu',
        'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
        'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
        'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
        'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury',
        'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
        'Shravana': 'Moon', 'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu',
        'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury',
        // Tamil spellings
        'அசுவினி': 'Ketu', 'பரணி': 'Venus', 'கார்த்திகை': 'Sun',
        'ரோகிணி': 'Moon', 'மிருகசீரிடம்': 'Mars', 'திருவாதிரை': 'Rahu',
        'புனர்பூசம்': 'Jupiter', 'பூசம்': 'Saturn', 'ஆயில்யம்': 'Mercury',
        'மகம்': 'Ketu', 'பூரம்': 'Venus', 'உத்திரம்': 'Sun',
        'அஸ்தம்': 'Moon', 'சித்திரை': 'Mars', 'சுவாதி': 'Rahu',
        'விசாகம்': 'Jupiter', 'அனுஷம்': 'Saturn', 'கேட்டை': 'Mercury',
        'மூலம்': 'Ketu', 'பூராடம்': 'Venus', 'உத்திராடம்': 'Sun',
        'திருவோணம்': 'Moon', 'அவிட்டம்': 'Mars', 'சதயம்': 'Rahu',
        'பூரட்டாதி': 'Jupiter', 'உத்திரட்டாதி': 'Saturn', 'ரேவதி': 'Mercury'
    };
    for (const [key, val] of Object.entries(lordMap)) {
        if (nakName.includes(key)) return val;
    }
    return '-';
};

// Translate Lord or Planet name to Tamil
const translateLordToTamil = (lord) => {
    if (!lord || lord === '-') return '-';
    const str = String(lord).trim();
    if (signLordsTamil[str]) return signLordsTamil[str];
    if (planetFullTamilMap[str]) return planetFullTamilMap[str];
    return str;
};

// Classical dignity Tamil translation map
const dignityTamilMap = {
    'Exalted': 'உச்சம்',
    'Debilitated': 'நீசம்',
    'Own House': 'ஆட்சி',
    'Own': 'ஆட்சி',
    'Moolatrikona': 'மூலத்திரிகோணம்',
    'Friendly': 'நட்பு',
    'Friend': 'நட்பு',
    'Enemy': 'பகை',
    'Neutral': 'சமம்',
    'Great Friend': 'அதி நட்பு',
    'Great Enemy': 'அதி பகை'
};

const PlanetaryTable = ({ planets, style = {} }) => {
    let pList = [];
    if (!planets) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                No planetary data available (கிரக நிலை தரவு இல்லை)
            </div>
        );
    }

    if (Array.isArray(planets)) {
        pList = [...planets];
    } else if (typeof planets === 'object') {
        const root = planets.data || planets;

        if (Array.isArray(root.formattedPlanets) && root.formattedPlanets.length > 0) {
            pList = [...root.formattedPlanets];
        } else if (Array.isArray(planets.formattedPlanets) && planets.formattedPlanets.length > 0) {
            pList = [...planets.formattedPlanets];
        } else if (Array.isArray(root.planets) && root.planets.length > 0) {
            pList = [...root.planets];
        } else if (root.planets && typeof root.planets === 'object') {
            const entries = Object.entries(root.planets).filter(([k]) => k !== 'ascendant' && k !== 'ayanamsa' && k !== 'panchangam' && k !== 'data');
            pList = entries.map(([k, v]) => ({
                name: k,
                planetName: k,
                ...(typeof v === 'object' ? v : { longitude: v })
            }));
        } else {
            const entries = Object.entries(root).filter(([k]) => k !== 'ascendant' && k !== 'ayanamsa' && k !== 'panchangam' && k !== 'data' && k !== 'formattedPlanets' && k !== 'planets');
            pList = entries.map(([k, v]) => ({
                name: k,
                planetName: k,
                ...(typeof v === 'object' ? v : { longitude: v })
            }));
        }

        // Always check and prepend Ascendant (Lagna) if available and not already in list
        const asc = root.ascendant || planets.ascendant || (planets.data && planets.data.ascendant);
        if (asc && !pList.some(p => p.name === 'Ascendant' || p.name === 'Lagna' || p.name === 'Asc' || p.planetName === 'Ascendant' || p.planetName === 'Lagna' || p.planetName === 'Asc' || p.planetTamil === 'லக்னம்')) {
            const ascSign = typeof asc.sign === 'object' ? asc.sign : { name: asc.sign };
            pList.unshift({
                name: 'Ascendant',
                planetName: 'Ascendant',
                planetTamil: 'லக்னம்',
                signName: ascSign.name || ascSign.tamil,
                signTamil: ascSign.tamil,
                signLord: ascSign.lord,
                signLordTamil: ascSign.lordTamil || translateLordToTamil(ascSign.lord),
                nakshatraName: asc.nakshatra?.name || asc.nakshatra || '-',
                nakshatraTamil: asc.nakshatra?.tamil || asc.nakshatraTamil || (asc.nakshatra ? nakshatraTamilMap[asc.nakshatra] : '-'),
                nakshatraLord: asc.nakshatra?.lord || asc.nakshatraLord || getNakshatraLordHelper(asc.nakshatra?.name || asc.nakshatra),
                nakshatraLordTamil: asc.nakshatra?.lordTamil || translateLordToTamil(asc.nakshatra?.lord || asc.nakshatraLord),
                degreeFormatted: ascSign.degreesInSign !== undefined ? `${Number(ascSign.degreesInSign).toFixed(2)}°` : (asc.longitude !== undefined ? `${(Number(asc.longitude) % 30).toFixed(2)}°` : '-'),
                dignityName: '-',
                dignityTamil: '-',
                avasthaName: '-',
                avasthaTamil: '-',
                stateName: 'Direct',
                stateTamil: 'நேர்கதி'
            });
        }
    }

    if (!pList || pList.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                No planetary data available (கிரக நிலை தரவு இல்லை)
            </div>
        );
    }

    // Inline Styles for Portability
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        marginTop: '10px',
        ...style
    };

    const thStyle = {
        backgroundColor: '#D1FAE5', // Light Milk Green
        color: '#064E3B', // Deep Green
        padding: '8px',
        border: '1px solid #A7F3D0',
        textAlign: 'left',
        fontWeight: 'bold'
    };

    const tdStyle = {
        padding: '6px 8px',
        border: '1px solid #A7F3D0',
        color: '#000', // Black as requested
        textAlign: 'left'
    };

    const trOddStyle = {
        backgroundColor: 'rgba(16, 185, 129, 0.05)'
    };

    const trEvenStyle = {
        backgroundColor: 'transparent'
    };

    return (
        <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>கிரகம்</th>
                        <th style={thStyle}>ராசி</th>
                        <th style={thStyle}>ராசி அதிபதி</th>
                        <th style={thStyle}>நட்சத்திரம்</th>
                        <th style={thStyle}>நட்சத்திர அதிபதி</th>
                    </tr>
                </thead>
                <tbody>
                    {pList.map((p, index) => {
                        const pName = p.planetName || p.name || p.planet || p.englishName;
                        const pTamil = p.planetTamil || p.tamilName || planetFullTamilMap[pName] || pName;
                        
                        // Rasi Sign
                        const sId = getSignId(p.signId || p.signNumber || p.signName || p.sign || p.signTamil || p.longitude);
                        const sTamil = p.signTamil || (sId ? tamilSigns[sId] : (p.signName || p.sign || '-'));
                        
                        // Rasi Athipathi (Sign Lord in Tamil)
                        const rawLord = p.lordName || p.signLord || p.lord || (sId ? signLords[sId] : null);
                        const lordTamil = p.lordTamil || p.signLordTamil || translateLordToTamil(rawLord) || (sId ? signLordsTamil[signLords[sId]] : '-');
                        
                        // Nakshatra Name
                        const rawNak = p.nakshatraTamil || p.nakshatraName || p.nakshatra;
                        const nakTamil = nakshatraTamilMap[rawNak] || p.nakshatraTamil || rawNak || '-';
                        
                        // Nakshatra Athipathi (Star Lord in Tamil)
                        const rawNakLord = p.nakshatraLord || p.nakLord || p.starLord || (rawNak ? getNakshatraLordHelper(rawNak) : null);
                        const nakLordTamil = p.nakshatraLordTamil || translateLordToTamil(rawNakLord);

                        return (
                            <tr key={index} style={index % 2 === 0 ? trEvenStyle : trOddStyle}>
                                <td style={tdStyle}><strong>{pTamil}</strong></td>
                                <td style={tdStyle}>{sTamil}</td>
                                <td style={tdStyle}><span style={{ color: '#065F46', fontWeight: 'bold' }}>{lordTamil}</span></td>
                                <td style={tdStyle}>{nakTamil}</td>
                                <td style={tdStyle}><span style={{ color: '#1E40AF', fontWeight: 'bold' }}>{nakLordTamil}</span></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PlanetaryTable;
