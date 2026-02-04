/**
 * === ASTRO CRICKET PREDICTION RULES ===
 * Refactored based on finalroulse.txt
 */

// --- Constants & Mappings ---

const signLords = {
    "Aries": "Mars", "Mesha": "Mars", "மேஷம்": "Mars",
    "Taurus": "Venus", "Vrishabha": "Venus", "ரிஷபம்": "Venus",
    "Gemini": "Mercury", "Mithuna": "Mercury", "மிதுனம்": "Mercury",
    "Cancer": "Moon", "Karka": "Moon", "கடகம்": "Moon",
    "Leo": "Sun", "Simha": "Sun", "சிம்மம்": "Sun",
    "Virgo": "Mercury", "Kanya": "Mercury", "கன்னி": "Mercury",
    "Libra": "Venus", "Tula": "Venus", "துலாம்": "Venus",
    "Scorpio": "Mars", "Vrishchika": "Mars", "விருச்சிகம்": "Mars",
    "Sagittarius": "Jupiter", "Dhanu": "Jupiter", "தனுசு": "Jupiter",
    "Capricorn": "Saturn", "Makara": "Saturn", "மகரம்": "Saturn",
    "Aquarius": "Saturn", "Kumbha": "Saturn", "கும்பம்": "Saturn",
    "Pisces": "Jupiter", "Meena": "Jupiter", "மீனம்": "Jupiter"
};

// Nakshatra to Lord Mapping
const nakshatraLords = {
    'Ashwini': 'Ketu', 'Aswini': 'Ketu', 'Magha': 'Ketu', 'Magam': 'Ketu', 'Mula': 'Ketu', 'Moola': 'Ketu',
    'Bharani': 'Venus', 'Purva Phalguni': 'Venus', 'Pooram': 'Venus', 'Purva Ashadha': 'Venus', 'Pooradam': 'Venus',
    'Krittika': 'Sun', 'Uttara Phalguni': 'Sun', 'Uthiram': 'Sun', 'Uttara Ashadha': 'Sun', 'Uthiradam': 'Sun',
    'Rohini': 'Moon', 'Hasta': 'Moon', 'Hastam': 'Moon', 'Shravana': 'Moon', 'Thiruvonam': 'Moon',
    'Mrigashira': 'Mars', 'Mrigashirsha': 'Mars', 'Chitra': 'Mars', 'Chithirai': 'Mars', 'Dhanishta': 'Mars', 'Avittam': 'Mars',
    'Ardra': 'Rahu', 'Thiruvathirai': 'Rahu', 'Thiruvadhirai': 'Rahu', 'Swati': 'Rahu', 'Shatabhisha': 'Rahu', 'Sathayam': 'Rahu',
    'Punarvasu': 'Jupiter', 'Vishakha': 'Jupiter', 'Purva Bhadrapada': 'Jupiter', 'Poorattadhi': 'Jupiter',
    'Pushya': 'Saturn', 'Pushyam': 'Saturn', 'Anuradha': 'Saturn', 'Anusham': 'Saturn', 'Uttara Bhadrapada': 'Saturn', 'Uthirattadhi': 'Saturn',
    'Ashlesha': 'Mercury', 'Ayilyam': 'Mercury', 'Jyeshtha': 'Mercury', 'Kettai': 'Mercury', 'Revati': 'Mercury'
};

// Exalted Signs (உச்சம்)
const EXALTED_SIGNS = {
    'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn',
    'Mercury': 'Virgo', 'Jupiter': 'Cancer', 'Venus': 'Pisces',
    'Saturn': 'Libra', 'Rahu': 'Taurus', 'Ketu': 'Scorpio'
};

// Debilitated Signs (நீசம்)
const DEBILITATED_SIGNS = {
    'Sun': 'Libra', 'Moon': 'Scorpio', 'Mars': 'Cancer',
    'Mercury': 'Pisces', 'Jupiter': 'Capricorn', 'Venus': 'Virgo',
    'Saturn': 'Aries', 'Rahu': 'Scorpio', 'Ketu': 'Taurus'
};

// Own Signs (ஆட்சி)
const OWN_SIGNS = {
    'Sun': ['Leo'],
    'Moon': ['Cancer'],
    'Mars': ['Aries', 'Scorpio'],
    'Mercury': ['Gemini', 'Virgo'],
    'Jupiter': ['Sagittarius', 'Pisces'],
    'Venus': ['Taurus', 'Libra'],
    'Saturn': ['Capricorn', 'Aquarius'],
    'Rahu': ['Aquarius'],
    'Ketu': ['Scorpio']
};

// --- Helper Functions ---

export const getStarLord = (starName) => {
    if (!starName) return null;
    const n = starName.toLowerCase();

    for (const [nakshatra, lord] of Object.entries(nakshatraLords)) {
        if (n.includes(nakshatra.toLowerCase())) return lord;
    }
    return null;
};

export const getSignLord = (signName) => {
    if (!signName) return null;
    return signLords[signName] || null;
};

const getPlanet = (chart, planetName) => {
    if (!chart || !chart.planets) return null;
    if (planetName === 'Ascendant' || planetName === 'Lagna' || planetName === 'Asc') {
        return chart.planets["Asc"] || chart.planets["Lagna"] || null;
    }
    return chart.planets[planetName];
};

const isExalted = (planetName, signName) => {
    return EXALTED_SIGNS[planetName] === signName;
};

const isOwnSign = (planetName, signName) => {
    return OWN_SIGNS[planetName]?.includes(signName) || false;
};

const isExaltedOrOwn = (planetName, signName) => {
    if (isExalted(planetName, signName)) return { status: 'EXALTED', tamil: 'உச்சம்' };
    if (isOwnSign(planetName, signName)) return { status: 'OWN_SIGN', tamil: 'ஆட்சி' };
    return null;
};

// Helper: Check if planet is strong (Exalted or Own)
const isStrong = (planetName, signName) => {
    return isExalted(planetName, signName) || isOwnSign(planetName, signName);
};

// Helper: Check if ANY planet in a specific house (sign) is Exalted or Own
const hasStrongPlanetInHouse = (chart, signName) => {
    if (!chart || !chart.planets) return false;
    for (const [name, data] of Object.entries(chart.planets)) {
        if (data.sign === signName) {
            if (isStrong(name, data.sign)) return true;
        }
    }
    return false;
};

// === MAIN PREDICTION ENGINE ===

export const evaluateBatsman = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    if (!playerChart || !matchChart) {
        return { score: 0, label: "No Data", report: ["Missing Chart Data"] };
    }

    // --- Extract Data ---
    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");
    const mLagna = getPlanet(matchChart, "Asc") || getPlanet(matchChart, "Lagna");

    if (!pMoon || !mMoon) {
        return { score: 0, label: "Error", report: ["Missing Moon Data"] };
    }

    // Player Data
    let playerRasiLord = getSignLord(pMoon.sign);
    let playerStarLord = getStarLord(pMoon.nakshatra);
    let playerStar = pMoon.nakshatra;

    // --- Role Based Zeroing ---
    // If player is a Bowler, Batting Score is 0
    if (playerChart.role === 'Bowler') {
        return { score: 0, label: "Flop", report: [{ en: "Player is a Bowler (Batting 0)", ta: "இவர் ஒரு பந்துவீச்சாளர்" }] };
    }

    // Match Data
    let matchStar = mMoon.nakshatra;
    let matchRasiLord = getSignLord(mMoon.sign);
    let matchStarLord = getStarLord(matchStar);


    /* RAHU / KETU STAR LORD OVERRIDES (Match) per Part 2 */
    if (matchStarLord === 'Rahu' || matchStarLord === 'Ketu') {
        matchStarLord = matchRasiLord;
        if (matchStar && (matchStar.includes('Magha') || matchStar.includes('Magam'))) {
            matchStarLord = 'Mars';
        }
        if (matchStar && (matchStar.includes('Ashwini') || matchStar.includes('Aswini'))) {
            matchStarLord = 'Mars';
        }
    }

    /* RAHU / KETU STAR LORD OVERRIDES (Player) */
    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') {
        playerStarLord = playerRasiLord;
    }

    const isRahuKetuMatchStar = (getStarLord(matchStar) === 'Rahu' || getStarLord(matchStar) === 'Ketu');

    const matchLagnaLord = getSignLord(mLagna?.sign);

    /* STATE */
    let globalNegative = false;

    const addRule = (name, pts, type = "both", isSpecial = false, nameTamil = "") => {
        score += pts;
        const ruleText = `${name} (${pts > 0 ? "+" : ""}${pts})`;
        const ruleTextTamil = nameTamil ? `${nameTamil} (${pts > 0 ? "+" : ""}${pts})` : ruleText;
        report.push({ en: ruleText, ta: ruleTextTamil });
    };

    const setSureFlop = (name, nameTamil = "") => {
        globalNegative = true;
        addRule(`${name} (SURE FLOP)`, 0, "both", true, nameTamil ? `${nameTamil} (Sure Flop)` : "");
    };

    const applyBonuses = (planet, ptsBonus = 4) => {
        const pObj = getPlanet(playerChart, planet);
        if (pObj) {
            if (isExalted(planet, pObj.sign)) {
                addRule(`${planet} Exalted Bonus`, ptsBonus, "both", false, `${planet} உச்சம்`);
            } else if (OWN_SIGNS[planet]?.includes(pObj.sign)) {
                addRule(`${planet} Own Sign Bonus`, ptsBonus, "both", false, `${planet} ஆட்சி`);
            }
        }
    };

    /* ================= GENERAL BATTING RULES ================= */

    // Rule 1: ZIG-ZAG RULE
    if (!isRahuKetuMatchStar && matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BAT Rule 1: Zig-Zag', 12, 'bat', false, 'பேட்டிங் விதி 1: ஜிக்-ஜாக்');
        applyBonuses(playerRasiLord, 4);
    }

    // Rule 2: DIRECT RULE
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BAT Rule 2: Direct', 6, 'bat', false, 'பேட்டிங் விதி 2: நேரடி விதி');
        applyBonuses(playerRasiLord, 4);
    }

    // Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BAT Rule 3: Star', 4, 'bat', false, 'பேட்டிங் விதி 3: நட்சத்திர விதி');
        applyBonuses(matchStarLord, 4);
    }

    // Rule 4: CONJUNCTION RULE
    if (areInSameSign(playerChart, matchStarLord, playerRasiLord)) {
        addRule('BAT Rule 4: Conjunction', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி');
        applyBonuses(playerRasiLord, 4);
        if (mLagna?.sign === pMoon?.sign) addRule('BAT Rule 4: Lagna Match', 2, 'bat', false, 'பேட்டிங் விதி 4: லக்ன பொருத்தம்');
    }

    // Rule 5: SAME HOUSE RULE
    if (!isRahuKetuMatchStar && OWN_SIGNS[matchStarLord]?.includes(pMoon?.sign) && OWN_SIGNS[matchStarLord]?.includes(getPlanet(playerChart, playerStarLord)?.sign)) {
        addRule('BAT Rule 5: Same House', 4, 'bat', false, 'பேட்டிங் விதி 5: ஒரே ராசி');
        if (isExalted(playerRasiLord, pMoon?.sign) || isOwnSign(playerRasiLord, pMoon?.sign)) addRule('BAT Rule 5: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 5: போனஸ்');
    }

    // Rule 6: PLAYER RASI ATHIPATHI HOME
    if (!isRahuKetuMatchStar && getPlanet(matchChart, matchRasiLord)?.sign === pMoon?.sign && getPlanet(matchChart, matchStarLord)?.sign === pMoon?.sign) {
        addRule('BAT Rule 6: Player Rasi Home', 6, 'bat', false, 'பேட்டிங் விதி 6: ராசி அதிபதி வீடு');
        applyBonuses(playerRasiLord, 4);
    }

    // Rule 7: RAHU/KETU PLAYER RULE
    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') {
        if (OWN_SIGNS[matchStarLord]?.includes(pMoon?.sign)) {
            addRule('BAT Rule 7: Rahu/Ketu Player', 4, 'bat', false, 'பேட்டிங் விதி 7: ராகு/கேது விதி');
            applyBonuses(playerRasiLord, 4);
        }
    }

    // Rule 8: LAGNA RULE (BATTING)
    if (matchLagnaLord === playerRasiLord) {
        addRule('BAT Rule 8: Lagna', 2, 'bat', false, 'பேட்டிங் விதி 8: லக்ன விதி');
        if (isExalted(playerRasiLord, pMoon?.sign) || isOwnSign(playerRasiLord, pMoon?.sign)) addRule('BAT Rule 8: Bonus', 2, 'bat', false, 'பேட்டிங் விதி 8: போனஸ்');
    }

    // Rule 9: DOUBLE LORD CONJUNCTION
    if (!isRahuKetuMatchStar) {
        const mRasiPos = getPlanet(playerChart, matchRasiLord)?.sign;
        const mStarPos = getPlanet(playerChart, matchStarLord)?.sign;
        if (mRasiPos && mStarPos && mRasiPos === mStarPos) {
            addRule('Rule 9: Double Lord Conjunction', 12, 'bat', false, 'விதி 9: இரட்டை அதிபதி சேர்க்கை');
        }
    }

    /* ================= GENERAL BOWLING RULES ================= */
    // bowling logic will be similar but with fixed points

    /* ================= MATCH STAR SPECIFIC RULES ================= */

    switch (matchStar) {
        // 1. ASWINI
        case 'Ashwini':
        case 'Aswini':
            if (isExalted('Mars', getPlanet(playerChart, 'Mars')?.sign)) addRule('Aswini: Mars Exalted', 8, 'both', false, 'அசுவினி: செவ்வாய் உச்சம்');
            else if (isDebilitated('Mars', getPlanet(playerChart, 'Mars')?.sign)) addRule('Aswini: Mars Debilitated', -12, 'both', false, 'அசுவினி: செவ்வாய் நீசம்');
            if (areInSameSign(playerChart, 'Mars', 'Venus')) addRule('Aswini: Mars + Venus Conjunction', 10, 'both', false, 'அசுவினி: செவ்வாய் + சுக்கிரன் சேர்க்கை');
            break;

        // 2. BHARANI
        case 'Bharani':
            if (areInSameSign(playerChart, 'Venus', 'Mercury')) setSureFlop('Bharani: Venus + Mercury Conjunction', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை');
            break;

        // 3. ROHINI
        case 'Rohini':
            if (isDebilitated('Moon', getPlanet(playerChart, 'Moon')?.sign)) addRule('Rohini: Moon Debilitated', 8, 'both', false, 'ரோகிணி: சந்திரன் நீசம்');
            if ((playerStar === 'Shatabhisha' || playerStar === 'Sathayam') && areInSameSign(playerChart, 'Saturn', 'Rahu')) {
                addRule('Rohini: Player Sathayam & Saturn+Rahu Conjunction', 12, 'both', true, 'ரோகிணி: சதயம் நட்சத்திரம் & சனி+ராகு சேர்க்கை');
            }
            break;        // 4. THIRUVATHIRAI (Ardra)
        case 'Ardra':
        case 'Thiruvathirai':
        case 'Thiruvadhirai':
            const marsSign = getPlanet(playerChart, 'Mars')?.sign;
            if (marsSign) {
                if (isDebilitated('Mars', marsSign)) {
                    setSureFlop('Ardra: Mars Neecham (Batting)', 'திருவாதிரை: செவ்வாய் நீசம் (பேட்டிங்)');
                } else if (isExalted('Mars', marsSign) || isOwnSign('Mars', marsSign)) {
                    addRule('Ardra: Mars Aatchi/Ucham', 0, 'bat', false, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
                } else if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') {
                    addRule('Ardra: Mars Lord', 0, 'bat', false, 'திருவாதிரை: செவ்வாய் அதிபதி');
                }
            }
            break;


        // 5. AYILYAM
        case 'Ashlesha':
        case 'Ayilyam':
            if (areInSameSign(playerChart, 'Venus', 'Mercury')) setSureFlop('Ayilyam: Venus + Mercury Conjunction', 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை');
            break;

        // 6. MAGAM
        case 'Magha':
        case 'Magam':
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') addRule('Magam: Rasi Lord Mercury & Star Lord Mars (+12) 👉 Show Special Player', 12, 'both', true, 'மகம்: ராசி அதிபதி புதன் & நட்சத்திர அதிபதி செவ்வாய் (+12) 👉 சிறப்பு வீரர்');
            break;

        // 7. POORAM
        case 'Purva Phalguni':
        case 'Pooram':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true, 'பூரம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய்');
            if (playerRasiLord === 'Jupiter' && playerStarLord === 'Mercury') addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury', 12, 'bowl', true, 'பூரம்: ராசி அதிபதி குரு & நட்சத்திர அதிபதி புதன்');
            break;

        // 8. UTHIRAM
        case 'Uttara Phalguni':
        case 'Uthiram':
            if (getPlanet(matchChart, 'Moon')?.sign === 'Virgo' || getPlanet(matchChart, 'Moon')?.sign === 'Kanya') {
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திரம் (கன்னி): ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        // 9. CHITHIRAI
        case 'Chitra':
        case 'Chithirai':
            if (getPlanet(matchChart, 'Moon')?.sign === 'Virgo' || getPlanet(matchChart, 'Moon')?.sign === 'Kanya') {
                if (playerRasiLord === 'Mercury' && areInSameSign(playerChart, 'Mercury', 'Sun')) {
                    if (areInSameSign(playerChart, 'Mercury', 'Sun', 'Venus', 'Jupiter')) addRule('Chithirai (Virgo): Merc+Sun+Ven+Jup', 12, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்+சுக்கிரன்+குரு');
                    else if (areInSameSign(playerChart, 'Mercury', 'Sun', 'Jupiter')) addRule('Chithirai (Virgo): Merc+Sun+Jup', 8, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்+குரு');
                    else addRule('Chithirai (Virgo): Merc+Sun', 6, 'both', false, 'சித்திரை (கன்னி): புதன்+சூரியன்');
                }
            } else if (getPlanet(matchChart, 'Moon')?.sign === 'Libra' || getPlanet(matchChart, 'Moon')?.sign === 'Tula') {
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn (+12) ⭐ Show SPECIAL PLAYER', 12, 'both', true, 'சித்திரை (துலாம்): ராசி அதிபதி சந்திரன் & நட்சத்திர அதிபதி சனி (+12) ⭐ சிறப்பு வீரர்');
            }
            break;

        // 10. ANUSHAM
        case 'Anuradha':
        case 'Anusham':
            if (playerRasiLord === 'Jupiter') {
                addRule('Anusham: Rasi Lord Jupiter', 5, 'both', false, 'அனுஷம்: ராசி அதிபதி குரு');
                if (isOwnSign('Jupiter', getPlanet(playerChart, 'Jupiter')?.sign) || isExalted('Jupiter', getPlanet(playerChart, 'Jupiter')?.sign)) addRule('Anusham: Jupiter Own/Exalted', 10, 'both', false, 'அனுஷம்: குரு ஆட்சி/உச்சம்');
            }
            break;

        // 11. KETTAI
        case 'Jyeshtha':
        case 'Kettai':
            if (areInSameSign(playerChart, 'Mercury', 'Venus')) addRule('Kettai: Mercury + Venus Conjunction', -12, 'both', false, 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை');
            break;

        // 12. MOOLAM
        case 'Mula':
        case 'Moolam':
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') addRule('Moolam: Rasi Lord Saturn & Star Lord Mars (Batting) (+12) 👉 Show Special Player', 12, 'bat', true, 'மூலம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய் (பேட்டிங்) (+12) 👉 சிறப்பு வீரர்');
            if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') addRule('Moolam: Rasi Lord Mars & Star Lord Saturn (Bowling) (+12) 👉 Show Special Player', 12, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் & நட்சத்திர அதிபதி சனி (பவுலிங்) (+12) 👉 சிறப்பு வீரர்');
            break;

        // 13. POORADAM
        case 'Purva Ashadha':
        case 'Pooradam':
            if (areInSameSign(playerChart, 'Venus', 'Mercury')) setSureFlop('Pooradam: Venus + Mercury Conjunction', 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை');
            break;

        // 14. UTHIRADAM
        case 'Uttara Ashadha':
        case 'Uthiradam':
            if (getPlanet(matchChart, 'Moon')?.sign === 'Capricorn' || getPlanet(matchChart, 'Moon')?.sign === 'Makara') {
                if (playerRasiLord === 'Moon') addRule('Uthiradam (Makara): Rasi Lord Moon (+12) 👉 Show Special Player', 12, 'both', true, 'உத்திராடம் (மகரம்): ராசி அதிபதி சந்திரன் (+12) 👉 சிறப்பு வீரர்');
            }
            break;

        // 15. THIRUVONAM
        case 'Shravana':
        case 'Thiruvonam':
            if (playerRasiLord === 'Mars' && getPlanet(playerChart, 'Mars')?.sign === 'Cancer') addRule('Thiruvonam: Mars in Moon House (Bowling) (+6)', 6, 'bowl', false, 'திருவோணம்: செவ்வாய் சந்திரன் வீட்டில் (பவுலிங்) (+6)');
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu (+12) 👉 Show Special Player', 12, 'both', true, 'திருவோணம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு (+12) 👉 சிறப்பு வீரர்');
            break;

        // 16. AVITTAM
        case 'Dhanishta':
        case 'Avittam':
            if ((getPlanet(matchChart, 'Moon')?.sign === 'Capricorn' || getPlanet(matchChart, 'Moon')?.sign === 'Makara') && playerRasiLord === 'Saturn') addRule('Avittam (Capricorn): Rasi Lord Saturn', 4, 'both', false, 'அவிட்டம் (மகரம்): ராசி அதிபதி சனி');
            break;

        // 17. SATHAYAM
        case 'Shatabhisha':
        case 'Sathayam':
            if (playerRasiLord === 'Moon') addRule('Sathayam: Rasi Lord Moon (+12) 👉 GAME CHANGER 👉 Must Show Special Player', 12, 'both', true, 'சதயம்: ராசி அதிபதி சந்திரன் (+12) 👉 கேம் சேஞ்சர் 👉 சிறப்பு வீரர்');
            break;
    }

    if (globalNegative) {
        score = 0;
        report.push({ en: "GLOBAL OVERRIDE: Score set to 0", ta: "உலகளாவிய மேலெழுதல்: மதிப்பெண் 0 ஆக அமைக்கப்பட்டது" });
    }

    // --- Final Verdict ---
    let label = "Flop";
    if (score >= 4) label = "Good";
    if (score >= 8) label = "Excellent";
    if (globalNegative) label = "SURE FLOP";

    return { score, label, report };
};

export const evaluateBowler = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    if (!playerChart || !matchChart) return { score: 0, label: "No Data", report: [{ en: "Missing Chart Data", ta: "ஜாதகத் தரவு இல்லை" }] };

    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");
    const mLagna = getPlanet(matchChart, "Asc") || getPlanet(matchChart, "Lagna");

    if (!pMoon || !mMoon) return { score: 0, label: "Error", report: ["Missing Moon Data"] };

    // Player Data
    let playerRasiLord = getSignLord(pMoon.sign);
    let playerStarLord = getStarLord(pMoon.nakshatra);

    // Match Data
    let matchStar = mMoon.nakshatra;
    let matchRasiLord = getSignLord(mMoon.sign);
    let matchStarLord = getStarLord(matchStar);

    // --- Role Based Zeroing ---
    // If player is a Batsman, Bowling Score is 0
    if (playerChart.role === 'Batsman' || playerChart.role === 'WK-Batsman') {
        return { score: 0, label: "Flop", report: [{ en: "Player is a Batsman (Bowling 0)", ta: "இவர் ஒரு பேட்ஸ்மேன்" }] };
    }

    /* RAHU / KETU STAR LORD OVERRIDES (Match) */
    if (matchStarLord === 'Rahu' || matchStarLord === 'Ketu') {
        matchStarLord = matchRasiLord;
        if (matchStar && (matchStar.includes('Magha') || matchStar.includes('Magam'))) matchStarLord = 'Mars';
        if (matchStar && (matchStar.includes('Ashwini') || matchStar.includes('Aswini'))) matchStarLord = 'Mars';
    }

    if (playerStarLord === 'Rahu' || playerStarLord === 'Ketu') playerStarLord = playerRasiLord;

    const isRahuKetuMatchStar = (getStarLord(matchStar) === 'Rahu' || getStarLord(matchStar) === 'Ketu');

    const matchLagnaLord = getSignLord(mLagna?.sign);

    const addRule = (name, pts, type = "both", isSpecial = false, nameTamil = "") => {
        score += pts;
        const ruleText = `${name} (${pts > 0 ? "+" : ""}${pts})`;
        const ruleTextTamil = nameTamil ? `${nameTamil} (${pts > 0 ? "+" : ""}${pts})` : ruleText;
        report.push({ en: ruleText, ta: ruleTextTamil });
    };

    let globalNegative = false;
    const setSureFlop = (name, nameTamil = "") => {
        score = 0;
        globalNegative = true;
        const ruleText = `${name} (SURE FLOP)`;
        const ruleTextTamil = nameTamil ? `${nameTamil} (Sure Flop)` : ruleText;
        report.push({ en: ruleText, ta: ruleTextTamil });
    };

    const applyBonuses = (planet, pts, type = "both") => {
        const sign = playerChart.planets?.[planet]?.sign;
        if (sign) {
            if (isExalted(planet, sign)) {
                addRule(`${planet} Exalted Bonus`, pts, type, false, `${planet} உச்சம்`);
            } else if (isOwnSign(planet, sign)) {
                addRule(`${planet} Own Sign Bonus`, pts, type, false, `${planet} ஆட்சி`);
            }
        }
    };

    /* ================= GENERAL BOWLING RULES ================= */

    /* ================= GENERAL BOWLING RULES ================= */

    // BOWL Rule 1: ZIG-ZAG
    if (!isRahuKetuMatchStar && matchRasiLord === playerStarLord && matchStarLord === playerRasiLord) {
        addRule('BOWL Rule 1: Zig-Zag', 12, 'bowl', false, 'பவுலிங் விதி 1: ஜிக்-ஜாக்');
        applyBonuses(playerRasiLord, 4);
    }

    // BOWL Rule 2: DIRECT (NEGATIVE)
    if (matchRasiLord === playerRasiLord && matchStarLord === playerStarLord) {
        addRule('BOWL Rule 2: Direct (Negative)', -12, 'bowl', false, 'பவுலிங் விதி 2: நேரடி விதி (எதிர்மறை)');
    }

    // BOWL Rule 3: STAR RULE
    if (matchStarLord === playerRasiLord || matchStarLord === playerStarLord) {
        addRule('BOWL Rule 3: Star', 3, 'bowl', false, 'பவுலிங் விதி 3: நட்சத்திர விதி');
        applyBonuses(matchStarLord, 6);
    }

    // BOWL Rule 4: CONJUNCTION
    const pRasiLordHomeSigns = OWN_SIGNS[playerRasiLord] || [];
    const mStarLordObj = getPlanet(matchChart, matchStarLord);
    if (mStarLordObj && pRasiLordHomeSigns.includes(mStarLordObj.sign)) {
        addRule('BOWL Rule 4: Conjunction', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி');
        applyBonuses(playerRasiLord, 4);
        if (mLagna && mLagna.sign === mStarLordObj.sign) addRule('BOWL Rule 4: Lagna Match', 2, 'bowl', false, 'பவுலிங் விதி 4: லக்ன பொருத்தம்');
    }

    // BOWL Rule 5: SAME HOUSE
    const mOwned = [...(OWN_SIGNS[matchRasiLord] || []), ...(OWN_SIGNS[matchStarLord] || [])];
    const pStarLordSign = getPlanet(playerChart, playerStarLord)?.sign;
    if (!isRahuKetuMatchStar && mOwned.includes(pMoon.sign) && mOwned.includes(pStarLordSign)) {
        addRule('BOWL Rule 5: Same House', 4, 'bowl', false, 'பவுலிங் விதி 5: ஒரே ராசி');
        applyBonuses(playerRasiLord, 2);
    }

    // BOWL Rule 6: PLAYER RASI HOME
    const mRasiLObj = getPlanet(matchChart, matchRasiLord);
    const mStarLObj = getPlanet(matchChart, matchStarLord);
    if (!isRahuKetuMatchStar && mRasiLObj && mStarLObj && mRasiLObj.sign === pMoon.sign && mStarLObj.sign === pMoon.sign) {
        addRule('BOWL Rule 6: Player Rasi Home', 4, 'bowl', false, 'பவுலிங் விதி 6: ராசி அதிபதி வீடு');
        applyBonuses(playerRasiLord, 2);
    }

    // BOWL Rule 7: RAHU/KETU RULE
    if (pMoon.nakLord === 'Rahu' || pMoon.nakLord === 'Ketu') {
        const mStarSigns = OWN_SIGNS[matchStarLord] || [];
        if (mStarSigns.includes(pMoon.sign)) {
            addRule('BOWL Rule 7: Rahu/Ketu', 4, 'bowl', false, 'பவுலிங் விதி 7: ராகு/கேது விதி');
            applyBonuses(playerRasiLord, 4);
        }
    }

    // BOWL Rule 8: LAGNA RULE
    if (matchLagnaLord === playerRasiLord) {
        addRule('BOWL Rule 8: Lagna', 4, 'bowl', false, 'பவுலிங் விதி 8: லக்ன விதி');
        applyBonuses(playerRasiLord, 4);
        // Exalted/Own Bonus in house
        const planetsInSign = Object.keys(playerChart.planets || {}).filter(p => playerChart.planets[p]?.sign === mLagna?.sign);
        if (planetsInSign.some(p => isExalted(p, playerChart.planets[p].sign) || OWN_SIGNS[p]?.includes(playerChart.planets[p].sign))) {
            addRule('BOWL Rule 8: Planet Bonus', 4, 'bowl', false, 'பவுலிங் விதி 8: கிரக போனஸ்');
        }
    }

    // BOWL Rule 9: MATCH SIGN LORD RULE
    if (matchRasiLord === playerRasiLord) {
        addRule('BOWL Rule 9: Match Sign Lord', 3, 'bowl', false, 'பவுலிங் விதி 9: ராசி அதிபதி விதி');
        applyBonuses(playerRasiLord, 8);
    }

    // Rule 9: DOUBLE LORD CONJUNCTION
    if (!isRahuKetuMatchStar) {
        const mRasiPos = getPlanet(playerChart, matchRasiLord)?.sign;
        const mStarPos = getPlanet(playerChart, matchStarLord)?.sign;
        if (mRasiPos && mStarPos && mRasiPos === mStarPos) {
            addRule('Rule 9: Double Lord Conjunction', 12, 'bowl', false, 'விதி 9: இரட்டை அதிபதி சேர்க்கை');
        }
    }

    // --- Nakshatra Specific Rules for Bowling ---
    switch (matchStar) {
        case 'Ardra':
        case 'Thiruvathirai':
        case 'Thiruvadhirai':
            const marsSign = getPlanet(playerChart, 'Mars')?.sign;
            if (marsSign) {
                if (isDebilitated('Mars', marsSign)) {
                    setSureFlop('Ardra: Mars Neecham', 'திருவாதிரை: செவ்வாய் நீசம்');
                } else if (isExalted('Mars', marsSign) || isOwnSign('Mars', marsSign)) {
                    addRule('Ardra: Mars Aatchi/Ucham', 10, 'bowl', true, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
                } else if (playerRasiLord === 'Mars' || playerStarLord === 'Mars') {
                    addRule('Ardra: Mars Lord', 4, 'bowl', false, 'திருவாதிரை: செவ்வாய் அதிபதி');
                }
            }
            break;
    }

    if (globalNegative) score = 0;

    // Recalculate Label
    let label = "Flop";
    if (score >= 4) label = "Good";
    if (score >= 8) label = "Excellent";
    if (globalNegative) label = "SURE FLOP";
    else if (score <= -4) label = "SURE FLOP";

    return { score, label, report };
};

// Export helper for UI
export const getNakshatraLordHelper = getStarLord;
