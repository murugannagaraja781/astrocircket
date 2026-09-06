import React, { useMemo } from 'react';

// South Indian Chart Layout
export const signs = [
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

// Grid Map (4x4 South Indian Format)
export const gridMap = [
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

export const planetShortTamilMap = {
    'Sun': 'சூ', 'Moon': 'சந்', 'Mars': 'செவ்', 'Mercury': 'பு',
    'Jupiter': 'குரு', 'Venus': 'சுக்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
    'Asc': 'ல', 'Lagna': 'ல', 'Ascendant': 'ல',
    'Jup': 'குரு', 'Mar': 'செவ்', 'Ven': 'சுக்', 'Sat': 'சனி', 'Mer': 'பு',
    'Mon': 'சந்', 'Rah': 'ராகு', 'Ket': 'கேது',
    'சூரியன்': 'சூ', 'சந்திரன்': 'சந்', 'செவ்வாய்': 'செவ்', 'புதன்': 'பு',
    'குரு': 'குரு', 'சுக்கிரன்': 'சுக்', 'சுக்ரன்': 'சுக்', 'சனி': 'சனி',
    'ராகு': 'ராகு', 'கேது': 'கேது', 'லக்னம்': 'ல', 'லக்': 'ல'
};

export const planetFullTamilMap = {
    'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
    'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
    'Asc': 'லக்னம்', 'Lagna': 'லக்னம்', 'Ascendant': 'லக்னம்',
    'Jup': 'குரு', 'Mar': 'செவ்வாய்', 'Ven': 'சுக்கிரன்', 'Sat': 'சனி', 'Mer': 'புதன்',
    'Mon': 'சந்திரன்', 'Rah': 'ராகு', 'Ket': 'கேது'
};

export const tamilSigns = {
    1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
    5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
    9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்"
};

export const englishSigns = {
    1: "Aries", 2: "Taurus", 3: "Gemini", 4: "Cancer",
    5: "Leo", 6: "Virgo", 7: "Libra", 8: "Scorpio",
    9: "Sagittarius", 10: "Capricorn", 11: "Aquarius", 12: "Pisces"
};

export const signLords = {
    1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon",
    5: "Sun", 6: "Mercury", 7: "Venus", 8: "Mars",
    9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter"
};

export const signLordsTamil = {
    "Mars": "செவ்வாய்", "Venus": "சுக்கிரன்", "Mercury": "புதன்", "Moon": "சந்திரன்",
    "Sun": "சூரியன்", "Jupiter": "குரு", "Saturn": "சனி",
    "செவ்வாய்": "செவ்வாய்", "சுக்கிரன்": "சுக்கிரன்", "சுக்ரன்": "சுக்கிரன்", "புதன்": "புதன்",
    "சந்திரன்": "சந்திரன்", "சூரியன்": "சூரியன்", "குரு": "குரு", "சனி": "சனி"
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

export const getSignId = (input) => {
    if (input === null || input === undefined) return null;
    if (typeof input === 'number') {
        if (input >= 1 && input <= 12 && Number.isInteger(input)) return input;
        return Math.floor(((input % 360) + 360) % 360 / 30) + 1;
    }
    if (typeof input === 'object') {
        if (input.id && input.id >= 1 && input.id <= 12) return Number(input.id);
        if (input.signNumber && input.signNumber >= 1 && input.signNumber <= 12) return Number(input.signNumber);
        if (input.sign) return getSignId(input.sign);
        if (input.name) return getSignId(input.name);
        if (input.tamil) return getSignId(input.tamil);
        if (typeof input.longitude === 'number') return Math.floor(((input.longitude % 360) + 360) % 360 / 30) + 1;
    }
    const str = String(input).trim().toLowerCase();
    const map = {
        'aries': 1, 'mesha': 1, 'mesham': 1, 'மேஷம்': 1,
        'taurus': 2, 'vrishabha': 2, 'vrishabh': 2, 'rishaba': 2, 'rishabam': 2, 'ரிஷபம்': 2,
        'gemini': 3, 'mithuna': 3, 'mithunam': 3, 'மிதுனம்': 3,
        'cancer': 4, 'karka': 4, 'karkata': 4, 'katakam': 4, 'kadagam': 4, 'கடகம்': 4,
        'leo': 5, 'simha': 5, 'simham': 5, 'சிம்மம்': 5,
        'virgo': 6, 'kanya': 6, 'kanni': 6, 'கன்னி': 6,
        'libra': 7, 'tula': 7, 'thulam': 7, 'துலாம்': 7,
        'scorpio': 8, 'vrishchika': 8, 'vrischika': 8, 'viruchigam': 8, 'விருச்சிகம்': 8,
        'sagittarius': 9, 'dhanu': 9, 'dhanusu': 9, 'தனுசு': 9,
        'capricorn': 10, 'makara': 10, 'makaram': 10, 'மகரம்': 10,
        'aquarius': 11, 'kumbha': 11, 'kumbham': 11, 'கும்பம்': 11,
        'pisces': 12, 'meena': 12, 'meenam': 12, 'மீனம்': 12
    };
    return map[str] || null;
};

// Classical Vedic Dignity helper for color assignment
export const getDignityColor = (planetName, signId, planetObj = null, planetsData = null) => {
    // 1. Direct planetsData lookup
    if (planetsData && planetsData[planetName]?.dignityColor) {
        return planetsData[planetName].dignityColor;
    }

    // 2. Direct planetObj dignity
    if (planetObj) {
        if (planetObj.dignityColor) return planetObj.dignityColor;
        const dStr = String(planetObj.dignity || planetObj.dignityName || planetObj.dignityTamil || '').toLowerCase();
        if (['exalted', 'uchcham', 'உச்சம்'].some(v => dStr.includes(v))) return '#059669'; // Green
        if (['own', 'atchi', 'ஆட்சி', 'moolatrikona'].some(v => dStr.includes(v))) return '#d97706'; // Orange
        if (['debilitated', 'neecham', 'நீசம்'].some(v => dStr.includes(v))) return '#dc2626'; // Red
        if (['friendly', 'natpu', 'நட்பு'].some(v => dStr.includes(v))) return '#2563eb'; // Blue
    }

    // 3. Fallback to classical astrological dignities by signId
    if (signId) {
        const pNorm = String(planetName).toLowerCase();
        if (pNorm.includes('sun') || pNorm === 'சூ' || pNorm === 'சூரியன்') {
            if (signId === 1) return '#059669'; // Exalted in Aries
            if (signId === 5) return '#d97706'; // Own in Leo
            if (signId === 7) return '#dc2626'; // Debilitated in Libra
            if ([9, 12, 4, 8].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('moon') || pNorm === 'சந்' || pNorm === 'சந்திரன்') {
            if (signId === 2) return '#059669'; // Exalted in Taurus
            if (signId === 4) return '#d97706'; // Own in Cancer
            if (signId === 8) return '#dc2626'; // Debilitated in Scorpio
            if ([1, 5, 3, 6].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('mar') || pNorm === 'செவ்' || pNorm === 'செவ்வாய்') {
            if (signId === 10) return '#059669'; // Exalted in Capricorn
            if (signId === 1 || signId === 8) return '#d97706'; // Own in Aries/Scorpio
            if (signId === 4) return '#dc2626'; // Debilitated in Cancer
            if ([5, 9, 12].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('mer') || pNorm === 'பு' || pNorm === 'புதன்') {
            if (signId === 6) return '#059669'; // Exalted in Virgo
            if (signId === 3) return '#d97706'; // Own in Gemini
            if (signId === 12) return '#dc2626'; // Debilitated in Pisces
            if ([5, 2, 7].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('jup') || pNorm === 'குரு') {
            if (signId === 4) return '#059669'; // Exalted in Cancer
            if (signId === 9 || signId === 12) return '#d97706'; // Own in Sagit/Pisces
            if (signId === 10) return '#dc2626'; // Debilitated in Cap
            if ([1, 5, 8].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('ven') || pNorm === 'சுக்' || pNorm === 'சுக்கிரன்' || pNorm === 'சுக்ரன்') {
            if (signId === 12) return '#059669'; // Exalted in Pisces
            if (signId === 2 || signId === 7) return '#d97706'; // Own in Taurus/Libra
            if (signId === 6) return '#dc2626'; // Debilitated in Virgo
            if ([3, 10, 11].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('sat') || pNorm === 'சனி') {
            if (signId === 7) return '#059669'; // Exalted in Libra
            if (signId === 10 || signId === 11) return '#d97706'; // Own in Cap/Aquar
            if (signId === 1) return '#dc2626'; // Debilitated in Aries
            if ([3, 6, 2].includes(signId)) return '#2563eb'; // Friendly
        } else if (pNorm.includes('rah') || pNorm === 'ராகு') {
            if (signId === 2 || signId === 3) return '#059669'; // Exalted
            if (signId === 11) return '#d97706'; // Own
            if (signId === 8 || signId === 9) return '#dc2626'; // Debilitated
            if ([7, 10].includes(signId)) return '#2563eb';
        } else if (pNorm.includes('ket') || pNorm === 'கேது') {
            if (signId === 8 || signId === 9) return '#059669'; // Exalted
            if (signId === 8) return '#d97706'; // Own
            if (signId === 2 || signId === 3) return '#dc2626'; // Debilitated
            if ([1, 4, 5].includes(signId)) return '#2563eb';
        }
    }

    return '#111827'; // Dark Gray default
};

const RasiChart = ({ data, style = {}, planetsData = null }) => {
    // Universal Chart Normalization
    const normalizedChart = useMemo(() => {
        const raw = (data && Object.keys(data).length > 0) ? (data.data || data) : null;

        // Initialize 12 signs map
        const signsMap = {};
        for (let i = 1; i <= 12; i++) {
            signsMap[i] = {
                signNumber: i,
                signTamil: tamilSigns[i],
                signEnglish: englishSigns[i],
                lord: signLords[i],
                lordTamil: signLordsTamil[signLords[i]],
                isAscendantSign: false,
                planets: []
            };
        }

        if (!raw) {
            // Apply DEFAULT_DATA
            Object.values(DEFAULT_DATA).forEach(h => {
                const sId = h.signNumber;
                if (signsMap[sId]) {
                    signsMap[sId].planets = (h.planets || []).map(p => {
                        const isAsc = p === 'Lagna' || p === 'Asc';
                        return {
                            name: planetShortTamilMap[p] || p,
                            fullName: p,
                            isAsc,
                            color: isAsc ? '#dc2626' : getDignityColor(p, sId, null, planetsData)
                        };
                    });
                    if (signsMap[sId].planets.some(p => p.isAsc)) {
                        signsMap[sId].isAscendantSign = true;
                    }
                }
            });
            return {
                signsMap,
                formattedDate: '',
                timeStr: '',
                moonSignTamil: '',
                nakshatraTamil: ''
            };
        }

        // 1. Find Ascendant / Lagna Sign ID
        let ascSignId = null;
        if (raw.ascendant) {
            if (typeof raw.ascendant === 'number') ascSignId = getSignId(raw.ascendant);
            else if (raw.ascendant.sign) ascSignId = getSignId(raw.ascendant.sign);
            else if (raw.ascendant.signNumber) ascSignId = Number(raw.ascendant.signNumber);
            else if (raw.ascendant.id) ascSignId = Number(raw.ascendant.id);
            else if (raw.ascendant.name) ascSignId = getSignId(raw.ascendant.name);
            else if (raw.ascendant.tamil) ascSignId = getSignId(raw.ascendant.tamil);
            else if (typeof raw.ascendant.longitude === 'number') ascSignId = getSignId(raw.ascendant.longitude);
        }
        if (!ascSignId && raw.ascendantSign) ascSignId = getSignId(raw.ascendantSign);
        if (!ascSignId && raw.lagna) ascSignId = getSignId(raw.lagna);
        if (!ascSignId && raw.lagnaSign) ascSignId = getSignId(raw.lagnaSign);

        // 2. Parse Houses if available
        if (raw.houses) {
            const housesList = Array.isArray(raw.houses) ? raw.houses : Object.values(raw.houses);
            housesList.forEach(h => {
                const sId = h.signNumber ? Number(h.signNumber) : (getSignId(h.sign) || getSignId(h.signTamil) || Number(h.house));
                if (sId && signsMap[sId]) {
                    const rawPlanets = h.planets || [];
                    rawPlanets.forEach(p => {
                        const pName = typeof p === 'string' ? p : (p.name || p.planetName);
                        if (!pName) return;
                        const isAsc = pName === 'Lagna' || pName === 'Asc' || pName === 'Ascendant' || pName === 'லக்னம்';
                        if (isAsc) {
                            ascSignId = sId;
                        } else {
                            if (!signsMap[sId].planets.some(existing => existing.fullName === pName)) {
                                signsMap[sId].planets.push({
                                    name: planetShortTamilMap[pName] || pName.substring(0, 2),
                                    fullName: pName,
                                    isAsc: false,
                                    color: getDignityColor(pName, sId, typeof p === 'object' ? p : null, planetsData)
                                });
                            }
                        }
                    });
                }
            });
        }

        // 3. Parse Planets Object/Array if available
        if (raw.planets) {
            if (Array.isArray(raw.planets)) {
                raw.planets.forEach(p => {
                    const pName = p.name || p.planetName || p.planet || p.Planet;
                    if (!pName) return;
                    const sId = getSignId(p.signId || p.signNumber || p.sign || p.signTamil || p.longitude || p.Degree);
                    if (sId && signsMap[sId]) {
                        if (!signsMap[sId].planets.some(existing => existing.fullName === pName)) {
                            signsMap[sId].planets.push({
                                name: planetShortTamilMap[pName] || pName.substring(0, 2),
                                fullName: pName,
                                isAsc: false,
                                color: getDignityColor(pName, sId, p, planetsData)
                            });
                        }
                    }
                });
            } else if (typeof raw.planets === 'object') {
                Object.entries(raw.planets).forEach(([pName, pVal]) => {
                    if (!pName) return;
                    let sId = null;
                    if (typeof pVal === 'number') {
                        sId = getSignId(pVal);
                    } else if (typeof pVal === 'object' && pVal !== null) {
                        sId = getSignId(pVal.signId || pVal.signNumber || pVal.sign || pVal.signTamil || pVal.longitude);
                    } else if (typeof pVal === 'string') {
                        sId = getSignId(pVal);
                    }
                    if (sId && signsMap[sId]) {
                        if (!signsMap[sId].planets.some(existing => existing.fullName === pName)) {
                            signsMap[sId].planets.push({
                                name: planetShortTamilMap[pName] || pName.substring(0, 2),
                                fullName: pName,
                                isAsc: false,
                                color: getDignityColor(pName, sId, typeof pVal === 'object' ? pVal : null, planetsData)
                            });
                        }
                    }
                });
            }
        }

        // 4. Parse Formatted Planets if available
        if (Array.isArray(raw.formattedPlanets)) {
            raw.formattedPlanets.forEach(p => {
                const pName = p.name || p.planetName || p.planet || p.Planet;
                if (!pName) return;
                const sId = getSignId(p.signId || p.signNumber || p.sign || p.signTamil || p.longitude || p.Degree);
                if (sId && signsMap[sId]) {
                    if (!signsMap[sId].planets.some(existing => existing.fullName === pName)) {
                        signsMap[sId].planets.push({
                            name: planetShortTamilMap[pName] || pName.substring(0, 2),
                            fullName: pName,
                            isAsc: false,
                            color: getDignityColor(pName, sId, p, planetsData)
                        });
                    }
                }
            });
        }

        // 5. Add Lagna to the ascertained sign box
        if (ascSignId && signsMap[ascSignId]) {
            signsMap[ascSignId].isAscendantSign = true;
            if (!signsMap[ascSignId].planets.some(p => p.isAsc)) {
                signsMap[ascSignId].planets.unshift({
                    name: 'ல',
                    fullName: 'Lagna',
                    isAsc: true,
                    color: '#dc2626'
                });
            }
        }

        // 6. Center Box Info (Date, Time, Moon Sign, Nakshatra)
        const birthData = raw.birthData || {};
        const rawDate = birthData.date || raw.dob || raw.date || raw.timestamp || raw.input?.date || (raw.input ? `${raw.input.year}-${raw.input.month}-${raw.input.day}` : '');
        const timeStr = birthData.time || raw.birthTime || raw.time || (raw.input ? `${raw.input.hour}:${raw.input.minute}` : '');

        let formattedDate = '';
        if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = `${dateObj.getDate().toString().padStart(2, '0')} - ${dateObj.toLocaleString('default', { month: 'long' })} - ${dateObj.getFullYear()}`;
            } else {
                formattedDate = String(rawDate);
            }
        }

        // Moon Sign
        const moonObj = raw.moonSign || raw.planets?.Moon || {};
        const moonSignTamil = moonObj.tamil || moonObj.signTamil || (moonObj.name ? tamilSigns[getSignId(moonObj.name)] : '') || (moonObj.sign ? tamilSigns[getSignId(moonObj.sign)] : '');

        // Nakshatra
        const nakObj = raw.nakshatra || raw.moonNakshatra || raw.planets?.Moon?.nakshatra || {};
        const nakName = typeof nakObj === 'string' ? nakObj : (nakObj.name || nakObj.tamil || raw.planets?.Moon?.nakshatraTamil || '');
        const nakshatraTamil = nakshatraTamilMap[nakName] || nakName;

        return {
            signsMap,
            formattedDate,
            timeStr,
            moonSignTamil,
            nakshatraTamil
        };
    }, [data, planetsData]);

    const { signsMap, formattedDate, timeStr, moonSignTamil, nakshatraTamil } = normalizedChart;

    // Styles
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Arial, Helvetica, sans-serif',
        position: 'relative',
        ...style
    };

    const chartWrapperStyle = {
        overflow: 'auto',
        padding: '4px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
    };

    const chartBoxStyle = {
        width: '260px',
        margin: '0 auto',
        aspectRatio: '1/1',
        position: 'relative',
        transition: 'transform 0.2s',
        transformOrigin: 'top',
        transform: 'scale(1)',
        backgroundColor: '#000',
        border: '1px solid #000',
        boxSizing: 'border-box'
    };

    const gridStyle = {
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: '1px',
        backgroundColor: '#000',
    };

    const cellStyle = {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e0c097',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
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

    const ascBorderBoxStyle = {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        border: '2px solid #dc2626',
        zIndex: 0,
        pointerEvents: 'none'
    };

    const planetsContainerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        width: '100%',
        height: '100%',
        zIndex: 10,
        padding: '2px'
    };

    const planetTextStyle = {
        fontSize: '11px',
        fontStyle: 'italic',
        fontWeight: 'bold',
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
                                            <div style={{
                                                position: 'relative',
                                                zIndex: 10,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '2px',
                                                color: '#000',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                height: '100%'
                                            }}>
                                                {/* Date & Time */}
                                                {formattedDate && <div style={{ fontSize: '10px', color: '#B91C1C' }}>{formattedDate}</div>}
                                                {timeStr && <div style={{ fontSize: '10px', color: '#B91C1C', marginBottom: '2px' }}>{timeStr}</div>}

                                                <div style={{
                                                    textAlign: 'center',
                                                    borderTop: '1px solid #B91C1C',
                                                    borderBottom: '1px solid #B91C1C',
                                                    margin: '2px 0',
                                                    padding: '2px 0',
                                                    width: '90%'
                                                }}>
                                                    <span style={{ fontSize: '14px', fontStyle: 'italic', fontWeight: 'bold', color: '#B91C1C', letterSpacing: '1px' }}>
                                                        RASI
                                                    </span>
                                                </div>

                                                {/* Rasi & Nakshatra */}
                                                {(moonSignTamil || nakshatraTamil) && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                                                        {moonSignTamil && (
                                                            <div style={{ fontSize: '11px', color: '#1F2937' }}>
                                                                {moonSignTamil}
                                                            </div>
                                                        )}
                                                        {nakshatraTamil && (
                                                            <div style={{
                                                                fontSize: '10px',
                                                                color: '#B91C1C',
                                                                backgroundColor: 'rgba(255, 237, 213, 0.7)',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #FED7AA'
                                                            }}>
                                                                {nakshatraTamil}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            const signData = signsMap[signId] || { planets: [], isAscendantSign: false };

                            return (
                                <div key={signId} style={cellStyle}>
                                    {signData.isAscendantSign && <div style={ascBorderBoxStyle}></div>}

                                    <div style={planetsContainerStyle}>
                                        {signData.planets.map((p, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    ...planetTextStyle,
                                                    color: p.color || '#000',
                                                    textShadow: '0 0 1px rgba(255,255,255,0.8)'
                                                }}
                                                title={p.fullName}
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