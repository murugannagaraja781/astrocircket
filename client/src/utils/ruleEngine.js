/**
 * === RULE ENGINE FOR ASTRO CRICKET PREDICTION (REFACTORED) ===
 * Declarative Rule Engine Structure
 */

// Exalted Signs
const EXALTED_SIGNS = {
    'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn',
    'Mercury': 'Virgo', 'Jupiter': 'Cancer', 'Venus': 'Pisces',
    'Saturn': 'Libra', 'Rahu': 'Taurus', 'Ketu': 'Scorpio'
};

// Debilitated Signs
const DEBILITATED_SIGNS = {
    'Sun': 'Libra', 'Moon': 'Scorpio', 'Mars': 'Cancer',
    'Mercury': 'Pisces', 'Jupiter': 'Capricorn', 'Venus': 'Virgo',
    'Saturn': 'Aries', 'Rahu': 'Scorpio', 'Ketu': 'Taurus'
};

// Own Signs
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

/** Utility Functions **/
function getDignity(planetName, signName) {
    if (!planetName || !signName) return 'Neutral';
    if (EXALTED_SIGNS[planetName] === signName) return 'Exalted';
    if (DEBILITATED_SIGNS[planetName] === signName) return 'Debilitated';
    if (OWN_SIGNS[planetName]?.includes(signName)) return 'Own Sign';
    return 'Neutral';
}

const isExalted = (p, s) => getDignity(p, s) === 'Exalted';
const isOwnSign = (p, s) => getDignity(p, s) === 'Own Sign';
const isDebilitated = (p, s) => getDignity(p, s) === 'Debilitated';
const isSignInList = (sign, list) => sign && list.includes(sign);

class RuleContext {
    constructor(player, match, transit) {
        this.player = player;
        this.match = match;
        this.transit = transit;

        this.batting = { score: 0, logs: [], isSpecial: false, status: 'Active', matchedLagnas: [] };
        this.bowling = { score: 0, logs: [], isSpecial: false, status: 'Active', matchedLagnas: [] };

        this.P = player.planetPositions || {};
        this.M = transit.planetPositions || {};

        this.playerRasiLord = player.rashiLord;
        this.playerStarLord = player.nakshatraLord;
        this.playerStar = player.nakshatra;
        this.playerRasi = player.rashi;

        this.matchStar = match.nakshatra;
        this.matchRasi = match.rashi;
        this.matchRasiLord = match.rashiLord;
        this.matchStarLord = match.nakshatraLord;

        // Dynamic Lagna Logic for Client
        this.matchLagnaSignBowl = transit.ascendantSign;
        this.matchLagnaLordBowl = transit.ascendantLord;

        // Store Dynamic Lagnas from params or default to single
        this.matchLagnas = transit.matchLagnas || [
            { lagna: transit.ascendantSign, lord: transit.ascendantLord, isMain: true }
        ];

        // Use phase-specific Lagnas if available (passed in via transit or match)
        this.matchLagnaSignBat = transit.battingLagnaSign || this.matchLagnaSignBowl;
        this.matchLagnaLordBat = transit.battingLagnaLord || this.matchLagnaLordBowl;

        if (transit.bowlingLagnaSign) this.matchLagnaSignBowl = transit.bowlingLagnaSign;
        if (transit.bowlingLagnaLord) this.matchLagnaLordBowl = transit.bowlingLagnaLord;

        // Overrides
        const originalMatchStarLord = match.nakshatraLord;
        this.isMatchStarLordRahuKetu = (originalMatchStarLord === 'Rahu' || originalMatchStarLord === 'Ketu');

        if (this.matchStarLord === 'Rahu' || this.matchStarLord === 'Ketu') {
            this.matchStarLord = this.matchRasiLord;
            if (['Magha', 'Magam', 'Ashwini', 'Aswini'].includes(this.matchStar)) this.matchStarLord = 'Mars';
        }
        if (this.playerStarLord === 'Rahu' || this.playerStarLord === 'Ketu') {
            this.playerStarLord = this.playerRasiLord;
        }

        this.sureFlopBat = false;
        this.sureFlopBowl = false;
    }

    addRule(name, score, type = 'both', isSpecial = false, nameTamil = '') {
        const ruleText = `${name} (${score > 0 ? '+' : ''}${score})`;
        const logEntry = { en: ruleText, ta: nameTamil ? `${nameTamil} (${score > 0 ? '+' : ''}${score})` : ruleText };

        if (type === 'both' || type === 'bat') {
            this.batting.score += score;
            this.batting.logs.push(logEntry);
            if (isSpecial) this.batting.isSpecial = true;
        }
        if (type === 'both' || type === 'bowl') {
            this.bowling.score += score;
            this.bowling.logs.push(logEntry);
            if (isSpecial) this.bowling.isSpecial = true;
        }
    }

    applyBonuses(planet, score, type = 'both') {
        if (isExalted(planet, this.P[planet]) || isOwnSign(planet, this.P[planet])) {
            this.addRule(`${planet} Aatchi/Ucham Bonus`, score, type);
        }
    }

    setSureFlop(name, nameTamil = '', type = 'both') {
        if (type === 'both' || type === 'bat') this.sureFlopBat = true;
        if (type === 'both' || type === 'bowl') this.sureFlopBowl = true;
        this.addRule(name, 0, type, true, nameTamil);
    }
}

/** General Rules Index (Redex Method) **/
const GENERAL_RULES = [
    // Rule 1: Zig-Zag
    (ctx) => {
        if (ctx.isMatchStarLordRahuKetu) return;
        if (ctx.matchRasiLord === ctx.playerStarLord && ctx.matchStarLord === ctx.playerRasiLord) {
            ctx.addRule('BAT Rule 1: Zig-Zag', 12, 'bat', false, 'பேட்டிங் விதி 1: ஜிக்-ஜாக்');
            ctx.addRule('BOWL Rule 1: Zig-Zag', 12, 'bowl', false, 'பவுலிங் விதி 1: ஜிக்-ஜாக்');
            ctx.applyBonuses(ctx.playerRasiLord, 4);
        }
    },
    // Rule 2: Direct
    (ctx) => {
        if (ctx.matchRasiLord === ctx.playerRasiLord && ctx.matchStarLord === ctx.playerStarLord) {
            ctx.addRule('BAT Rule 2: Direct', 6, 'bat', false, 'பேட்டிங் விதி 2: நேரடி விதி');
            ctx.applyBonuses(ctx.playerRasiLord, 4, 'bat');
            ctx.setSureFlop('BOWL Rule 2: Same Rasi & Star', 'பவுலிங் விதி 2: ஒரே ராசி & நட்சத்திரம்', 'bowl');
        }
    },
    // Rule 3: Star
    (ctx) => {
        if (ctx.matchStarLord === ctx.playerRasiLord || ctx.matchStarLord === ctx.playerStarLord) {
            ctx.addRule('BAT Rule 3: Star', 4, 'bat', false, 'பேட்டிங் விதி 3: நட்சத்திர விதி');
            ctx.applyBonuses(ctx.matchStarLord, 4, 'bat');
            ctx.addRule('BOWL Rule 3: Star', 3, 'bowl', false, 'பவுலிங் விதி 3: நட்சத்திர விதி');
            if (isExalted(ctx.matchStarLord, ctx.P[ctx.matchStarLord]) || isOwnSign(ctx.matchStarLord, ctx.P[ctx.matchStarLord])) {
                ctx.addRule('BOWL Rule 3: Bonus', 6, 'bowl', false, 'பவுலிங் விதி 3: போனஸ்');
            }
        }
    },
    // Rule 4: Conjunction
    (ctx) => {
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

                // Dynamic Lagna Bonus Check
                ctx.matchLagnas.forEach(lagna => {
                    if (lagna.lagna === mStarLordPos) {
                        const startTime = new Date(lagna.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const endTime = new Date(lagna.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        ctx.addRule(`Lagna Match Bonus (${lagna.lagna} [${startTime} - ${endTime}])`, 2, 'bat');
                        ctx.addRule(`Lagna Match Bonus (${lagna.lagna} [${startTime} - ${endTime}])`, 2, 'bowl');
                    }
                });
            } else if (pStarLordPos && mStarLordPos === pStarLordPos) {
                ctx.addRule('BAT Rule 4: Conjunction (Star Lord)', 4, 'bat', false, 'பேட்டிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
                ctx.addRule('BOWL Rule 4: Conjunction Star (Star Lord)', 4, 'bowl', false, 'பவுலிங் விதி 4: சேர்க்கை விதி (நட்சத்திர அதிபதி)');
                ctx.applyBonuses(ctx.playerStarLord, 4);
                if (ctx.matchLagnaSignBat === mStarLordPos) ctx.addRule('Lagna Match Bonus', 2, 'bat');
                if (ctx.matchLagnaSignBowl === mStarLordPos) ctx.addRule('Lagna Match Bonus', 2, 'bowl');

                // Dynamic Lagna Bonus Check
                ctx.matchLagnas.forEach(lagna => {
                    if (lagna.lagna === mStarLordPos) {
                        const startTime = new Date(lagna.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const endTime = new Date(lagna.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        ctx.addRule(`Lagna Match Bonus (${lagna.lagna} [${startTime} - ${endTime}])`, 2, 'bat');
                        ctx.addRule(`Lagna Match Bonus (${lagna.lagna} [${startTime} - ${endTime}])`, 2, 'bowl');
                    }
                });
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
    // Rule 5: Same House
    (ctx) => {
        if (ctx.isMatchStarLordRahuKetu) return;
        const ownedByMatchStar = OWN_SIGNS[ctx.matchStarLord] || [];
        const ownedByMatchRasi = OWN_SIGNS[ctx.matchRasiLord] || [];
        const pRasiLordPos = ctx.P[ctx.playerRasiLord];
        const pStarLordPos = ctx.P[ctx.playerStarLord];

        if (isSignInList(pRasiLordPos, ownedByMatchStar) && isSignInList(pStarLordPos, ownedByMatchStar)) {
            ctx.addRule('Rule 5: Same House (Star Lord)', 4, 'both', false, 'விதி 5: ஒரே ராசி (நட்சத்திர அதிபதி)');
            if (isExalted(ctx.playerRasiLord, ctx.playerRasi) || isOwnSign(ctx.playerRasiLord, ctx.playerRasi)) ctx.addRule('Rule 5: Bonus', 2);
        }
        if (isSignInList(pRasiLordPos, ownedByMatchRasi) && isSignInList(pStarLordPos, ownedByMatchRasi)) {
            ctx.setSureFlop('BAT Rule 5: Match Rasi Same House', 'பேட்டிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (Sure Flop)', 'bat');
            ctx.addRule('BOWL Rule 5: Same House (Rasi Lord)', 6, 'bowl', false, 'பவுலிங் விதி 5: மேட்ச் ராசி அதிபதி வீட்டில் ஒரே ராசி (+6)');
        }
    },
    // Rule 6: Player Rasi Home
    (ctx) => {
        if (ctx.isMatchStarLordRahuKetu) return;

        // 1. Simple Version: Match Rasi matches Player's Rasi
        if (ctx.matchRasi && ctx.playerRasi && ctx.matchRasi === ctx.playerRasi) {
            ctx.addRule('BAT Rule 6: Match Rasi Home', 4, 'bat', false, 'பேட்டிங் விதி 6: மேட்ச் ராசி ஒற்றுமை');
            ctx.addRule('BOWL Rule 6: Match Rasi Home', 2, 'bowl', false, 'பவுலிங் விதி 6: மேட்ச் ராசி ஒற்றுமை');
        }

        // 2. Strict Version: Match planets are in Player's Rasi
        if (ctx.playerRasi && ctx.M[ctx.matchRasiLord] === ctx.playerRasi && ctx.M[ctx.matchStarLord] === ctx.playerRasi) {
            ctx.addRule('BAT Rule 6: Player Rasi Home (Strict)', 6, 'bat', false, 'பேட்டிங் விதி 6: ராசி அதிபதி வீடு (அதிதீவிரம்)');
            ctx.addRule('BOWL Rule 6: Player Rasi Home (Strict)', 4, 'bowl', false, 'பவுலிங் விதி 6: ராசி அதிபதி வீடு (அதிதீவிரம்)');
            ctx.applyBonuses(ctx.playerRasiLord, 4, 'bat');
        }
    },
    // Rule 7: Rahu/Ketu
    (ctx) => {
        if (['Rahu', 'Ketu'].includes(ctx.playerStarLord)) {
            const matchStarSigns = OWN_SIGNS[ctx.matchStarLord] || [];
            if (matchStarSigns.includes(ctx.playerRasi)) {
                ctx.addRule('Rule 7: Rahu/Ketu Player', 4, 'both', false, 'விதி 7: ராகு/கேது விதி');
                ctx.applyBonuses(ctx.playerRasiLord, 4);
            }
        }
    },
    // Rule 8: Lagna (Dynamic)
    (ctx) => {
        if (!ctx.playerRasiLord) return;

        // Iterate through all active Lagnas in the match timeline
        const processedLignasBat = new Set();
        const processedLignasBowl = new Set();

        ctx.matchLagnas.forEach((lagnaObj, index) => {
            const lagnaLord = lagnaObj.lord;
            const lagnaName = lagnaObj.lagna;
            const startTime = new Date(lagnaObj.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(lagnaObj.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timeRange = `${startTime} - ${endTime}`;

            // Batting Lagna Check
            if (lagnaLord === ctx.playerRasiLord) {
                ctx.batting.matchedLagnas.push(index + 1);
            }
            if (lagnaLord === ctx.playerRasiLord && !processedLignasBat.has(lagnaName)) {
                processedLignasBat.add(lagnaName); // Avoid double counting same lagna name if multiple segments
                const suffix = ctx.matchLagnas.length > 1 ? ` (${lagnaName} [${timeRange}])` : '';
                ctx.addRule(`BAT Rule 8: Lagna${suffix}`, 2, 'bat', false, `பேட்டிங் விதி 8: லக்ன விதி${suffix}`);

                // Bonuses / Deductions
                const sign = ctx.P[ctx.playerRasiLord];
                if (isExalted(ctx.playerRasiLord, sign) || isOwnSign(ctx.playerRasiLord, sign)) {
                    ctx.addRule(`BAT Rule 8: Strong Bonus${suffix}`, 4, 'bat', false, `பேட்டிங் விதி 8: ஆட்சி/உச்சம் போனஸ்${suffix}`);
                } else if (isDebilitated(ctx.playerRasiLord, sign)) {
                    ctx.addRule(`BAT Rule 8: Neecham Deduction${suffix}`, -2, 'bat', false, `பேட்டிங் விதி 8: நீசம் குறைப்பு${suffix}`);
                }
            }

            // Bowling Lagna Check
            if (lagnaLord === ctx.playerRasiLord) {
                ctx.bowling.matchedLagnas.push(index + 1);
            }
            if (lagnaLord === ctx.playerRasiLord && !processedLignasBowl.has(lagnaName)) {
                processedLignasBowl.add(lagnaName);
                const suffix = ctx.matchLagnas.length > 1 ? ` (${lagnaName} [${timeRange}])` : '';
                ctx.addRule(`BOWL Rule 8: Lagna${suffix}`, 6, 'bowl', false, `பவுலிங் விதி 8: லக்ன விதி${suffix}`);

                // Bonuses / Deductions
                const sign = ctx.P[ctx.playerRasiLord];
                if (isExalted(ctx.playerRasiLord, sign) || isOwnSign(ctx.playerRasiLord, sign)) {
                    ctx.addRule(`BOWL Rule 8: Strong Bonus${suffix}`, 6, 'bowl', false, `பவுலிங் விதி 8: ஆட்சி/உச்சம் போனஸ்${suffix}`);
                } else if (isDebilitated(ctx.playerRasiLord, sign)) {
                    ctx.addRule(`BOWL Rule 8: Neecham Deduction${suffix}`, -2, 'bowl', false, `பவுலிங் விதி 8: நீசம் குறைப்பு${suffix}`);
                }

                const planetsInLagna = Object.keys(ctx.P).filter(p => ctx.P[p] === lagnaName);
                if (planetsInLagna.some(p => isExalted(p, ctx.P[p]) || isOwnSign(p, ctx.P[p]))) {
                    ctx.addRule(`BOWL Rule 8: Planet Bonus${suffix}`, 4, 'bowl', false, `பவுலிங் விதி 8: லக்ன கிரக போனஸ்${suffix}`);
                }
            }
        });
    },
    // Rule 9: Double Lord Conjunction
    (ctx) => {
        if (ctx.isMatchStarLordRahuKetu) return;
        const mRasiPos = ctx.P[ctx.matchRasiLord];
        const mStarPos = ctx.P[ctx.matchStarLord];

        if (mRasiPos && mStarPos && mRasiPos === mStarPos) {
            ctx.addRule('Rule 9: Double Lord Conjunction', 12, 'both', true, 'விதி 9: மேட்ச் ராசி & நட்சத்திர அதிபதி ஜாதகத்தில் சேர்க்கை');
        }
    }
];

/** Match Star Specific Rules **/
const NAKSHATRA_RULES = {
    'Ashwini': (ctx) => {
        if (isExalted('Mars', ctx.P['Mars'])) ctx.addRule('Aswini: Mars Exalted', 8, 'both', false, 'அசுவினி: செவ்வாய் உச்சம்');
        else if (getDignity('Mars', ctx.P['Mars']) === 'Debilitated') ctx.addRule('Aswini: Mars Debilitated', -12, 'both', false, 'அசுவினி: செவ்வாய் நீசம்');
        if (ctx.P['Mars'] && ctx.P['Venus'] && ctx.P['Mars'] === ctx.P['Venus']) ctx.addRule('Aswini: Mars + Venus Conjunction', 10, 'both', false, 'அசுவினி: செவ்வாய் + சுக்கிரன் சேர்க்கை');
    },
    'Aswini': (ctx) => NAKSHATRA_RULES['Ashwini'](ctx),
    'Bharani': (ctx) => {
        const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord);
        if (isVenusOrMercuryLord && ctx.P['Venus'] && ctx.P['Mercury'] && ctx.P['Venus'] === ctx.P['Mercury']) {
            ctx.setSureFlop('Bharani: Venus + Mercury Conjunction (Batting Sure Flop)', 'பரணி: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
            ctx.addRule('Bharani: Venus + Mercury Conjunction (+12)', 12, 'bowl', true, 'பரணி: சுக்கிரன் + புதன் சேர்க்கை (+12)');
        }
    },
    'Rohini': (ctx) => {
        if (getDignity('Moon', ctx.P['Moon']) === 'Debilitated') ctx.addRule('Rohini: Moon Debilitated', 8, 'both', false, 'ரோகிணி: சந்திரன் நீசம்');
        if (['Shatabhisha', 'Sathayam'].includes(ctx.playerStar) && ctx.P['Saturn'] && ctx.P['Rahu'] && ctx.P['Saturn'] === ctx.P['Rahu']) {
            ctx.addRule('Rohini: Player Sathayam & Saturn+Rahu Conjunction', 12, 'both', true, 'ரோகிணி: சதயம் நட்சத்திரம் & சனி+ராகு சேர்க்கை');
        }
    },
    'Mrigashira': (ctx) => {
        if (ctx.playerRasiLord === 'Mars' || ctx.playerStarLord === 'Mars') {
            ctx.addRule('Mrigashira: Mars Lordship', 6, 'both', false, 'மிருகசீரிஷம்: செவ்வாய் ஆதிக்கம்');
            if (isOwnSign('Mars', ctx.P['Mars']) || isExalted('Mars', ctx.P['Mars'])) ctx.addRule('Mrigashira: Mars Strong Bonus', 6);
        }
    },
    'Mrigashirsha': (ctx) => NAKSHATRA_RULES['Mrigashira'](ctx),
    'Ardra': (ctx) => {
        const marsPos = ctx.P['Mars'];
        if (marsPos) {
            const dignity = getDignity('Mars', marsPos);
            if (dignity === 'Debilitated') {
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
        const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord);
        if (isVenusOrMercuryLord && ctx.P['Venus'] && ctx.P['Mercury'] && ctx.P['Venus'] === ctx.P['Mercury']) {
            ctx.setSureFlop('Ayilyam: Venus + Mercury Conjunction (Batting Sure Flop)', 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
            ctx.addRule('Ayilyam: Venus + Mercury Conjunction (+12)', 12, 'bowl', true, 'ஆயில்யம்: சுக்கிரன் + புதன் சேர்க்கை (+12)');
        }
    },
    'Ayilyam': (ctx) => NAKSHATRA_RULES['Ashlesha'](ctx),
    'Magha': (ctx) => {
        if (ctx.playerRasiLord === 'Mercury' && ctx.playerStarLord === 'Mars') ctx.addRule('Magam: Rasi Lord Mercury & Star Lord Mars', 12, 'both', true, 'மகம்: ராசி அதிபதி புதன் & நட்சத்திர அதிபதி செவ்வாய் (+12)');
    },
    'Magam': (ctx) => NAKSHATRA_RULES['Magha'](ctx),
    'Purva Phalguni': (ctx) => {
        if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Mars') ctx.addRule('Pooram: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true, 'பூரம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய்');
        if (ctx.playerRasiLord === 'Jupiter' && ctx.playerStarLord === 'Mercury') ctx.addRule('Pooram: Rasi Lord Jupiter & Star Lord Mercury', 12, 'bowl', true, 'பூரம்: ராசி அதிபதி குரு & நட்சத்திர அதிபதி புதன்');
    },
    'Pooram': (ctx) => NAKSHATRA_RULES['Purva Phalguni'](ctx),
    'Uttara Phalguni': (ctx) => {
        if (['Virgo', 'Kanya'].includes(ctx.M['Moon'])) {
            if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Rahu') ctx.addRule('Uthiram (Kanya): Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true, 'உத்திரம் (கன்னி): ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு');
        }
    },
    'Uthiram': (ctx) => NAKSHATRA_RULES['Uttara Phalguni'](ctx),
    'Chitra': (ctx) => {
        const moonPos = ctx.M['Moon'];
        if (['Virgo', 'Kanya'].includes(moonPos)) {
            if (ctx.playerRasiLord === 'Mercury' && ctx.P['Mercury'] && ctx.P['Sun'] && ctx.P['Mercury'] === ctx.P['Sun']) {
                if (ctx.P['Venus'] === ctx.P['Mercury'] && ctx.P['Jupiter'] === ctx.P['Mercury']) ctx.addRule('Chithirai (Virgo): Merc+Sun+Ven+Jup', 12);
                else if (ctx.P['Jupiter'] === ctx.P['Mercury']) ctx.addRule('Chithirai (Virgo): Merc+Sun+Jup', 8);
                else ctx.addRule('Chithirai (Virgo): Merc+Sun', 6);
            }
        } else if (['Libra', 'Thula'].includes(moonPos)) {
            if (ctx.playerRasiLord === 'Moon' && ctx.playerStarLord === 'Saturn') ctx.addRule('Chithirai (Libra): Rasi Lord Moon & Star Lord Saturn', 12, 'both', true, 'சித்திரை (துலாம்): ராசி அதிபதி சந்திரன் & நட்சத்திர அதிபதி சனி');
        }
    },
    'Chithirai': (ctx) => NAKSHATRA_RULES['Chitra'](ctx),
    'Anuradha': (ctx) => {
        if (ctx.playerRasiLord === 'Jupiter') {
            ctx.addRule('Anusham: Rasi Lord Jupiter', 5);
            if (isOwnSign('Jupiter', ctx.P['Jupiter']) || isExalted('Jupiter', ctx.P['Jupiter'])) ctx.addRule('Anusham: Jupiter Own/Exalted', 10);
        }
    },
    'Anusham': (ctx) => NAKSHATRA_RULES['Anuradha'](ctx),
    'Jyeshtha': (ctx) => {
        const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord);
        if (isVenusOrMercuryLord && ctx.P['Mercury'] && ctx.P['Venus'] && ctx.P['Mercury'] === ctx.P['Venus']) {
            ctx.setSureFlop('Kettai: Mercury + Venus Conjunction (Batting Sure Flop)', 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
            ctx.addRule('Kettai: Mercury + Venus Conjunction (+12)', 12, 'bowl', true, 'கேட்டை: புதன் + சுக்கிரன் சேர்க்கை (+12)');
        }
    },
    'Kettai': (ctx) => NAKSHATRA_RULES['Jyeshtha'](ctx),
    'Mula': (ctx) => {
        if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Mars') ctx.addRule('Moolam: Rasi Lord Saturn & Star Lord Mars', 12, 'bat', true, 'மூலம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி செவ்வாய்');
        else if (ctx.playerRasiLord === 'Mars' && ctx.playerStarLord === 'Saturn') ctx.addRule('Moolam: Rasi Lord Mars & Star Lord Saturn', 12, 'bowl', true, 'மூலம்: ராசி அதிபதி செவ்வாய் & நட்சத்திர அதிபதி சனி');
        else if (ctx.playerRasiLord === 'Mars') {
            ctx.addRule('Moolam: Rasi Lord Mars (Batting 0)', 0, 'bat');
            ctx.addRule('Moolam: Rasi Lord Mars (Bowling) (+4)', 4, 'bowl', true);
            if (isOwnSign('Mars', ctx.P['Mars']) || isExalted('Mars', ctx.P['Mars'])) ctx.addRule('Moolam: Mars Ucham/Aatchi Bonus (+6)', 6, 'bowl', true);
        }
    },
    'Moolam': (ctx) => NAKSHATRA_RULES['Mula'](ctx),
    'Purva Ashadha': (ctx) => {
        const isVenusOrMercuryLord = ['Venus', 'Mercury'].includes(ctx.playerRasiLord) || ['Venus', 'Mercury'].includes(ctx.playerStarLord);
        if (isVenusOrMercuryLord && ctx.P['Venus'] && ctx.P['Mercury'] && ctx.P['Venus'] === ctx.P['Mercury']) {
            ctx.setSureFlop('Pooradam: Venus + Mercury Conjunction (Batting Sure Flop)', 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (பேட்டிங் வீழ்ச்சி)', 'bat');
            ctx.addRule('Pooradam: Venus + Mercury Conjunction (+12)', 12, 'bowl', true, 'பூராடம்: சுக்கிரன் + புதன் சேர்க்கை (+12)');
        }
    },
    'Pooradam': (ctx) => NAKSHATRA_RULES['Purva Ashadha'](ctx),
    'Uttara Ashadha': (ctx) => {
        if (['Capricorn', 'Makara'].includes(ctx.M['Moon'])) {
            if (ctx.playerRasiLord === 'Moon') ctx.addRule('Uthiradam (Makara): Rasi Lord Moon', 12, 'both', true, 'உத்திராடம் (மகரம்): ராசி அதிபதி சந்திரன்');
        }
    },
    'Uthiradam': (ctx) => NAKSHATRA_RULES['Uttara Ashadha'](ctx),
    'Shravana': (ctx) => {
        if (ctx.playerRasiLord === 'Mars' && ctx.P['Mars'] === 'Cancer') ctx.addRule('Thiruvonam: Mars in Moon House (Bowling)', 6, 'bowl');
        if (ctx.playerRasiLord === 'Saturn' && ctx.playerStarLord === 'Rahu') ctx.addRule('Thiruvonam: Rasi Lord Saturn & Star Lord Rahu', 12, 'both', true, 'திருவோணம்: ராசி அதிபதி சனி & நட்சத்திர அதிபதி ராகு');
    },
    'Thiruvonam': (ctx) => NAKSHATRA_RULES['Shravana'](ctx),
    'Dhanishta': (ctx) => {
        if (['Capricorn', 'Makara'].includes(ctx.M['Moon']) && ctx.playerRasiLord === 'Saturn') ctx.addRule('Avittam (Capricorn): Rasi Lord Saturn', 4);
    },
    'Avittam': (ctx) => NAKSHATRA_RULES['Dhanishta'](ctx),
    'Shatabhisha': (ctx) => {
        if (ctx.P['Moon'] && ctx.P['Jupiter'] && ctx.P['Moon'] === ctx.P['Jupiter'] && ctx.P['Moon'] === 'Cancer') {
            ctx.setSureFlop('Sathayam: Moon + Jupiter in Cancer (Sure Flop)', 'சதயம்: சந்திரன் + குரு கடகத்தில் சேர்க்கை (Sure Flop)');
        } else if (ctx.playerRasiLord === 'Moon') {
            ctx.addRule('Sathayam: Rasi Lord Moon (+12)', 12, 'both', true, 'சதயம்: ராசி அதிபதி சந்திரன் (+12)');
        }
    },
    'Sathayam': (ctx) => NAKSHATRA_RULES['Shatabhisha'](ctx)
};

/** Main Function **/
export function getPrediction(player, match, transit) {
    const ctx = new RuleContext(player, match, transit);

    // Execute General Rules
    GENERAL_RULES.forEach(rule => rule(ctx));

    // Execute Nakshatra Specific Rules
    const nakRule = NAKSHATRA_RULES[ctx.matchStar];
    if (nakRule) nakRule(ctx);

    // Handle Sure Flops
    if (ctx.sureFlopBat) { ctx.batting.score = 0; ctx.batting.status = 'SURE FLOP'; }
    if (ctx.sureFlopBowl) { ctx.bowling.score = 0; ctx.bowling.status = 'SURE FLOP'; }

    return { batting: ctx.batting, bowling: ctx.bowling };
}

export function evaluateBatsman(player, match, transit = {}) {
    const { batting } = getPrediction(player, match, transit);

    // Role Check: If Bowler, Batting 0
    if (player.role === 'Bowler') {
        batting.score = 0;
        batting.logs.push({ en: "Player is a Bowler (Batting 0)", ta: "இவர் ஒரு பந்துவீச்சாளர்" });
        batting.status = 'FLOP';
    }

    return batting; // { score, logs, isSpecial }
}

export function evaluateBowler(player, match, transit = {}) {
    const { bowling } = getPrediction(player, match, transit);

    // Role Check: If Batsman/WK-Batsman, Bowling 0
    if (player.role === 'Batsman' || player.role === 'WK-Batsman') {
        bowling.score = 0;
        bowling.logs.push({ en: "Player is a Batsman (Bowling 0)", ta: "இவர் ஒரு பேட்ஸ்மேன்" });
        bowling.status = 'FLOP';
    }

    return bowling; // { score, logs, isSpecial }
}
