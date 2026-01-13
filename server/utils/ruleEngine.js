const {
    SIGNS,
    PLANET_INFO,
    calculateSign,
    calculateNakshatra,
    calculateDignity,
    calculatePlanetaryPositions
} = require("./astroCalculator");

/* ------------------ HELPERS ------------------ */

const getPlanetPosition = (planet, chart) => {
    const lng = chart.planets[planet];
    if (lng === undefined) return null;
    const sign = calculateSign(lng);
    const nak = calculateNakshatra(lng);
    return {
        name: planet,
        longitude: lng,
        signId: sign.id,
        signLord: sign.lord,
        nakshatra: nak.name,
        nakLord: nak.lord,
        pada: nak.pada
    };
};

const isConjoined = (a, b) => a && b && a.signId === b.signId;
const isInSigns = (pos, signs) => pos && Array.isArray(signs) && signs.includes(pos.signId);
const getOwnedSigns = (planet) => PLANET_INFO[planet]?.own || [];

const getDignityWrapper = (planet, lng) => calculateDignity(planet, lng);

const isExalted = (planet, lng) => getDignityWrapper(planet, lng).english === 'Exalted';
const isDebilitated = (planet, lng) => getDignityWrapper(planet, lng).english === 'Debilitated';
const isOwnSign = (planet, lng) => getDignityWrapper(planet, lng).english === 'Own Sign';

// Check if all planets in the list are in the same sign
const areInSameSign = (positions) => {
    if (!positions || positions.length < 2) return false;
    const firstSign = positions[0]?.signId;
    if (!firstSign) return false;
    return positions.every(p => p && p.signId === firstSign);
};

/* ------------------ MAIN ENGINE ------------------ */

const evaluatePrediction = (playerBirthChart, matchParams) => {

    /* MATCH CHART */
    const { planets, ascendant } = calculatePlanetaryPositions(
        matchParams.year,
        matchParams.month,
        matchParams.day,
        matchParams.hour,
        matchParams.minute,
        matchParams.latitude,
        matchParams.longitude,
        matchParams.timezone
    );

    const matchChart = {
        planets,
        ascendant,
        moon: getPlanetPosition("Moon", { planets }),
        ascSign: calculateSign(ascendant)
    };

    /* PLAYER MAP */
    const pMap = {};
    for (const [k, v] of Object.entries(playerBirthChart.planets)) {
        pMap[k] = typeof v === "object" ? v.longitude : v;
    }

    const playerChart = {
        planets: pMap,
        moon: getPlanetPosition("Moon", { planets: pMap }),
        sun: getPlanetPosition("Sun", { planets: pMap }),
        mars: getPlanetPosition("Mars", { planets: pMap }),
        mercury: getPlanetPosition("Mercury", { planets: pMap }),
        jupiter: getPlanetPosition("Jupiter", { planets: pMap }),
        venus: getPlanetPosition("Venus", { planets: pMap }),
        saturn: getPlanetPosition("Saturn", { planets: pMap }),
        rahu: getPlanetPosition("Rahu", { planets: pMap }),
        ketu: getPlanetPosition("Ketu", { planets: pMap })
    };

    if (!playerChart.moon || !matchChart.moon)
        throw new Error("Moon missing. Abort.");

    /* BASIC DATA */
    const playerRasi = playerChart.moon.signId;
    const playerStar = playerChart.moon.nakshatra;
    const playerRasiLord = playerChart.moon.signLord;
    const playerStarLord = playerChart.moon.nakLord;

    const matchRasi = matchChart.moon.signId;
    const matchStar = matchChart.moon.nakshatra; // Nakshatra Name (English)
    const matchRasiLord = matchChart.moon.signLord;
    const matchStarLord = matchChart.moon.nakLord;
    const matchLagnaLord = matchChart.ascSign.lord;

    /* STATE */
    const batting = { score: 0, rules: [], status: "UNDECIDED", isSpecial: false };
    const bowling = { score: 0, rules: [], status: "UNDECIDED", isSpecial: false };

    const addRule = (name, score, type = 'both', isSpecial = false) => {
        const ruleText = `${name} (${score > 0 ? '+' : ''}${score})`;
        if (type === 'both' || type === 'bat') {
            batting.score += score;
            batting.rules.push(ruleText);
            if (isSpecial) batting.isSpecial = true;
        }
        if (type === 'both' || type === 'bowl') {
            bowling.score += score;
            bowling.rules.push(ruleText);
            if (isSpecial) bowling.isSpecial = true;
        }
    };

    // Helper to get positions for easier access
    const P = playerChart;

    /* ================= MATCH STAR SPECIFIC RULES ================= */
    console.log(`Evaluating Rules for Match Star: ${matchStar}`);

    switch (matchStar) {
        // 1. Aswini: Chevvai - Kethu
        case 'Ashwini':
            // Rule: player chevaai (Mars) uchamaga irunthaal point 8
            if (isExalted('Mars', P.mars.longitude)) {
                addRule('Ashwini: Mars Exalted', 8);
            }
            // Rule: neechamaga irunthaal point -12
            else if (isDebilitated('Mars', P.mars.longitude)) {
                addRule('Ashwini: Mars Debilitated', -12);
            }

            // Rule: Chevvai + Sukkiran (Mars + Venus) inainthu irunthaal 10 point
            if (areInSameSign([P.mars, P.venus])) {
                addRule('Ashwini: Mars & Venus Conjoined', 10);
            }
            break;

        // 2. Bharani: Chevvai - Sukkiran
        case 'Bharani':
            // Rule: Sukkiran and puthan inainthu irunthaal point -12 show flop
            if (areInSameSign([P.venus, P.mercury])) {
                addRule('Bharani: Venus & Mercury Conjoined', -12, 'both', true); // Show Flop
            }
            break;

        // 3. Rohini: Sukkiran - Chandran
        case 'Rohini':
            // Rule: Chandiran neechamaaga irunthaal point +8
            if (isDebilitated('Moon', P.moon.longitude)) {
                addRule('Rohini: Moon Debilitated', 8);
            }
            // Rule: Player natchathiram Sathayam aaga irunthaal +12 point game changer
            if (playerStar === 'Shatabhisha') {
                addRule('Rohini: Player Star Sathayam', 12, 'both', true); // Game Changer
            }
            break;

        // 4. Thiruvathirai (Ardra): Budhan - Rahu
        case 'Ardra':
            // Rule: chevaai rasi athipathi aaga or natchathira athipathi aaga irunthathu entral 4 point
            const isMarsRasiLord = playerRasiLord === 'Mars';
            const isMarsStarLord = playerStarLord === 'Mars';

            if (isMarsRasiLord || isMarsStarLord) {
                addRule('Ardra: Mars is Rasi or Star Lord', 4);

                // Rule: aatchi uchamaga irunthaal +10 point
                // Assuming this applies to Mars (the subject of the previous condition)
                if (isOwnSign('Mars', P.mars.longitude) || isExalted('Mars', P.mars.longitude)) {
                    addRule('Ardra: Mars Strong (Own/Exalted)', 10);
                }
            }
            break;

        // 5. Ayilyam (Ashlesha): Chandran - Budhan
        case 'Ashlesha':
            // Rule: player jathagathil sukkiran puthan inainthu irunthaal -12 point sure flop
            if (areInSameSign([P.venus, P.mercury])) {
                addRule('Ashlesha: Venus & Mercury Conjoined', -12, 'both', true); // Sure Flop
            }
            break;

        // 6. Magam: Suriyan - Kethu
        case 'Magha':
            // Rule: player rasi athipathi puthan natchathira athipathi chevaai aaga irunthaal point +12
            if (playerRasiLord === 'Mercury' && playerStarLord === 'Mars') {
                addRule('Magha: Rasi Lord Mercury & Star Lord Mars', 12, 'both', true); // Show Spl Player
            }
            break;

        // 7. Pooram (Purva Phalguni):
        case 'Purva Phalguni':
            // Rule: Rasi athipathi sani natchathira athipathi chevvai aaga irunthaal batting +12 point
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') {
                addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true);
            }
        // 8. Kanni Rasi Uthiram (Uttara Phalguni in Virgo): Budhan - Suriyan
        case 'Uttara Phalguni':
            // Check if Match Moon is in Virgo (Sign ID 6)
            if (matchChart.moon.signId === 6) {
                // Rule: rasi athi pathi sani natchathira athipathi ragu entraal point +12
                if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') {
                    addRule('Uthiram (Kanni): Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true); // Show Spl Player
                }
            }
            break;

        // 9. Chithirai (Chitra): Split based on Padas (Virgo vs Libra)
        case 'Chitra':
            // Padas 1, 2 are in Virgo (Sign ID 6)
            if (matchChart.moon.signId === 6) {
                // Rule: player rasi athipathi puthan aaga irunthu puthan suriyan inainthu irunthal +6 point
                if (playerRasiLord === 'Mercury') {
                    if (areInSameSign([P.mercury, P.sun])) {
                        // Check for additional conjunctions
                        const withJupiter = areInSameSign([P.mercury, P.sun, P.jupiter]);
                        const withVenusAndJupiter = areInSameSign([P.mercury, P.sun, P.venus, P.jupiter]);

                        if (withVenusAndJupiter) {
                            addRule('Chitra (Virgo): Mercury + Sun + Venus + Jupiter', 12);
                        } else if (withJupiter) {
                            addRule('Chitra (Virgo): Mercury + Sun + Jupiter', 8);
                        } else {
                            addRule('Chitra (Virgo): Mercury + Sun', 6);
                        }
                    }
                }
            }
            // Padas 3, 4 are in Libra (Sign ID 7)
            else if (matchChart.moon.signId === 7) {
                // Rule: player rasi athipathi chanthiran natchathira athipathi saniyaga irunthaal +12 point
                if (playerRasiLord === 'Moon' && playerStarLord === 'Saturn') {
                    addRule('Chitra (Libra): Rasi Lord Moon & Star Lord Saturn', 12, 'both', true); // Show Spl Player
                }
            }
            break;

        // 10. Anusham (Anuradha): Chevvai - Sani
        case 'Anuradha':
            // Rule: player rasi athi pathi guru entraal +5 point
            if (playerRasiLord === 'Jupiter') {
                addRule('Anuradha: Rasi Lord Jupiter', 5);
                // Rule: aatchi uchamaga irunthaal +10 point
                if (isOwnSign('Jupiter', P.jupiter.longitude) || isExalted('Jupiter', P.jupiter.longitude)) {
                    addRule('Anuradha: Jupiter Strong (Own/Exalted)', 10);
                }
            }
            break;

        // 11. Kettai (Jyeshtha): Chevvai - Budhan
        case 'Jyeshtha':
            // Rule: Budhan & sukkiran inainthu oreay veetil inainthu irunthaal -12 point
            if (areInSameSign([P.mercury, P.venus])) {
                addRule('Jyeshtha: Mercury & Venus Conjoined', -12);
            }
            break;

        // 12. Moolam (Mula): Guru - Kethu
        case 'Mula':
            // Rule: player rasi athi pathi sani natchathira athipathi chevvai entraal batting +12 point
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Mars') {
                addRule('Mula: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true); // Show Spl Player
            }
            // Rule: rasi athi pathi chevaai natchathira athipathi sani entraal Bowling +12 point
            else if (playerRasiLord === 'Mars' && playerStarLord === 'Saturn') {
                addRule('Mula: Rasi Lord Mars & Star Lord Saturn', 12, 'bowl', true); // Show Spl Player
            }
            break;

            // Rule: sukkiran and puthan inainthu oreay veetil irunthaal -12 point sure flop
            if (areInSameSign([P.venus, P.mercury])) {
                addRule('Purva Ashadha: Venus & Mercury Conjoined', -12, 'both', true); // Sure Flop
            }
            break;

        // 14. Uthiradam (Uttara Ashadha) [2,3,4 Padas in Capricorn]: Sani - Suriyan
        case 'Uttara Ashadha':
            // Check if Match Moon is in Capricorn (Sign ID 10)
            if (matchChart.moon.signId === 10) {
                // Rule: rasi athipathi chanthiran vanthaal +12 point
                if (playerRasiLord === 'Moon') {
                    addRule('Uthiradam (Capricorn): Rasi Lord Moon', 12, 'both', true); // Show Spl Player
                }
            }
            break;

        // 15. Thiruvonam (Shravana): Sani - Chandran
        case 'Shravana':
            // Rule: player rasi athipathi chevvai aga irunthu chevaai chanthiran veetil irunthaal +6 point in bowling
            if (playerRasiLord === 'Mars') {
                // Check if Mars is in Cancer (Sign ID 4 - Moon's House)
                if (P.mars.signId === 4) {
                    addRule('Thiruvonam: Rasi Lord Mars in Moon House', 6, 'bowl');
                }
            }
            // Rule: rasi athipathi sani natchathira athipathi raaguvaga irunthal +12 point
            if (playerRasiLord === 'Saturn' && playerStarLord === 'Rahu') {
                addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true); // Show Spl Player
            }
            break;

        // 16. Avittam (Dhanishta) [1,2 Padas in Capricorn]: Sani - Chevvai
        case 'Dhanishta':
            // Check if Match Moon is in Capricorn (Sign ID 10)
            if (matchChart.moon.signId === 10) {
                // Rule: rasi athipathi sani entraal +4 point
                if (playerRasiLord === 'Saturn') {
                    addRule('Avittam (Capricorn): Rasi Lord Saturn', 4);
                }
            }
            break;

        // 17. Sathayam (Shatabhisha): Sani - Rahu
        case 'Shatabhisha':
            // Rule: player rasi athipathi chanthiran aaga irunthal game changer +12 point
            if (playerRasiLord === 'Moon') {
                addRule('Sathayam: Rasi Lord Moon', 12, 'both', true); // Show Spl Player (Game Changer)
            }
            break;
    }

    /* ================= FINAL OUTPUT ================= */
    // Net Score
    const netScore = batting.score + bowling.score;

    return {
        batting,
        bowling,
        netScore
    };
};

module.exports = { evaluatePrediction };
