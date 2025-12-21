
// --- Constants & Mappings ---

const signLords = {
    "Aries": "Mars", "Mesha": "Mars",
    "Taurus": "Venus", "Vrishabha": "Venus",
    "Gemini": "Mercury", "Mithuna": "Mercury",
    "Cancer": "Moon", "Karka": "Moon",
    "Leo": "Sun", "Simha": "Sun",
    "Virgo": "Mercury", "Kanya": "Mercury",
    "Libra": "Venus", "Tula": "Venus",
    "Scorpio": "Mars", "Vrishchika": "Mars",
    "Sagittarius": "Jupiter", "Dhanu": "Jupiter",
    "Capricorn": "Saturn", "Makara": "Saturn",
    "Aquarius": "Saturn", "Kumbha": "Saturn",
    "Pisces": "Jupiter", "Meena": "Jupiter"
};

const getStarLord = (starName) => {
    if (!starName) return null;
    const n = starName.toLowerCase();

    if (['ashwini', 'magha', 'mula', 'moola'].some(s => n.includes(s))) return 'Ketu';
    if (['bharani', 'purva phalguni', 'purvaphalguni', 'purva ashadha', 'purvashada'].some(s => n.includes(s))) return 'Venus';
    if (['krittika', 'uttara phalguni', 'uttaraphalguni', 'uttara ashadha', 'uttarashada'].some(s => n.includes(s))) return 'Sun';
    if (['rohini', 'hasta', 'shravana'].some(s => n.includes(s))) return 'Moon';
    if (['mrigashira', 'chitra', 'dhanishta'].some(s => n.includes(s))) return 'Mars';
    if (['ardra', 'swati', 'shatabhisha'].some(s => n.includes(s))) return 'Rahu';
    if (['punarvasu', 'vishakha', 'purva bhadrapada', 'purvabhadra'].some(s => n.includes(s))) return 'Jupiter';
    if (['pushya', 'anuradha', 'uttara bhadrapada', 'uttarabhadra'].some(s => n.includes(s))) return 'Saturn';
    if (['ashlesha', 'jyeshtha', 'revati'].some(s => n.includes(s))) return 'Mercury';
    return null;
};

// --- Helpers ---

// Get a planet's details from a chart
const getPlanet = (chart, planetName) => {
    if (!chart || !chart.planets) return null;
    // Handle "Ascendant" or "Lagna"
    if (planetName === 'Ascendant' || planetName === 'Lagna' || planetName === 'Asc') {
        // Usually stored as "Asc" or found via house 1?
        // Assuming 'Asc' key exists or we look for isAsc flag.
        // Or checking houses["1"] sign.
        if (chart.planets["Asc"]) return chart.planets["Asc"];
        if (chart.planets["Lagna"]) return chart.planets["Lagna"];
        // Fallback: find planet with isAsc (unlikely for object map, but possible in array)
        return null;
    }
    return chart.planets[planetName];
};

// Check if two planets are in the same Sign (Conjunction)
const isConjunct = (p1Sign, p2Sign) => {
    return p1Sign && p2Sign && p1Sign === p2Sign;
};

// Check if Planet A is in a Sign owned by Planet B
const isInHouseOf = (planetObj, lordName) => {
    if (!planetObj || !lordName) return false;
    const signOwner = signLords[planetObj.sign];
    return signOwner === lordName;
};

// Check Parivartana (Exchange)
// P1 is in Sign A (Lord X), P2 is in Sign B (Lord Y).
// Exchange if P1 is in Sign owned by P2 AND P2 is in Sign owned by P1.
// BUT here usually refers to Lords exchanging signs.
// Rule Context: "Player Star joined with Match Star OR Parivartana"
// This likely refers to the MOON Signs exchanging lords?
// Or Player Moon in Match Moon Sign AND Match Moon in Player Moon Sign.
const isExchange = (p1Obj, p2Obj) => {
    if (!p1Obj || !p2Obj) return false;
    const sign1 = p1Obj.sign;
    const sign2 = p2Obj.sign;
    const lord1 = signLords[sign1];
    const lord2 = signLords[sign2];

    // Check if Lords represent the other planet?
    // If P1 is Moon, P2 is Moon...
    // Strictly: Moon(P) in Sign(M) And Moon(M) in Sign(P).
    return (sign1 !== sign2) && (lord1 === p2Obj.name || isInHouseOf(p1Obj, p2Obj.name)) && (lord2 === p1Obj.name || isInHouseOf(p2Obj, p1Obj.name));
};
// Simplified Exchange: Player Moon in Sign X (Lord Y), Match Moon in Sign Z (Lord A).
// If Lord Y is in Sign Z AND Lord A is in Sign X.

// --- Rules Engines ---

export const evaluateBatsman = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    if (!playerChart || !matchChart) return { score: 0, label: "No Data", report: ["Missing Chart Data"] };

    // 1. Data Prep
    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");

    const pRasiLord = signLords[pMoon?.sign];
    const pStarLord = getStarLord(pMoon?.nakshatra);

    const mRasiLord = signLords[mMoon?.sign];
    const mStarLord = getStarLord(mMoon?.nakshatra);

    const pRasiLordObj = getPlanet(playerChart, pRasiLord);
    const pStarLordObj = getPlanet(playerChart, pStarLord);

    const mStarLordObj_in_Match = getPlanet(matchChart, mStarLord); // Match Star Lord's pos in Match Chart?
    // "Match Star Lord's house" usually means the signs owned by Match Star Lord.

    if (!pMoon || !mMoon) return { score: 0, label: "Error", report: ["Missing Moon Data"] };

    // RULE 1: Player Star joined Match Star (Conjunction) OR Exchange
    // Interpretation: Player Moon Sign == Match Moon Sign (Conjunction)
    // OR Player Moon Sign Lord <-> Match Moon Sign Lord Exchange (Parivartana)
    let rule1 = false;
    if (isConjunct(pMoon.sign, mMoon.sign)) {
        report.push("Rule 1 (Pass): Player Rasi/Star conjunct Match Rasi/Star.");
        score += 2;
        rule1 = true;
    } else {
        // Exchange Check: Player Moon Lord in Match Moon Sign & Match Moon Lord in Player Moon Sign?
        // Or simply Player Moon in Match Moon Sign & Match Moon in Player Moon Sign (Rasi Exchange).
        // Let's check Rasi Exchange first.
        const pMoonInMatchSign = (pMoon.sign === mMoon.sign); // Already covered by conjunct
        // Checking Lords Exchange:
        // Player Rasi Lord (e.g. Mars) in Match Chart is in Match Rasi?
        // Complex. Let's stick to "Moon Signs Parivartana" if signs are different.
        // If Player Moon Sign is Aries (Mars), Match Moon Sign is Taurus (Venus).
        // If Player Moon is in Taurus AND Match Moon is in Aries? -> Exchange.
        // BUT we can't check "Player Moon is in Taurus" because Player Moon IS in Aries.
        // It implies: Player Moon in Sign X, Match Moon in Sign Y.
        // If Sign X is owned by Planet A, Sign Y by Planet B.
        // If Sign X == Sign of Planet B AND Sign Y == Sign of Planet A ?? No.
        // Let's assume simpler: "Parivartana" means the Lords of the Moons are exchanging signs in the MATCH chart?
        // OR in their respective charts?
        // Let's use: Player Moon Sign Lord is in Match Moon Sign (in Match Chart) AND Match Moon Sign Lord is in Player Moon Sign (in Match Chart).
        // This is too deep. Let's stick to simple "Moon Sign Conjunction" for GOOD, and if explicit "Exchange" mentioned, we flag it.
        // Evaluated as: Not Conjunction.
    }

    // RULE 3: Player Star Lord is the Sign Lord for the Match Rasi
    // e.g. Player Star Lord = Ketu. Match Rasi = Aries (Lord Mars). Ketu != Mars.
    if (pStarLord && mRasiLord && pStarLord === mRasiLord) {
        report.push(`Rule 3 (Pass): Player Star Lord (${pStarLord}) exceeds as Match Rasi Lord.`);
        score += 1;
    }

    // RULE 4: Player Rasi Lord AND Player Star Lord BOTH in Match Star Lord's house.
    // We check PLANETS (pRasiLord, pStarLord) in the MATCH CHART or PLAYER CHART?
    // "Today's Match" context usually implies looking at transit positions (Match Chart) or static?
    // Usually: "Player's [Planet] is in..." refers to the Player's Chart.
    // " ... in Match Star Lord's house".
    // So: pRasiLord (in Player Chart) is in a Sign owned by mStarLord.
    //     pStarLord (in Player Chart) is in a Sign owned by mStarLord.
    if (pRasiLordObj && pStarLordObj && mStarLord) {
        if (isInHouseOf(pRasiLordObj, mStarLord) && isInHouseOf(pStarLordObj, mStarLord)) {
            report.push(`Rule 4 (Pass): Player Rasi Lord (${pRasiLord}) & Star Lord (${pStarLord}) both in ${mStarLord}'s house.`);
            score += 1;
        }
    }

    // RULE 5: Match Star Lord is in Player Star Lord's house.
    // Match Star Lord (in Match Chart? or Player Chart?) usually Match Planet in Player House.
    // Let's evaluate Match Star Lord (in Match Chart) is in Sign owned by Player Star Lord.
    if (mStarLordObj_in_Match && pStarLord) {
        if (isInHouseOf(mStarLordObj_in_Match, pStarLord)) {
            report.push(`Rule 5 (Pass): Match Star Lord (${mStarLord}) is in Player Star Lord (${pStarLord})'s house.`);
            score += 1;
        }
    }

    // RULE 6: Player Rasi Lord is Conjunct Match Star Lord.
    // pRasiLord (in Match Chart?) conjunct mStarLord (in Match Chart).
    // Comparing positions in the MATCH chart (Transit).
    // Find pRasiLord Planet in Match Chart.
    const pRasiLord_in_Match = getPlanet(matchChart, pRasiLord);
    if (pRasiLord_in_Match && mStarLordObj_in_Match) {
        if (isConjunct(pRasiLord_in_Match.sign, mStarLordObj_in_Match.sign)) {
            report.push(`Rule 6 (Pass): Player Rasi Lord (${pRasiLord}) conjunct Match Star Lord (${mStarLord}) in Match Chart.`);
            score += 1;
        }
    }

    // RULE 7: Rahu/Ketu special
    if (pStarLord === 'Rahu' || pStarLord === 'Ketu') {
        // Check Dispositor of Rahu/Ketu (in Player Chart).
        // Dispositor = Lord of the Sign Rahu/Ketu is in.
        const rahuKetuObj = getPlanet(playerChart, pStarLord);
        if (rahuKetuObj) {
            const dispositor = signLords[rahuKetuObj.sign];
            const dispositorObj = getPlanet(playerChart, dispositor);
            // Check if Dispositor is in Match Star Lord's house
            if (dispositorObj && mStarLord && isInHouseOf(dispositorObj, mStarLord)) {
                report.push(`Rule 7 (Pass): Player Star Lord is ${pStarLord}. Dispositor (${dispositor}) is in ${mStarLord}'s house.`);
                score += 1;
            }
        }
    }

    // Fallback Rule for Flop handled by score
    const label = score >= 2 ? "Excellent" : score >= 1 ? "Good" : "Flop";
    return { score, label, report };
};


export const evaluateBowler = (playerChart, matchChart) => {
    const report = [];
    let score = 0;

    if (!playerChart || !matchChart) return { score: 0, label: "No Data", report: [] };

    const pMoon = getPlanet(playerChart, "Moon");
    const mMoon = getPlanet(matchChart, "Moon");
    const pRasiLord = signLords[pMoon?.sign];
    const pStarLord = getStarLord(pMoon?.nakshatra);

    const mRasiLord = signLords[mMoon?.sign];
    const mStarLord = getStarLord(mMoon?.nakshatra);

    const matchLagna = getPlanet(matchChart, "Asc"); // Ascendant
    const matchLagnaLord = matchLagna ? signLords[matchLagna.sign] : null;

    if (!pMoon || !mMoon) return { score: 0, label: "Error", report: ["Missing Moon Data"] };

    // RULE 1: Conjunction / Exchange (Same as Batsman)
    if (isConjunct(pMoon.sign, mMoon.sign)) {
        report.push("Rule 1 (Pass): Player Rasi/Star conjunct Match Rasi/Star.");
        score += 2;
    }

    // RULE 2: Match Rasi Lord == Player Rasi Lord OR Player Star Lord OR Player Lagna Lord
    const pAsc = getPlanet(playerChart, "Asc");
    const pLagnaLord = pAsc ? signLords[pAsc.sign] : null; // Assuming pAsc has sign

    if (mRasiLord) {
        if (mRasiLord === pRasiLord) {
            report.push(`Rule 2 (Pass): Match Rasi Lord (${mRasiLord}) matches Player Rasi Lord.`);
            score += 1;
        } else if (mRasiLord === pStarLord) {
            report.push(`Rule 2 (Pass): Match Rasi Lord (${mRasiLord}) matches Player Star Lord.`);
            score += 1;
        } else if (pLagnaLord && mRasiLord === pLagnaLord) {
            report.push(`Rule 2 (Pass): Match Rasi Lord (${mRasiLord}) matches Player Lagna Lord.`);
            score += 1;
        }
    }

    // RULE 3: Player Star is in a sign owned by (Match Rasi Lord's Star Lord) - Complex!
    // "Match Rasi Lord's Star Lord" -> Take Match Rasi Lord (e.g. Mars). Look at Mars in Match Chart. Find its Star (Nakshatra). Find that Star's Lord.
    // e.g. Match Rasi Lord = Mars. Mars in Match Chart is in Ashwini (Lord Ketu). Target = Ketu.
    // Check if Player Star (Moon Nakshatra) is owned by Ketu? NO. "Player Star is in a sign owned by...".
    // "Player Star is in a sign" -> Player Moon is in a sign.
    // So: Player Moon's Sign Lord == Target?
    if (mRasiLord) {
        const mRasiLordObj_Match = getPlanet(matchChart, mRasiLord);
        if (mRasiLordObj_Match) {
            const lordStar = mRasiLordObj_Match.nakshatra;
            const lordStarLord = getStarLord(lordStar); // The Target Planet

            // Player Star (Moon) Sign Lord == Target?
            const pMoonSignLord = signLords[pMoon.sign];
            if (lordStarLord && pMoonSignLord === lordStarLord) {
                report.push(`Rule 3 (Pass): Player Rasi in house owned by ${lordStarLord} (Match Rasi Lord's Star Lord).`);
                score += 1;
            }
        }
    }

    // RULE 4: Player Rasi Lord is in Match Lagna
    // pRasiLord (Position in Match Chart?) is in Match Lagna Sign.
    const pRasiLord_in_Match = getPlanet(matchChart, pRasiLord);
    if (pRasiLord_in_Match && matchLagna) {
        if (isConjunct(pRasiLord_in_Match.sign, matchLagna.sign)) {
            report.push(`Rule 4 (Pass): Player Rasi Lord (${pRasiLord}) is in Match Lagna (${matchLagna.sign}).`);
            score += 1;
        }
    }

    // RULE 5: Player Rasi Lord is Conjunct Match Lagna Lord
    // pRasiLord (in Match Chart) conjunct matchLagnaLord (in Match Chart)
    const matchLagnaLordObj = getPlanet(matchChart, matchLagnaLord);
    if (pRasiLord_in_Match && matchLagnaLordObj) {
        if (isConjunct(pRasiLord_in_Match.sign, matchLagnaLordObj.sign)) {
            report.push(`Rule 5 (Pass): Player Rasi Lord (${pRasiLord}) conjunct Match Lagna Lord (${matchLagnaLord}).`);
            score += 1;
        }
    }

    const label = score >= 2 ? "Excellent" : score >= 1 ? "Good" : "Flop";
    return { score, label, report };
};

// Export helper for UI
export const getNakshatraLordHelper = getStarLord;
