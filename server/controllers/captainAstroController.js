const fs = require('fs');
const path = require('path');
const CaptainMatchHistory = require('../models/CaptainMatchHistory');
const Player = require('../models/Player');
const { calculatePlanetaryPositions, calculateNakshatra } = require('../utils/astroCalculator');

const NAKSHATRA_MAP = {
    'Ashwini': { no: 1, tamil: 'அஸ்வினி', lord: 'Ketu' },
    'Bharani': { no: 2, tamil: 'பரணி', lord: 'Venus' },
    'Krittika': { no: 3, tamil: 'கார்த்திகை', lord: 'Sun' },
    'Rohini': { no: 4, tamil: 'ரோகிணி', lord: 'Moon' },
    'Mrigashirsha': { no: 5, tamil: 'மிருகசீரிஷம்', lord: 'Mars' },
    'Ardra': { no: 6, tamil: 'திருவாதிரை', lord: 'Rahu' },
    'Punarvasu': { no: 7, tamil: 'புனர்பூசம்', lord: 'Jupiter' },
    'Pushya': { no: 8, tamil: 'பூசம்', lord: 'Saturn' },
    'Ashlesha': { no: 9, tamil: 'ஆயில்யம்', lord: 'Mercury' },
    'Magha': { no: 10, tamil: 'மகம்', lord: 'Ketu' },
    'Purva Phalguni': { no: 11, tamil: 'பூரம்', lord: 'Venus' },
    'Uttara Phalguni': { no: 12, tamil: 'உத்திரம்', lord: 'Sun' },
    'Hasta': { no: 13, tamil: 'ஹஸ்தம்', lord: 'Moon' },
    'Chitra': { no: 14, tamil: 'சித்திரை', lord: 'Mars' },
    'Swati': { no: 15, tamil: 'சுவாதி', lord: 'Rahu' },
    'Vishakha': { no: 16, tamil: 'விசாகம்', lord: 'Jupiter' },
    'Anuradha': { no: 17, tamil: 'அனுஷம்', lord: 'Saturn' },
    'Jyeshtha': { no: 18, tamil: 'கேட்டை', lord: 'Mercury' },
    'Mula': { no: 19, tamil: 'மூலம்', lord: 'Ketu' },
    'Purva Ashadha': { no: 20, tamil: 'பூராடம்', lord: 'Venus' },
    'Uttara Ashadha': { no: 21, tamil: 'உத்திராடம்', lord: 'Sun' },
    'Shravana': { no: 22, tamil: 'திருவோணம்', lord: 'Moon' },
    'Dhanishta': { no: 23, tamil: 'அவிட்டம்', lord: 'Mars' },
    'Shatabhisha': { no: 24, tamil: 'சதயம்', lord: 'Rahu' },
    'Purva Bhadrapada': { no: 25, tamil: 'பூரட்டாதி', lord: 'Jupiter' },
    'Uttara Bhadrapada': { no: 26, tamil: 'உத்திரட்டாதி', lord: 'Saturn' },
    'Revati': { no: 27, tamil: 'ரேவதி', lord: 'Mercury' }
};

const TARA_INFO = {
    1: { name: 'Janma', tamil: 'ஜென்மம்', nature: 'Average / Caution (Self/Mind Strain)', score: 5 },
    2: { name: 'Sampat', tamil: 'சம்பத்து', nature: 'Highly Auspicious (Wealth / Big Success)', score: 9.5 },
    3: { name: 'Vipat', tamil: 'விபத்து', nature: 'Inauspicious (Danger / Obstacles)', score: 2 },
    4: { name: 'Kshema', tamil: 'சேமம்', nature: 'Auspicious (Protection / Steady Flow)', score: 8 },
    5: { name: 'Pratyak', tamil: 'பிரத்யக்', nature: 'Inauspicious (Opposition / Sudden Setback)', score: 3 },
    6: { name: 'Sadhana', tamil: 'சாதனை', nature: 'Supreme Auspicious (Victory / Peak Form)', score: 10 },
    7: { name: 'Naidhana', tamil: 'வதம்/நைதனம்', nature: 'Most Inauspicious (Destruction / Heavy Loss)', score: 1 },
    8: { name: 'Mitra', tamil: 'மித்ரம்', nature: 'Auspicious (Helpful Support / Good Partnership)', score: 8.5 },
    0: { name: 'Parama Mitra', tamil: 'பரம மித்ரம்', nature: 'Highly Auspicious (Supreme Fortune)', score: 9.5 }
};

// Comprehensive Global Venues Database
const GLOBAL_VENUES = {
    // India
    'M Chinnaswamy Stadium, Bengaluru, India': { lat: 12.9788, lng: 77.5996, tz: 5.5, country: 'India' },
    'Wankhede Stadium, Mumbai, India': { lat: 18.9389, lng: 72.8258, tz: 5.5, country: 'India' },
    'Brabourne Stadium, Mumbai, India': { lat: 18.9322, lng: 72.8242, tz: 5.5, country: 'India' },
    'DY Patil Stadium, Navi Mumbai, India': { lat: 19.0330, lng: 73.0297, tz: 5.5, country: 'India' },
    'Eden Gardens, Kolkata, India': { lat: 22.5646, lng: 88.3433, tz: 5.5, country: 'India' },
    'MA Chidambaram Stadium (Chepauk), Chennai, India': { lat: 13.0628, lng: 80.2793, tz: 5.5, country: 'India' },
    'Arun Jaitley Stadium, Delhi, India': { lat: 28.6379, lng: 77.2425, tz: 5.5, country: 'India' },
    'Narendra Modi Stadium, Ahmedabad, India': { lat: 23.0917, lng: 72.5975, tz: 5.5, country: 'India' },
    'Rajiv Gandhi International Stadium, Hyderabad, India': { lat: 17.4065, lng: 78.5505, tz: 5.5, country: 'India' },
    'Ekana International Cricket Stadium, Lucknow, India': { lat: 26.8105, lng: 81.0146, tz: 5.5, country: 'India' },
    'Sawai Mansingh Stadium, Jaipur, India': { lat: 26.8940, lng: 75.8032, tz: 5.5, country: 'India' },
    'HPCA Stadium, Dharamsala, India': { lat: 32.1976, lng: 76.3258, tz: 5.5, country: 'India' },
    'MYS International Cricket Stadium, Mullanpur, India': { lat: 30.7850, lng: 76.7320, tz: 5.5, country: 'India' },
    'PCA IS Bindra Stadium, Mohali, India': { lat: 30.6908, lng: 76.7374, tz: 5.5, country: 'India' },
    'Barsapara Cricket Stadium, Guwahati, India': { lat: 26.1428, lng: 91.7348, tz: 5.5, country: 'India' },
    'Shaheed Veer Narayan Singh Stadium (SVNS), Raipur, India': { lat: 21.1804, lng: 81.7942, tz: 5.5, country: 'India' },
    'Maharashtra Cricket Association Stadium, Pune, India': { lat: 18.6744, lng: 73.7064, tz: 5.5, country: 'India' },
    'Holkar Cricket Stadium, Indore, India': { lat: 22.7244, lng: 75.8778, tz: 5.5, country: 'India' },
    'Saurashtra Cricket Association Stadium, Rajkot, India': { lat: 22.3639, lng: 70.7061, tz: 5.5, country: 'India' },
    'Dr. Y.S. Rajasekhara Reddy ACA-VDCA Stadium, Visakhapatnam, India': { lat: 17.7974, lng: 83.3533, tz: 5.5, country: 'India' },
    'JSCA International Stadium Complex, Ranchi, India': { lat: 23.3134, lng: 85.2764, tz: 5.5, country: 'India' },
    'Greenfield International Stadium, Thiruvananthapuram, India': { lat: 8.5686, lng: 76.8839, tz: 5.5, country: 'India' },
    'Barabati Stadium, Cuttack, India': { lat: 20.4812, lng: 85.8687, tz: 5.5, country: 'India' },

    // Australia
    'Melbourne Cricket Ground (MCG), Melbourne, Australia': { lat: -37.8199, lng: 144.9834, tz: 10, country: 'Australia' },
    'Sydney Cricket Ground (SCG), Sydney, Australia': { lat: -33.8915, lng: 151.2248, tz: 10, country: 'Australia' },
    'Adelaide Oval, Adelaide, Australia': { lat: -34.9155, lng: 138.5961, tz: 9.5, country: 'Australia' },
    'The Gabba, Brisbane, Australia': { lat: -27.4858, lng: 153.0381, tz: 10, country: 'Australia' },
    'Perth Stadium (Optus Stadium), Perth, Australia': { lat: -31.9512, lng: 115.8890, tz: 8, country: 'Australia' },
    'WACA Ground, Perth, Australia': { lat: -31.9598, lng: 115.8797, tz: 8, country: 'Australia' },
    'Bellerive Oval (Blundstone Arena), Hobart, Australia': { lat: -42.8774, lng: 147.3735, tz: 10, country: 'Australia' },
    'Manuka Oval, Canberra, Australia': { lat: -35.3181, lng: 149.1345, tz: 10, country: 'Australia' },

    // England & UK
    "Lord's Cricket Ground, London, England": { lat: 51.5299, lng: -0.1727, tz: 1, country: 'England' },
    'The Oval (Kia Oval), London, England': { lat: 51.4837, lng: -0.1150, tz: 1, country: 'England' },
    'Edgbaston Cricket Ground, Birmingham, England': { lat: 52.4557, lng: -1.9027, tz: 1, country: 'England' },
    'Headingley Cricket Ground, Leeds, England': { lat: 53.8177, lng: -1.5822, tz: 1, country: 'England' },
    'Old Trafford Cricket Ground, Manchester, England': { lat: 53.4566, lng: -2.2872, tz: 1, country: 'England' },
    'Trent Bridge, Nottingham, England': { lat: 52.9369, lng: -1.1322, tz: 1, country: 'England' },
    'Sophia Gardens, Cardiff, Wales': { lat: 51.4883, lng: -3.1894, tz: 1, country: 'Wales' },
    'The Rose Bowl (Ageas Bowl), Southampton, England': { lat: 50.9242, lng: -1.3223, tz: 1, country: 'England' },
    'Riverside Ground, Chester-le-Street, England': { lat: 54.8488, lng: -1.5348, tz: 1, country: 'England' },

    // South Africa
    "Wanderers Stadium, Johannesburg, South Africa": { lat: -26.1317, lng: 28.0577, tz: 2, country: 'South Africa' },
    'Newlands Cricket Ground, Cape Town, South Africa': { lat: -33.9704, lng: 18.4682, tz: 2, country: 'South Africa' },
    'Kingsmead Cricket Ground, Durban, South Africa': { lat: -29.8510, lng: 31.0298, tz: 2, country: 'South Africa' },
    'SuperSport Park, Centurion, South Africa': { lat: -25.8596, lng: 28.1994, tz: 2, country: 'South Africa' },
    "St George's Park, Gqeberha (Port Elizabeth), South Africa": { lat: -33.9664, lng: 25.6067, tz: 2, country: 'South Africa' },
    'Mangaung Oval, Bloemfontein, South Africa': { lat: -29.1129, lng: 26.2044, tz: 2, country: 'South Africa' },

    // New Zealand
    'Eden Park, Auckland, New Zealand': { lat: -36.8749, lng: 174.7444, tz: 12, country: 'New Zealand' },
    'Basin Reserve, Wellington, New Zealand': { lat: -41.3005, lng: 174.7797, tz: 12, country: 'New Zealand' },
    'Hagley Oval, Christchurch, New Zealand': { lat: -43.5350, lng: 172.6190, tz: 12, country: 'New Zealand' },
    'Seddon Park, Hamilton, New Zealand': { lat: -37.7882, lng: 175.2750, tz: 12, country: 'New Zealand' },
    'Sky Stadium, Wellington, New Zealand': { lat: -41.2729, lng: 174.7860, tz: 12, country: 'New Zealand' },

    // UAE
    'Dubai International Cricket Stadium, Dubai, UAE': { lat: 25.0448, lng: 55.2198, tz: 4, country: 'UAE' },
    'Sharjah Cricket Stadium, Sharjah, UAE': { lat: 25.3289, lng: 55.4208, tz: 4, country: 'UAE' },
    'Sheikh Zayed Cricket Stadium, Abu Dhabi, UAE': { lat: 24.3644, lng: 54.5475, tz: 4, country: 'UAE' },

    // Sri Lanka
    'R. Premadasa International Cricket Stadium, Colombo, Sri Lanka': { lat: 6.9405, lng: 79.8719, tz: 5.5, country: 'Sri Lanka' },
    'Sinhalese Sports Club (SSC) Ground, Colombo, Sri Lanka': { lat: 6.9069, lng: 79.8706, tz: 5.5, country: 'Sri Lanka' },
    'Pallekele International Cricket Stadium, Kandy, Sri Lanka': { lat: 7.2800, lng: 80.7225, tz: 5.5, country: 'Sri Lanka' },
    'Galle International Stadium, Galle, Sri Lanka': { lat: 6.0317, lng: 80.2167, tz: 5.5, country: 'Sri Lanka' },
    'Rangiri Dambulla International Stadium, Dambulla, Sri Lanka': { lat: 7.8633, lng: 80.6517, tz: 5.5, country: 'Sri Lanka' },

    // West Indies
    'Kensington Oval, Bridgetown, Barbados': { lat: 13.1039, lng: -59.6231, tz: -4, country: 'West Indies' },
    'Sabina Park, Kingston, Jamaica': { lat: 17.9792, lng: -76.7825, tz: -5, country: 'West Indies' },
    "Queen's Park Oval, Port of Spain, Trinidad and Tobago": { lat: 10.6692, lng: -61.5244, tz: -4, country: 'West Indies' },
    'Providence Stadium, Georgetown, Guyana': { lat: 6.7583, lng: -58.1817, tz: -4, country: 'West Indies' },
    'Sir Vivian Richards Stadium, North Sound, Antigua': { lat: 17.1022, lng: -61.7836, tz: -4, country: 'West Indies' },
    'Daren Sammy Cricket Ground, Gros Islet, Saint Lucia': { lat: 14.0722, lng: -60.9497, tz: -4, country: 'West Indies' },
    'Warner Park Sporting Complex, Basseterre, Saint Kitts': { lat: 17.2981, lng: -62.7222, tz: -4, country: 'West Indies' },

    // Pakistan
    'Gaddafi Stadium, Lahore, Pakistan': { lat: 31.5133, lng: 74.3339, tz: 5, country: 'Pakistan' },
    'National Stadium, Karachi, Pakistan': { lat: 24.8936, lng: 67.0792, tz: 5, country: 'Pakistan' },
    'Rawalpindi Cricket Stadium, Rawalpindi, Pakistan': { lat: 33.6494, lng: 73.0767, tz: 5, country: 'Pakistan' },
    'Multan Cricket Stadium, Multan, Pakistan': { lat: 30.1583, lng: 71.4983, tz: 5, country: 'Pakistan' },

    // Bangladesh
    'Sher-e-Bangla National Cricket Stadium, Mirpur, Dhaka, Bangladesh': { lat: 23.8069, lng: 90.3636, tz: 6, country: 'Bangladesh' },
    'Zahur Ahmed Chowdhury Stadium, Chattogram, Bangladesh': { lat: 22.3606, lng: 91.7708, tz: 6, country: 'Bangladesh' },
    'Sylhet International Cricket Stadium, Sylhet, Bangladesh': { lat: 24.9192, lng: 91.8656, tz: 6, country: 'Bangladesh' },

    // USA
    'Grand Prairie Stadium, Dallas, Texas, USA': { lat: 32.7719, lng: -96.9692, tz: -5, country: 'USA' },
    'Central Broward Regional Park, Lauderhill, Florida, USA': { lat: 26.1367, lng: -80.2014, tz: -4, country: 'USA' },
    'Nassau County International Cricket Stadium, New York, USA': { lat: 40.7300, lng: -73.5700, tz: -4, country: 'USA' }
};

const SIGNS_MAP = [
    { id: 1, name: 'Aries', tamil: 'மேஷம்', lord: 'Mars', lordTamil: 'செவ்வாய்' },
    { id: 2, name: 'Taurus', tamil: 'ரிஷபம்', lord: 'Venus', lordTamil: 'சுக்கிரன்' },
    { id: 3, name: 'Gemini', tamil: 'மிதுனம்', lord: 'Mercury', lordTamil: 'புதன்' },
    { id: 4, name: 'Cancer', tamil: 'கடகம்', lord: 'Moon', lordTamil: 'சந்திரன்' },
    { id: 5, name: 'Leo', tamil: 'சிம்மம்', lord: 'Sun', lordTamil: 'சூரியன்' },
    { id: 6, name: 'Virgo', tamil: 'கன்னி', lord: 'Mercury', lordTamil: 'புதன்' },
    { id: 7, name: 'Libra', tamil: 'துலாம்', lord: 'Venus', lordTamil: 'சுக்கிரன்' },
    { id: 8, name: 'Scorpio', tamil: 'விருச்சிகம்', lord: 'Mars', lordTamil: 'செவ்வாய்' },
    { id: 9, name: 'Sagittarius', tamil: 'தனுசு', lord: 'Jupiter', lordTamil: 'குரு' },
    { id: 10, name: 'Capricorn', tamil: 'மகரம்', lord: 'Saturn', lordTamil: 'சனி' },
    { id: 11, name: 'Aquarius', tamil: 'கும்பம்', lord: 'Saturn', lordTamil: 'சனி' },
    { id: 12, name: 'Pisces', tamil: 'மீனம்', lord: 'Jupiter', lordTamil: 'குரு' }
];

const PLANET_TAMIL = {
    'Sun': 'சூரியன்',
    'Moon': 'சந்திரன்',
    'Mars': 'செவ்வாய்',
    'Mercury': 'புதன்',
    'Jupiter': 'குரு',
    'Venus': 'சுக்கிரன்',
    'Saturn': 'சனி',
    'Rahu': 'ராகு',
    'Ketu': 'கேது'
};

function getRasiFromStarAndPada(starNo, pada = 1) {
    const padaAbsolute = (starNo - 1) * 4 + (pada - 1);
    const signIndex = Math.floor(padaAbsolute / 9) % 12;
    return SIGNS_MAP[signIndex] || SIGNS_MAP[0];
}

function calculateTaraCount(captainStarNo, matchStarNo) {
    let diff = (matchStarNo - captainStarNo) % 27;
    if (diff < 0) diff += 27;
    const distance = diff + 1; // 1 to 27
    const taraIndex = distance % 9;
    const tara = TARA_INFO[taraIndex];
    return {
        distance,
        taraIndex,
        taraName: tara.name,
        taraTamil: tara.tamil,
        nature: tara.nature,
        score: tara.score
    };
}

// Dynamically resolve player birth nakshatra, rasi, and planetary lords
async function resolveCaptainInfo(captainInput, fallbackStar = '') {
    // If passed a full object
    if (typeof captainInput === 'object' && captainInput !== null) {
        if (captainInput.birthChart?.planets?.Moon?.nakshatra) {
            const nakName = captainInput.birthChart.planets.Moon.nakshatra;
            const starMap = NAKSHATRA_MAP[nakName] || { no: 1, tamil: nakName, lord: 'Ketu' };
            const pada = captainInput.birthChart.planets.Moon.pada || 1;
            const moonLong = captainInput.birthChart.planets.Moon.longitude;
            let rasiInfo;
            if (typeof moonLong === 'number') {
                const sIdx = Math.floor(((moonLong % 360) + 360) % 360 / 30);
                rasiInfo = SIGNS_MAP[sIdx] || getRasiFromStarAndPada(starMap.no, pada);
            } else {
                rasiInfo = getRasiFromStarAndPada(starMap.no, pada);
            }
            return {
                name: captainInput.name,
                playerId: captainInput._id || captainInput.id,
                nakshatra: nakName,
                starNo: starMap.no,
                tamil: captainInput.birthChart.planets.Moon.nakshatraTamil || starMap.tamil,
                pada: pada,
                starLord: starMap.lord,
                starLordTamil: PLANET_TAMIL[starMap.lord] || starMap.lord,
                rasi: rasiInfo.name,
                rasiTamil: rasiInfo.tamil,
                rasiLord: rasiInfo.lord,
                rasiLordTamil: rasiInfo.lordTamil
            };
        }
        if (captainInput.dob) {
            return calculatePlayerNakshatraFromDOB(captainInput);
        }
    }

    // If string name or ID
    if (typeof captainInput === 'string' && captainInput.trim()) {
        const nameOrId = captainInput.trim();
        let player = null;

        // Try MongoDB find by ID or name
        try {
            if (/^[0-9a-fA-F]{24}$/.test(nameOrId)) {
                player = await Player.findById(nameOrId);
            }
            if (!player) {
                player = await Player.findOne({ name: new RegExp(`^${nameOrId}$`, 'i') });
            }
            if (!player) {
                player = await Player.findOne({ name: new RegExp(nameOrId.split(' ')[0], 'i') });
            }
        } catch (e) {
            console.error('Player DB lookup error:', e);
        }

        if (player) {
            if (player.birthChart?.planets?.Moon?.nakshatra) {
                const nakName = player.birthChart.planets.Moon.nakshatra;
                const starMap = NAKSHATRA_MAP[nakName] || { no: 1, tamil: nakName, lord: 'Ketu' };
                const pada = player.birthChart.planets.Moon.pada || 1;
                const moonLong = player.birthChart.planets.Moon.longitude;
                let rasiInfo;
                if (typeof moonLong === 'number') {
                    const sIdx = Math.floor(((moonLong % 360) + 360) % 360 / 30);
                    rasiInfo = SIGNS_MAP[sIdx] || getRasiFromStarAndPada(starMap.no, pada);
                } else {
                    rasiInfo = getRasiFromStarAndPada(starMap.no, pada);
                }
                return {
                    name: player.name,
                    playerId: player._id.toString(),
                    nakshatra: nakName,
                    starNo: starMap.no,
                    tamil: player.birthChart.planets.Moon.nakshatraTamil || starMap.tamil,
                    pada: pada,
                    starLord: starMap.lord,
                    starLordTamil: PLANET_TAMIL[starMap.lord] || starMap.lord,
                    rasi: rasiInfo.name,
                    rasiTamil: rasiInfo.tamil,
                    rasiLord: rasiInfo.lord,
                    rasiLordTamil: rasiInfo.lordTamil
                };
            }
            if (player.dob) {
                return calculatePlayerNakshatraFromDOB(player);
            }
        }
    }

    // Fallback if specific star provided
    if (fallbackStar && NAKSHATRA_MAP[fallbackStar]) {
        const starMap = NAKSHATRA_MAP[fallbackStar];
        const rasiInfo = getRasiFromStarAndPada(starMap.no, 1);
        return {
            name: typeof captainInput === 'string' ? captainInput : 'Captain',
            nakshatra: fallbackStar,
            starNo: starMap.no,
            tamil: starMap.tamil,
            pada: 1,
            starLord: starMap.lord,
            starLordTamil: PLANET_TAMIL[starMap.lord] || starMap.lord,
            rasi: rasiInfo.name,
            rasiTamil: rasiInfo.tamil,
            rasiLord: rasiInfo.lord,
            rasiLordTamil: rasiInfo.lordTamil
        };
    }

    const defaultRasi = getRasiFromStarAndPada(1, 1);
    return {
        name: typeof captainInput === 'string' ? captainInput : 'Captain',
        nakshatra: 'Ashwini',
        starNo: 1,
        tamil: 'அஸ்வினி',
        pada: 1,
        starLord: 'Ketu',
        starLordTamil: 'கேது',
        rasi: defaultRasi.name,
        rasiTamil: defaultRasi.tamil,
        rasiLord: defaultRasi.lord,
        rasiLordTamil: defaultRasi.lordTamil
    };
}

function calculatePlayerNakshatraFromDOB(player) {
    try {
        let dobStr = player.dob;
        let d = new Date(dobStr);
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let day = d.getDate();

        let hour = 12;
        let minute = 0;
        if (player.birthTime) {
            const parts = player.birthTime.replace(/AM|PM/i, '').trim().split(':');
            if (parts.length >= 2) {
                hour = parseInt(parts[0], 10);
                minute = parseInt(parts[1], 10);
                if (/PM/i.test(player.birthTime) && hour < 12) hour += 12;
                if (/AM/i.test(player.birthTime) && hour === 12) hour = 0;
            }
        }

        const lat = player.latitude || 20.5937;
        const lng = player.longitude || 78.9629;
        const tz = player.timezone ? parseFloat(player.timezone) : 5.5;

        const astro = calculatePlanetaryPositions(year, month, day, hour, minute, lat, lng, tz, 'Lahiri');
        const moonLong = astro.planets.Moon;
        const sIdx = Math.floor(((moonLong % 360) + 360) % 360 / 30);
        const rasiInfo = SIGNS_MAP[sIdx] || SIGNS_MAP[0];
        const nak = calculateNakshatra(moonLong);
        const starMap = NAKSHATRA_MAP[nak.name] || { no: 1, tamil: nak.tamil, lord: 'Ketu' };

        return {
            name: player.name,
            playerId: player._id ? player._id.toString() : (player.id || ''),
            nakshatra: nak.name,
            starNo: starMap.no,
            tamil: nak.tamil,
            pada: nak.pada || 1,
            starLord: starMap.lord,
            starLordTamil: PLANET_TAMIL[starMap.lord] || starMap.lord,
            rasi: rasiInfo.name,
            rasiTamil: rasiInfo.tamil,
            rasiLord: rasiInfo.lord,
            rasiLordTamil: rasiInfo.lordTamil
        };
    } catch (e) {
        console.error('Error calculating player nakshatra from DOB:', e);
        const defaultRasi = getRasiFromStarAndPada(1, 1);
        return {
            name: player.name || 'Captain',
            playerId: player._id ? player._id.toString() : '',
            nakshatra: 'Ashwini',
            starNo: 1,
            tamil: 'அஸ்வினி',
            pada: 1,
            starLord: 'Ketu',
            starLordTamil: 'கேது',
            rasi: defaultRasi.name,
            rasiTamil: defaultRasi.tamil,
            rasiLord: defaultRasi.lord,
            rasiLordTamil: defaultRasi.lordTamil
        };
    }
}

exports.calculateMatchAstro = async (req, res) => {
    try {
        const { date, time = '19:30', venue = '', lat, lng, timezone, team1, team1Captain, team2, team2Captain } = req.body;

        if (!date) {
            return res.status(400).json({ success: false, msg: 'Match date is required' });
        }

        // Parse Date & Time
        let d = new Date(date);
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let day = d.getDate();
        let hour = 19;
        let minute = 30;

        if (time) {
            const timeClean = time.trim();
            if (timeClean.includes(':')) {
                const parts = timeClean.replace(/AM|PM/i, '').trim().split(':');
                hour = parseInt(parts[0], 10);
                minute = parseInt(parts[1], 10);
                if (/PM/i.test(timeClean) && hour < 12) hour += 12;
                if (/AM/i.test(timeClean) && hour === 12) hour = 0;
            }
        }

        let venueCoords = { lat: lat || 20.5937, lng: lng || 78.9629, tz: timezone || 5.5 };
        if (venue && GLOBAL_VENUES[venue]) {
            venueCoords = GLOBAL_VENUES[venue];
        }

        // Calculate Planetary Moon position
        const astroRes = calculatePlanetaryPositions(year, month, day, hour, minute, venueCoords.lat, venueCoords.lng, venueCoords.tz || 5.5, 'Lahiri');
        const matchMoonPos = astroRes.planets.Moon;
        const matchNak = calculateNakshatra(matchMoonPos);
        const matchStarNo = NAKSHATRA_MAP[matchNak.name] ? NAKSHATRA_MAP[matchNak.name].no : 1;

        // Resolve Captain 1
        const t1Info = await resolveCaptainInfo(team1Captain);
        const t1Tara = calculateTaraCount(t1Info.starNo, matchStarNo);

        // Resolve Captain 2
        const t2Info = await resolveCaptainInfo(team2Captain);
        const t2Tara = calculateTaraCount(t2Info.starNo, matchStarNo);

        // Determine Advantage
        let advantage = 'Balanced / Competitive';
        let advantageScore = t1Tara.score - t2Tara.score;
        let favoredTeam = null;

        const t1DisplayName = typeof team1Captain === 'object' ? team1Captain.name : (team1Captain || 'Captain 1');
        const t2DisplayName = typeof team2Captain === 'object' ? team2Captain.name : (team2Captain || 'Captain 2');

        if (advantageScore >= 2) {
            advantage = `${team1 || 'Team 1'} (${t1DisplayName}) Strong Advantage [${t1Tara.taraName} vs ${t2Tara.taraName}]`;
            favoredTeam = team1;
        } else if (advantageScore <= -2) {
            advantage = `${team2 || 'Team 2'} (${t2DisplayName}) Strong Advantage [${t2Tara.taraName} vs ${t1Tara.taraName}]`;
            favoredTeam = team2;
        } else if (advantageScore > 0) {
            advantage = `${team1 || 'Team 1'} Slight Edge [${t1Tara.taraName} vs ${t2Tara.taraName}]`;
            favoredTeam = team1;
        } else if (advantageScore < 0) {
            advantage = `${team2 || 'Team 2'} Slight Edge [${t2Tara.taraName} vs ${t1Tara.taraName}]`;
            favoredTeam = team2;
        }

        // Calculate Moon Sign / Rasi
        const matchMoonLong = typeof matchMoonPos === 'number' ? matchMoonPos : (matchMoonPos.longitude || 0);
        const matchSignIdx = Math.floor(((matchMoonLong % 360) + 360) % 360 / 30);
        const matchSign = SIGNS_MAP[matchSignIdx] || SIGNS_MAP[0];
        const matchStarLord = NAKSHATRA_MAP[matchNak.name] ? NAKSHATRA_MAP[matchNak.name].lord : 'Mercury';

        return res.json({
            success: true,
            data: {
                date,
                time,
                venue,
                venueCoordinates: venueCoords,
                matchMoon: {
                    longitude: matchMoonLong,
                    sign: matchSign.name,
                    rasi: matchSign.name,
                    rasiTamil: matchSign.tamil,
                    rasiLord: matchSign.lord,
                    rasiLordTamil: matchSign.lordTamil,
                    nakshatra: matchNak.name,
                    nakshatraTamil: matchNak.tamil,
                    pada: matchNak.pada,
                    starNo: matchStarNo,
                    lord: matchStarLord,
                    starLord: matchStarLord,
                    starLordTamil: PLANET_TAMIL[matchStarLord] || matchStarLord
                },
                team1: {
                    name: team1,
                    captain: {
                        name: t1Info.name,
                        playerId: t1Info.playerId,
                        nakshatra: t1Info.nakshatra,
                        nakshatraTamil: t1Info.tamil,
                        starNo: t1Info.starNo,
                        pada: t1Info.pada,
                        starLord: t1Info.starLord,
                        starLordTamil: t1Info.starLordTamil,
                        rasi: t1Info.rasi,
                        rasiTamil: t1Info.rasiTamil,
                        rasiLord: t1Info.rasiLord,
                        rasiLordTamil: t1Info.rasiLordTamil,
                        distance: t1Tara.distance,
                        taraIndex: t1Tara.taraIndex,
                        taraName: t1Tara.taraName,
                        taraTamil: t1Tara.taraTamil,
                        nature: t1Tara.nature,
                        score: t1Tara.score
                    }
                },
                team2: {
                    name: team2,
                    captain: {
                        name: t2Info.name,
                        playerId: t2Info.playerId,
                        nakshatra: t2Info.nakshatra,
                        nakshatraTamil: t2Info.tamil,
                        starNo: t2Info.starNo,
                        pada: t2Info.pada,
                        starLord: t2Info.starLord,
                        starLordTamil: t2Info.starLordTamil,
                        rasi: t2Info.rasi,
                        rasiTamil: t2Info.rasiTamil,
                        rasiLord: t2Info.rasiLord,
                        rasiLordTamil: t2Info.rasiLordTamil,
                        distance: t2Tara.distance,
                        taraIndex: t2Tara.taraIndex,
                        taraName: t2Tara.taraName,
                        taraTamil: t2Tara.taraTamil,
                        nature: t2Tara.nature,
                        score: t2Tara.score
                    }
                },
                advantage,
                advantageScore,
                favoredTeam
            }
        });
    } catch (err) {
        console.error('Error calculating match astro:', err);
        return res.status(500).json({ success: false, msg: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { nakshatra, captain, search, tara, limit = 100 } = req.query;
        const query = {};

        if (nakshatra && nakshatra !== 'all') {
            query['matchMoon.nakshatra'] = new RegExp(nakshatra, 'i');
        }

        if (captain) {
            query.$or = [
                { 'team1.captain.name': new RegExp(captain, 'i') },
                { 'team2.captain.name': new RegExp(captain, 'i') }
            ];
        }

        if (tara) {
            query.$or = [
                { 'team1.captain.taraName': new RegExp(tara, 'i') },
                { 'team2.captain.taraName': new RegExp(tara, 'i') }
            ];
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { 'team1.name': regex },
                { 'team2.name': regex },
                { 'team1.captain.name': regex },
                { 'team2.captain.name': regex },
                { venue: regex },
                { 'matchMoon.nakshatra': regex },
                { winner: regex }
            ];
        }

        const matches = await CaptainMatchHistory.find(query).sort({ matchNo: 1, date: -1 }).limit(parseInt(limit, 10));
        const total = await CaptainMatchHistory.countDocuments(query);

        return res.json({
            success: true,
            total,
            matches
        });
    } catch (err) {
        console.error('Error fetching captain match history:', err);
        return res.status(500).json({ success: false, msg: err.message });
    }
};

exports.saveMatch = async (req, res) => {
    try {
        const matchData = req.body;
        let match;

        if (matchData._id) {
            match = await CaptainMatchHistory.findByIdAndUpdate(matchData._id, matchData, { new: true });
        } else {
            match = new CaptainMatchHistory(matchData);
            await match.save();
        }

        return res.json({ success: true, match });
    } catch (err) {
        console.error('Error saving match history:', err);
        return res.status(500).json({ success: false, msg: err.message });
    }
};

exports.deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        await CaptainMatchHistory.findByIdAndDelete(id);
        return res.json({ success: true, msg: 'Match record deleted' });
    } catch (err) {
        return res.status(500).json({ success: false, msg: err.message });
    }
};

exports.seedIPLMatches = async (req, res) => {
    try {
        const jsonPath = path.join(__dirname, '../ipl_matches_astrology.json');
        if (!fs.existsSync(jsonPath)) {
            return res.status(404).json({ success: false, msg: 'ipl_matches_astrology.json not found' });
        }

        const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`Seeding ${rawData.length} IPL matches into CaptainMatchHistory...`);

        // Clear existing
        await CaptainMatchHistory.deleteMany({});

        const KNOWN_CAPTAINS = {
            'Rajat Patidar': { nakshatra: 'Chitra', starNo: 14, tamil: 'சித்திரை' },
            'Pat Cummins': { nakshatra: 'Jyeshtha', starNo: 18, tamil: 'கேட்டை' },
            'Hardik Pandya': { nakshatra: 'Magha', starNo: 10, tamil: 'மகம்' },
            'Ajinkya Rahane': { nakshatra: 'Shatabhisha', starNo: 24, tamil: 'சதயம்' },
            'Riyan Parag': { nakshatra: 'Purva Phalguni', starNo: 11, tamil: 'பூரம்' },
            'Ruturaj Gaikwad': { nakshatra: 'Swati', starNo: 15, tamil: 'சுவாதி' },
            'Shreyas Iyer': { nakshatra: 'Uttara Ashadha', starNo: 21, tamil: 'உத்திராடம்' },
            'Shubman Gill': { nakshatra: 'Magha', starNo: 10, tamil: 'மகம்' },
            'Rishabh Pant': { nakshatra: 'Swati', starNo: 15, tamil: 'சுவாதி' },
            'Axar Patel': { nakshatra: 'Ashwini', starNo: 1, tamil: 'அஸ்வினி' }
        };

        const docs = rawData.map(m => {
            const matchNakClean = m.matchNakshatra.replace(/\s*\([^)]*\)/, '').trim();
            const starMap = NAKSHATRA_MAP[matchNakClean] || { no: 1, tamil: '' };

            const t1CapInfo = KNOWN_CAPTAINS[m.team1Cap] || { nakshatra: m.t1Nakshatra, starNo: 1, tamil: '' };
            const t2CapInfo = KNOWN_CAPTAINS[m.team2Cap] || { nakshatra: m.t2Nakshatra, starNo: 1, tamil: '' };

            const t1Tara = calculateTaraCount(t1CapInfo.starNo, starMap.no);
            const t2Tara = calculateTaraCount(t2CapInfo.starNo, starMap.no);

            return {
                matchNo: m.matchNo,
                matchTitle: `${m.team1} vs ${m.team2}`,
                date: m.date,
                time: '19:30',
                venue: m.venue,
                matchMoon: {
                    nakshatra: matchNakClean,
                    nakshatraTamil: starMap.tamil,
                    pada: m.matchPada || 1,
                    starNo: starMap.no
                },
                team1: {
                    name: m.team1,
                    captain: {
                        name: m.team1Cap,
                        nakshatra: t1CapInfo.nakshatra,
                        nakshatraTamil: t1CapInfo.tamil,
                        starNo: t1CapInfo.starNo,
                        distance: m.t1Distance,
                        taraIndex: t1Tara.taraIndex,
                        taraName: t1Tara.taraName,
                        taraTamil: t1Tara.taraTamil,
                        nature: t1Tara.nature,
                        score: t1Tara.score
                    }
                },
                team2: {
                    name: m.team2,
                    captain: {
                        name: m.team2Cap,
                        nakshatra: t2CapInfo.nakshatra,
                        nakshatraTamil: t2CapInfo.tamil,
                        starNo: t2CapInfo.starNo,
                        distance: m.t2Distance,
                        taraIndex: t2Tara.taraIndex,
                        taraName: t2Tara.taraName,
                        taraTamil: t2Tara.taraTamil,
                        nature: t2Tara.nature,
                        score: t2Tara.score
                    }
                },
                astroAdvantage: m.advantage,
                winner: m.winner,
                isCompleted: m.winner && !m.winner.includes('TBD') ? true : false
            };
        });

        await CaptainMatchHistory.insertMany(docs);

        return res.json({
            success: true,
            msg: `Successfully seeded ${docs.length} IPL matches into historical database!`,
            count: docs.length
        });
    } catch (err) {
        console.error('Error seeding IPL matches:', err);
        return res.status(500).json({ success: false, msg: err.message });
    }
};

exports.getNakshatrasList = (req, res) => {
    return res.json({
        success: true,
        nakshatras: Object.entries(NAKSHATRA_MAP).map(([name, data]) => ({
            name,
            no: data.no,
            tamil: data.tamil,
            lord: data.lord
        })),
        venues: Object.entries(GLOBAL_VENUES).map(([venueName, info]) => ({
            name: venueName,
            country: info.country,
            lat: info.lat,
            lng: info.lng,
            tz: info.tz
        }))
    });
};
