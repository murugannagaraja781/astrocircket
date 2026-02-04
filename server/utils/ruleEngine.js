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
    const pKey = planet;
    const lng = chart.planets[pKey];
    if (lng === undefined) return null;
    const sign = calculateSign(lng);
    const nak = calculateNakshatra(lng);
    return {
        name: planet,
        longitude: lng,
        signId: sign.id,
        signName: sign.name,
        signLord: sign.lord,
        nakshatra: nak.name,
        nakLord: nak.lord,
        pada: nak.pada
    };
};

const getOwnedSigns = (planet) => PLANET_INFO[planet]?.own || [];
const isExalted = (planet, lng) => calculateDignity(planet, lng).english === 'Exalted';
const isOwnSign = (planet, lng) => {
    const d = calculateDignity(planet, lng).english;
    return d === 'Own Sign' || d === 'Mooltrikona';
};
const isDebilitated = (planet, lng) => calculateDignity(planet, lng).english === 'Debilitated';

class RuleContext {
    constructor(playerBirthChart, matchParams) {
        // Calculate Match positions (Default / Bowling)
        const matchData = calculatePlanetaryPositions(
            matchParams.year, matchParams.month, matchParams.day, matchParams.hour, matchParams.minute,
            matchParams.latitude, matchParams.longitude, matchParams.timezone
        );
        this.matchChart = {
            planets: matchData.planets,
            ascendant: matchData.ascendant,
            moon: getPlanetPosition("Moon", { planets: matchData.planets }),
            ascSign: calculateSign(matchData.ascendant)
        };

        // Handle Dynamic Lagna for Batting/Bowling Phases
        this.matchLagnaSignBowl = this.matchChart.ascSign.name;
        this.matchLagnaLordBowl = this.matchChart.ascSign.lord;

        // If specific batting time is provided, calculate separate Lagna
        if (matchParams.battingHour !== undefined && matchParams.battingMinute !== undefined) {
            const batData = calculatePlanetaryPositions(
                matchParams.year, matchParams.month, matchParams.day,
                matchParams.battingHour, matchParams.battingMinute,
                matchParams.latitude, matchParams.longitude, matchParams.timezone
            );
            const batAscSign = calculateSign(batData.ascendant);
            this.matchLagnaSignBat = batAscSign.name;
            this.matchLagnaLordBat = batAscSign.lord;
        } else {
            this.matchLagnaSignBat = this.matchLagnaSignBowl;
            this.matchLagnaLordBat = this.matchLagnaLordBowl;
        }

        // If specific bowling time is provided, override bowling Lagna
        if (matchParams.bowlingHour !== undefined && matchParams.bowlingMinute !== undefined) {
            const bowlData = calculatePlanetaryPositions(
                matchParams.year, matchParams.month, matchParams.day,
                matchParams.bowlingHour, matchParams.bowlingMinute,
                matchParams.latitude, matchParams.longitude, matchParams.timezone
            );
            const bowlAscSign = calculateSign(bowlData.ascendant);
            this.matchLagnaSignBowl = bowlAscSign.name;
            this.matchLagnaLordBowl = bowlAscSign.lord;
        }

        // Normalize Player Planets
        const pMap = {};
        for (const [k, v] of Object.entries(playerBirthChart.planets)) {
            pMap[k] = typeof v === "object" ? v.longitude : v;
            pMap[k.toLowerCase()] = pMap[k];
        }
        this.playerPlanets = pMap;
        this.getP = (name) => getPlanetPosition(name, { planets: pMap });

        // Extracted values for rules
        const pMoon = this.getP("Moon");
        const mMoon = this.matchChart.moon;

        this.playerRasiLord = pMoon.signLord;
        this.playerStarLord = pMoon.nakLord;
        this.playerStar = pMoon.nakshatra;
        this.playerRasi = pMoon.signName;

        this.matchStar = mMoon.nakshatra;
        this.matchRasiLord = mMoon.signLord;
        this.matchStarLord = mMoon.nakLord;

        // Rahu/Ketu Overrides
        const originalMatchStarLord = mMoon.nakLord;
        this.isMatchStarLordRahuKetu = (originalMatchStarLord === 'Rahu' || originalMatchStarLord === 'Ketu');

        if (this.matchStarLord === 'Rahu' || this.matchStarLord === 'Ketu') {
            this.matchStarLord = this.matchRasiLord;
            if (['Magha', 'Magam', 'Ashwini', 'Aswini'].includes(this.matchStar)) this.matchStarLord = 'Mars';
        }
        if (this.playerStarLord === 'Rahu' || this.playerStarLord === 'Ketu') {
            this.playerStarLord = this.playerRasiLord;
        }

        // P and M maps (Planet -> SignName) for rule logic compatibility
        this.P = {};
        ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].forEach(p => {
            const pos = this.getP(p);
            if (pos) this.P[p] = pos.signName;
        });

        this.M = {};
        ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].forEach(p => {
            const pos = getPlanetPosition(p, { planets: this.matchChart.planets });
            if (pos) this.M[p] = pos.signName;
        });

        this.batting = { score: 0, rules: [], isSpecial: false, status: 'Active' };
        this.bowling = { score: 0, rules: [], isSpecial: false, status: 'Active' };
        this.sureFlopBat = false;
        this.sureFlopBowl = false;
    }

    addRule(name, score, type = 'both', isSpecial = false, nameTamil = '') {
        const ruleText = `${name} (${score > 0 ? '+' : ''}${score})`;
        const logEntry = { en: ruleText, ta: nameTamil ? `${nameTamil} (${score > 0 ? '+' : ''}${score})` : ruleText };

        if (type === 'both' || type === 'bat') {
            this.batting.score += score;
            this.batting.rules.push(logEntry);
            if (isSpecial) this.batting.isSpecial = true;
        }
        if (type === 'both' || type === 'bowl') {
            this.bowling.score += score;
            this.bowling.rules.push(logEntry);
            if (isSpecial) this.bowling.isSpecial = true;
        }
    }

    applyBonuses(planet, score, type = 'both') {
        const pos = this.playerPlanets[planet.toLowerCase()];
        if (pos !== undefined) {
            if (isExalted(planet, pos)) this.addRule(`${planet} Aatchi/Ucham Bonus`, score, type, false, `${planet} உச்சம்`);
            else if (isOwnSign(planet, pos)) this.addRule(`${planet} Aatchi/Ucham Bonus`, score, type, false, `${planet} ஆட்சி`);
        }
    }

    setSureFlop(name, nameTamil = '', type = 'both') {
        if (type === 'both' || type === 'bat') this.sureFlopBat = true;
        if (type === 'both' || type === 'bowl') this.sureFlopBowl = true;
        this.addRule(name, 0, type, true, nameTamil);
    }
}

/** General Rules Index **/
const GENERAL_RULES = [
    (ctx) => { // Rule 1
        if (ctx.isMatchStarLordRahuKetu) return;
        if (ctx.matchRasiLord === ctx.playerStarLord && ctx.matchStarLord === ctx.playerRasiLord) {
            ctx.addRule('BAT Rule 1: Zig-Zag', 12, 'bat', false, 'பேட்டிங் விதி 1: ஜிக்-ஜாக்');
            ctx.addRule('BOWL Rule 1: Zig-Zag', 12, 'bowl', false, 'பவுலிங் விதி 1: ஜிக்-ஜாக்');
            ctx.applyBonuses(ctx.playerRasiLord, 4);
        }
    },
    (ctx) => { // Rule 2
        if (ctx.matchRasiLord === ctx.playerRasiLord && ctx.matchStarLord === ctx.playerStarLord) {
            ctx.addRule('BAT Rule 2: Direct', 6, 'bat', false, 'பேட்டிங் விதி 2: நேரடி விதி');
            ctx.applyBonuses(ctx.playerRasiLord, 4, 'bat');
            ctx.setSureFlop('BOWL Rule 2: Same Rasi & Star', 'பவுலிங் விதி 2: ஒரே ராசி & நட்சத்திரம்', 'bowl');
        }
    },
    (ctx) => { // Rule 3
        if (ctx.matchStarLord === ctx.playerRasiLord || ctx.matchStarLord === ctx.playerStarLord) {
            ctx.addRule('BAT Rule 3: Star', 4, 'bat', false, 'பேட்டிங் விதி 3: நட்சத்திர விதி');
            ctx.applyBonuses(ctx.matchStarLord, 4, 'bat');
            ctx.addRule('BOWL Rule 3: Star', 3, 'bowl', false, 'பவுலிங் விதி 3: நட்சத்திர விதி');
            const pos = ctx.playerPlanets[ctx.matchStarLord.toLowerCase()];
            if (pos !== undefined && (isExalted(ctx.matchStarLord, pos) || isOwnSign(ctx.matchStarLord, pos))) {
                ctx.addRule('BOWL Rule 3: Bonus', 6, 'bowl', false, 'பவுலிங் விதி 3: போனஸ்');
            }
        }
    },
    (ctx) => { // Rule 4: Conjunction
        const pRasiLordPos = ctx.P[ctx.playerRasiLord];
        const pStarLordPos = ctx.P[ctx.playerStarLord];
        const mStarLordPos = ctx.P[ctx.matchStarLord];
        const mRasiLordPos = ctx.P[ctx.matchRasiLord];

        if (mStarLordPos) {
            if (pRasiLordPos && mStarLordPos === pRasiLordPos) {
                ctx.addRule('BAT Rule 4: Conjunction (Rasi Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (ராசி அதிபதி)');
                ctx.addRule('BOWL Rule 4: Conjunction Star (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
                ctx.applyBonuses(ctx.playerRasiLord, 4);
                if (ctx.matchLagnaSignBat === mStarLordPos) ctx.addRule('Lagna Match Bonus', 2, 'bat');
                if (ctx.matchLagnaSignBowl === mStarLordPos) ctx.addRule('Lagna Match Bonus', 2, 'bowl');
            } else if (pStarLordPos && mStarLordPos === pStarLordPos) {
                ctx.addRule('BAT Rule 4: Conjunction (Star Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
                ctx.addRule('BOWL Rule 4: Conjunction Star (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
                ctx.applyBonuses(ctx.playerStarLord, 4);
                if (ctx.matchLagnaSignBat === mStarLordPos) ctx.addRule('Lagna Match Bonus', 2, 'bat');
                if (ctx.matchLagnaSignBowl === mStarLordPos) ctx.addRule('Lagna Match Bonus', 2, 'bowl');
            }
        }
        if (mRasiLordPos) {
            if (pRasiLordPos && mRasiLordPos === pRasiLordPos) {
                ctx.addRule('BOWL Rule 4: Conjunction Rasi (Rasi Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் ராசி அதிபதி சேர்க்கை');
                ctx.applyBonuses(ctx.playerRasiLord, 4, 'bowl');
            } else if (pStarLordPos && mRasiLordPos === pStarLordPos) {
                ctx.addRule('BOWL Rule 4: Conjunction Rasi (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: மேட்ச் ராசி அதிபதி சேர்க்கை');
                ctx.applyBonuses(ctx.playerStarLord, 4, 'bowl');
            }
        }
    },
    (ctx) => { // Rule 5: Same House
        if (ctx.isMatchStarLordRahuKetu) return;
        const ownedByMatchStar = getOwnedSigns(ctx.matchStarLord);
        const ownedByMatchRasi = getOwnedSigns(ctx.matchRasiLord);
        const pRasiPos = ctx.getP(ctx.playerRasiLord);
        const pStarPos = ctx.getP(ctx.playerStarLord);
        const pMoonPos = ctx.getP("Moon");

        if (pRasiPos && pStarPos && ownedByMatchStar.includes(pRasiPos.signId) && ownedByMatchStar.includes(pStarPos.signId)) {
            ctx.addRule('Rule 5: Same House (Star Lord)', 4, 'both', false, 'விதி 5: ஒரே ராசி (நட்சத்திர அதிபதி)');
            if (isExalted(ctx.playerRasiLord, pMoonPos.longitude) || isOwnSign(ctx.playerRasiLord, pMoonPos.longitude)) ctx.addRule('Rule 5: Bonus', 2);
        }
        if (pStarPos && ownedByMatchRasi.includes(pMoonPos.signId) && ownedByMatchRasi.includes(pStarPos.signId)) {
            ctx.setSureFlop('BAT Rule 5: Match Rasi Same House', 'பேட்டிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (Sure Flop)', 'bat');
            ctx.addRule('BOWL Rule 5: Same House (Rasi Lord)', 6, 'bowl', false, 'பவுலிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (+6)');
        }
    },
    (ctx) => { // Rule 6: Player Rasi Home
        if (ctx.isMatchStarLordRahuKetu) return;
        if (ctx.playerRasi && ctx.M[ctx.matchRasiLord] === ctx.playerRasi && ctx.M[ctx.matchStarLord] === ctx.playerRasi) {
            ctx.addRule('BAT Rule 6: Player Rasi Home', 6, 'bat', false, 'பேட்டிங் விதி 6: ராசி அதிபதி வீடு');
            ctx.addRule('BOWL Rule 6: Player Rasi Home', 4, 'bowl', false, 'பவுலிங் விதி 6: ராசி அதிபதி வீடு');
            ctx.applyBonuses(ctx.playerRasiLord, 4, 'bat');
        }
    },
    (ctx) => { // Rule 7: Rahu/Ketu
        if (['Rahu', 'Ketu'].includes(ctx.playerStarLord)) {
            if (getOwnedSigns(ctx.matchStarLord).includes(ctx.getP("Moon").signId)) {
                ctx.addRule('Rule 7: Rahu/Ketu Player', 4, 'both', false, 'விதி 7: ராகு/கேது விதி');
                ctx.applyBonuses(ctx.playerRasiLord, 4);
            }
        }
    },
    (ctx) => { // Rule 8: Lagna
        // Batting Lagna check
        if (ctx.matchLagnaLordBat && ctx.playerRasiLord && ctx.matchLagnaLordBat === ctx.playerRasiLord) {
            ctx.addRule('BAT Rule 8: Lagna', 2, 'bat', false, 'பேட்டிங் விதி 8: லக்ன விதி');

            const pos = ctx.playerPlanets[ctx.playerRasiLord.toLowerCase()];
            if (pos !== undefined) {
                if (isExalted(ctx.playerRasiLord, pos) || isOwnSign(ctx.playerRasiLord, pos)) {
                    ctx.addRule('BAT Rule 8: Strong Bonus', 4, 'bat', false, 'பேட்டிங் விதி 8: ஆட்சி/உச்சம் போனஸ்');
                } else if (isDebilitated(ctx.playerRasiLord, pos)) {
                    ctx.addRule('BAT Rule 8: Neecham Deduction', -2, 'bat', false, 'பேட்டிங் விதி 8: நீசம் குறைப்பு');
                }
            }
        }

        // Bowling Lagna check
        if (ctx.matchLagnaLordBowl && ctx.playerRasiLord && ctx.matchLagnaLordBowl === ctx.playerRasiLord) {
            ctx.addRule('BOWL Rule 8: Lagna', 6, 'bowl', false, 'பவுலிங் விதி 8: லக்ன விதி');

            const pos = ctx.playerPlanets[ctx.playerRasiLord.toLowerCase()];
            if (pos !== undefined) {
                if (isExalted(ctx.playerRasiLord, pos) || isOwnSign(ctx.playerRasiLord, pos)) {
                    ctx.addRule('BOWL Rule 8: Strong Bonus', 6, 'bowl', false, 'பவுலிங் விதி 8: ஆட்சி/உச்சம் போனஸ்');
                } else if (isDebilitated(ctx.playerRasiLord, pos)) {
                    ctx.addRule('BOWL Rule 8: Neecham Deduction', -2, 'bowl', false, 'பவுலிங் விதி 8: நீசம் குறைப்பு');
                }
            }

            const planetsInLagna = Object.keys(ctx.P).filter(p => ctx.P[p] === ctx.matchLagnaSignBowl);
            if (planetsInLagna.some(p => isExalted(p, ctx.playerPlanets[p.toLowerCase()]) || isOwnSign(p, ctx.playerPlanets[p.toLowerCase()]))) {
                ctx.addRule('BOWL Rule 8: Planet Bonus', 4, 'bowl', false, 'பவுலிங் விதி 8: லக்ன கிரக போனஸ்');
            }
        }
    },
    (ctx) => { // Rule 9: Double Lord Conjunction
        if (ctx.isMatchStarLordRahuKetu) return;
        const mRasiPos = ctx.P[ctx.matchRasiLord];
        const mStarPos = ctx.P[ctx.matchStarLord];
        if (mRasiPos && mStarPos && mRasiPos === mStarPos) {
            ctx.addRule('Rule 9: Double Lord Conjunction', 12, 'both', true, 'விதி 9: மேட்ச் ராசி & நட்சத்திர அதிபதி ஜாதகத்தில் சேர்க்கை (+12)');
        }
    }
];

/** Match Star Specific Rules **/
const NAKSHATRA_RULES = {
    'Ashwini': (ctx) => {
        const mars = ctx.playerPlanets['mars'];
        if (isExalted('Mars', mars)) ctx.addRule('Aswini: Mars Exalted', 8);
        else if (isDebilitated('Mars', mars)) ctx.addRule('Aswini: Mars Debilitated', -12);
        if (ctx.P['Mars'] === ctx.P['Venus']) ctx.addRule('Aswini: Mars + Venus Conjunction', 10);
    },
    'Aswini': (ctx) => NAKSHATRA_RULES['Ashwini'](ctx),
    'Bharani': (ctx) => {
        if (['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord)) {
            if (ctx.P['Venus'] === ctx.P['Mercury']) {
                ctx.setSureFlop('Bharani: Venus + Mercury Conjunction', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை', 'bat');
                ctx.addRule('Bharani: Venus + Mercury Conjunction (+12)', 12, 'bowl', true);
            }
        }
    },
    'Rohini': (ctx) => {
        if (isDebilitated('Moon', ctx.playerPlanets['moon'])) ctx.addRule('Rohini: Moon Debilitated', 8);
        if (['Shatabhisha', 'Sathayam'].includes(ctx.playerStar) && ctx.P['Saturn'] === ctx.P['Rahu']) ctx.addRule('Rohini: Sathayam & Saturn+Rahu', 12, 'both', true);
    },
    'Mrigashira': (ctx) => {
        if (ctx.playerRasiLord === 'Mars' || ctx.playerStarLord === 'Mars') {
            ctx.addRule('Mrigashira: Mars Lordship', 6);
            if (isOwnSign('Mars', ctx.playerPlanets['mars']) || isExalted('Mars', ctx.playerPlanets['mars'])) ctx.addRule('Strong Mars', 6);
        }
    },
    'Mrigashirsha': (ctx) => NAKSHATRA_RULES['Mrigashira'](ctx),
    'Ardra': (ctx) => {
        // Mars Rules (Applied to both Batting & Bowling)
        const marsPos = ctx.playerPlanets['mars'];
        if (marsPos !== undefined) {
            if (isDebilitated('Mars', marsPos)) {
                ctx.setSureFlop('Ardra: Mars Neecham', 'திருவாதிரை: செவ்வாய் நீசம்', 'both');
            } else if (isExalted('Mars', marsPos) || isOwnSign('Mars', marsPos)) {
                ctx.addRule('Ardra: Mars Aatchi/Ucham', 10, 'bowl', true, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
                ctx.addRule('Ardra: Mars Aatchi/Ucham', 0, 'bat', false, 'திருவாதிரை: செவ்வாய் ஆட்சி/உச்சம்');
            } else if (ctx.playerRasiLord === 'Mars' || ctx.playerStarLord === 'Mars') {
                ctx.addRule('Ardra: Mars Lord', 4, 'bowl', false, 'திருவாதிரை: செவ்வாய் அதிபதி');
                ctx.addRule('Ardra: Mars Lord', 0, 'bat', false, 'திருவாதிரை: செவ்வாய் அதிபதி');
            }
        }
    },
    'Thiruvathirai': (ctx) => NAKSHATRA_RULES['Ardra'](ctx),
    'Thiruvadhirai': (ctx) => NAKSHATRA_RULES['Ardra'](ctx),
    'Ashlesha': (ctx) => {
        if (['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord)) {
            if (ctx.P['Venus'] === ctx.P['Mercury']) {
                ctx.setSureFlop('Ayilyam: Venus + Mercury', 'ஆயில்யம்: சுக்கிரன் + புதன்', 'bat');
                ctx.addRule('Ayilyam: Venus + Mercury', 12, 'bowl', true);
            }
        }
    },
    'Ayilyam': (ctx) => NAKSHATRA_RULES['Ashlesha'](ctx),
    'Magha': (ctx) => {
        if (ctx.playerRasiLord === 'Mercury' && ctx.playerStarLord === 'Mars') ctx.addRule('Magam: Merc+Mars', 12, 'both', true);
    },
    'Magam': (ctx) => NAKSHATRA_RULES['Magha'](ctx),
    'Purva Phalguni': (ctx) => {
        if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Mars') ctx.addRule('Pooram: Sat+Mars', 12, 'bat', true);
        if (ctx.playerRasiLord === 'Jupiter' && ctx.playerStarLord === 'Mercury') ctx.addRule('Pooram: Jup+Merc', 12, 'bowl', true);
    },
    'Pooram': (ctx) => NAKSHATRA_RULES['Purva Phalguni'](ctx),
    'Uttara Phalguni': (ctx) => {
        if (ctx.matchChart.moon.signId === 6 && ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Rahu') ctx.addRule('Uthiram: Sat+Rahu', 12, 'both', true);
    },
    'Uthiram': (ctx) => NAKSHATRA_RULES['Uttara Phalguni'](ctx),
    'Chitra': (ctx) => {
        if (ctx.matchChart.moon.signId === 6) {
            if (ctx.playerRasiLord === 'Mercury' && ctx.P['Mercury'] === ctx.P['Sun']) {
                if (ctx.P['Mercury'] === ctx.P['Venus'] && ctx.P['Mercury'] === ctx.P['Jupiter']) ctx.addRule('Chithirai: Sun+Merc+Ven+Jup', 12);
                else if (ctx.P['Mercury'] === ctx.P['Jupiter']) ctx.addRule('Chithirai: Sun+Merc+Jup', 8);
                else ctx.addRule('Chithirai: Sun+Merc', 6);
            }
        } else if (ctx.matchChart.moon.signId === 7) {
            if (ctx.playerRasiLord === 'Moon' && ctx.playerStarLord === 'Saturn') ctx.addRule('Chithirai: Moon+Sat', 12, 'both', true);
        }
    },
    'Chithirai': (ctx) => NAKSHATRA_RULES['Chitra'](ctx),
    'Anuradha': (ctx) => {
        if (ctx.playerRasiLord === 'Jupiter') {
            ctx.addRule('Anusham: Jupiter', 5);
            if (isOwnSign('Jupiter', ctx.playerPlanets['jupiter']) || isExalted('Jupiter', ctx.playerPlanets['jupiter'])) ctx.addRule('Strong Jup', 10);
        }
    },
    'Anusham': (ctx) => NAKSHATRA_RULES['Anuradha'](ctx),
    'Jyeshtha': (ctx) => {
        if (['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord)) {
            if (ctx.P['Venus'] === ctx.P['Mercury']) {
                ctx.setSureFlop('Kettai: Venus + Mercury', 'கேட்டை: சுக்கிரன் + புதன்', 'bat');
                ctx.addRule('Kettai: Venus + Mercury', 12, 'bowl', true);
            }
        }
    },
    'Kettai': (ctx) => NAKSHATRA_RULES['Jyeshtha'](ctx),
    'Mula': (ctx) => {
        if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Mars') ctx.addRule('Moolam: Sat+Mars', 12, 'bat', true);
        else if (ctx.playerRasiLord === 'Mars' && ctx.playerStarLord === 'Saturn') ctx.addRule('Moolam: Mars+Sat', 12, 'bowl', true);
        else if (ctx.playerRasiLord === 'Mars') {
            ctx.addRule('Moolam: Mars Bat', 0, 'bat');
            ctx.addRule('Moolam: Mars Bowl', 4, 'bowl', true);
            if (isOwnSign('Mars', ctx.playerPlanets['mars']) || isExalted('Mars', ctx.playerPlanets['mars'])) ctx.addRule('Strong Mars', 6, 'bowl', true);
        }
    },
    'Moolam': (ctx) => NAKSHATRA_RULES['Mula'](ctx),
    'Purva Ashadha': (ctx) => {
        if (['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord)) {
            if (ctx.P['Venus'] === ctx.P['Mercury']) {
                ctx.setSureFlop('Pooradam: Venus + Mercury', 'பூராடம்: சுக்கிரன் + புதன்', 'bat');
                ctx.addRule('Pooradam: Venus + Mercury', 12, 'bowl', true);
            }
        }
    },
    'Pooradam': (ctx) => NAKSHATRA_RULES['Purva Ashadha'](ctx),
    'Uttara Ashadha': (ctx) => {
        if (ctx.matchChart.moon.signId === 10 && ctx.playerRasiLord === 'Moon') ctx.addRule('Uthiradam: Moon', 12, 'both', true);
    },
    'Uthiradam': (ctx) => NAKSHATRA_RULES['Uttara Ashadha'](ctx),
    'Shravana': (ctx) => {
        if (ctx.playerRasiLord === 'Mars' && ctx.getP("Mars").signId === 4) ctx.addRule('Thiruvonam: Mars in Cancer', 6, 'bowl');
        if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Rahu') ctx.addRule('Thiruvonam: Sat+Rahu', 12, 'both', true);
    },
    'Thiruvonam': (ctx) => NAKSHATRA_RULES['Shravana'](ctx),
    'Dhanishta': (ctx) => {
        if (ctx.matchChart.moon.signId === 10 && ctx.playerRasiLord === 'Saturn') ctx.addRule('Avittam: Sat', 4);
    },
    'Avittam': (ctx) => NAKSHATRA_RULES['Dhanishta'](ctx),
    'Shatabhisha': (ctx) => {
        const moon = ctx.getP("Moon");
        if (ctx.P['Moon'] === ctx.P['Jupiter'] && moon.signId === 4) ctx.setSureFlop('Sathayam: Moon+Jup in Cancer');
        else if (ctx.playerRasiLord === 'Moon') ctx.addRule('Sathayam: Moon Lord', 12, 'both', true);
    },
    'Sathayam': (ctx) => NAKSHATRA_RULES['Shatabhisha'](ctx)
};

const evaluatePrediction = (playerBirthChart, matchParams) => {
    const ctx = new RuleContext(playerBirthChart, matchParams);
    GENERAL_RULES.forEach(rule => rule(ctx));
    const nakRule = NAKSHATRA_RULES[ctx.matchStar];
    if (nakRule) nakRule(ctx);


    if (ctx.sureFlopBat) { ctx.batting.score = 0; ctx.batting.status = "SURE FLOP"; }
    if (ctx.sureFlopBowl) { ctx.bowling.score = 0; ctx.bowling.status = "SURE FLOP"; }

    return {
        batting: ctx.batting,
        bowling: ctx.bowling,
        netScore: ctx.batting.score + ctx.bowling.score,
        matchStar: ctx.matchStar,
        matchStarLord: ctx.matchStarLord,
        matchRasiLord: ctx.matchRasiLord,
        isMatchStarLordRahuKetu: ctx.isMatchStarLordRahuKetu
    };
};

module.exports = { evaluatePrediction };
