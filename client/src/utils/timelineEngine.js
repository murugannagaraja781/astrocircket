// timelineEngine.js
// Computes 4-hour dynamic momentum wave & innings breakdown for T20 cricket

import { runPrediction } from './predictionAdapter';

/**
 * Format minutes offset from start time into readable 12-hr time (e.g. 7:30 PM, 8:15 PM)
 */
export const formatTimeOffset = (startTimeStr, offsetMinutes) => {
    if (!startTimeStr) return '';
    const [hStr, mStr] = startTimeStr.split(':');
    const startHour = parseInt(hStr, 10) || 19;
    const startMin = parseInt(mStr, 10) || 30;

    const totalMins = startHour * 60 + startMin + offsetMinutes;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;

    const period = endH >= 12 ? 'PM' : 'AM';
    const displayH = endH % 12 === 0 ? 12 : endH % 12;
    const displayM = endM.toString().padStart(2, '0');

    return `${displayH}:${displayM} ${period}`;
};

/**
 * Check if a player role is batsman/allrounder/bowler
 */
export const getPlayerCategory = (role = '') => {
    const r = (role || '').toUpperCase();
    if (r.includes('ALL') || r.includes('ROUNDER')) return 'ALL_ROUNDER';
    if (r.includes('BAT') || r.includes('WK')) return 'BATSMAN';
    if (r.includes('BOWL')) return 'BOWLER';
    return 'BATSMAN';
};

/**
 * Batting eligibility: Batters + All-Rounders
 */
export const isBatEligible = (role = '') => {
    const r = (role || '').toUpperCase();
    if (r.includes('ALL') || r.includes('ROUNDER')) return true;
    if (r.includes('BOWL')) return false;
    return true; // BAT, WK, etc.
};

/**
 * Bowling eligibility: Bowlers + All-Rounders
 */
export const isBowlEligible = (role = '') => {
    const r = (role || '').toUpperCase();
    if (r.includes('ALL') || r.includes('ROUNDER')) return true;
    if (r.includes('BAT') || r.includes('WK')) return false;
    return r.includes('BOWL');
};

/**
 * Get active Lagna & Nakshatra at a specific time offset within match timeline
 */
export const getActiveLagnaSlot = (lagnaTimeline = [], offsetMinutes = 0) => {
    if (!lagnaTimeline || lagnaTimeline.length === 0) {
        return { lagna: 'Aries', lord: 'Mars', nakshatra: 'Ashwini', nakshatraLord: 'Ketu', lSeq: 1, nSeq: 1 };
    }

    // If timeline items have duration or start/end
    const totalDurationMins = 240; // 4 hours
    const segmentDuration = totalDurationMins / lagnaTimeline.length;
    const index = Math.min(
        Math.floor(offsetMinutes / segmentDuration),
        lagnaTimeline.length - 1
    );

    return lagnaTimeline[index] || lagnaTimeline[0];
};

/**
 * Compute the complete 4-hour match momentum wave and innings split
 * 
 * @param {Array} teamAPlayers - Team A players with birth charts
 * @param {Array} teamBPlayers - Team B players with birth charts
 * @param {Object} matchChart - Derived match chart with lagnaTimeline & planetary positions
 * @param {String} batFirstTeam - 'teamA' or 'teamB' (who bats in 1st Innings)
 * @param {String} matchStartTime - '19:30'
 */
export const generateMatchTimelineData = (
    teamAPlayers = [],
    teamBPlayers = [],
    matchChart = null,
    batFirstTeam = 'teamA',
    matchStartTime = '19:30'
) => {
    if (!matchChart) return null;

    const mChartOriginal = matchChart.data || matchChart;
    const lagnaTimeline = mChartOriginal.lagnaTimeline || [];

    // Identify Batting & Bowling teams for Innings 1 & Innings 2
    const isTeamABattingFirst = batFirstTeam === 'teamA';
    const inn1BatTeam = isTeamABattingFirst ? teamAPlayers : teamBPlayers;
    const inn1BowlTeam = isTeamABattingFirst ? teamBPlayers : teamAPlayers;
    const inn2BatTeam = isTeamABattingFirst ? teamBPlayers : teamAPlayers;
    const inn2BowlTeam = isTeamABattingFirst ? teamAPlayers : teamBPlayers;

    const inn1BatTeamKey = isTeamABattingFirst ? 'Team A' : 'Team B';
    const inn1BowlTeamKey = isTeamABattingFirst ? 'Team B' : 'Team A';
    const inn2BatTeamKey = isTeamABattingFirst ? 'Team B' : 'Team A';
    const inn2BowlTeamKey = isTeamABattingFirst ? 'Team A' : 'Team B';

    // 1. Evaluate individual player full predictions
    const predictionsA = {};
    const predictionsB = {};

    teamAPlayers.forEach(p => {
        const pChart = p.birthChart?.data || p.birthChart;
        if (pChart) {
            const bat = runPrediction({ ...pChart, role: p.role }, mChartOriginal, 'BAT');
            const bowl = runPrediction({ ...pChart, role: p.role }, mChartOriginal, 'BOWL');
            predictionsA[p.id || p._id] = { bat, bowl };
        }
    });

    teamBPlayers.forEach(p => {
        const pChart = p.birthChart?.data || p.birthChart;
        if (pChart) {
            const bat = runPrediction({ ...pChart, role: p.role }, mChartOriginal, 'BAT');
            const bowl = runPrediction({ ...pChart, role: p.role }, mChartOriginal, 'BOWL');
            predictionsB[p.id || p._id] = { bat, bowl };
        }
    });

    // 2. Generate Time Points (every 15 mins for 240 mins = 17 points)
    // 0m to 120m: Innings 1 (Overs 1 to 20)
    // 120m to 240m: Innings 2 (Overs 1 to 20)
    const timePoints = [];
    const intervalMins = 15;
    const totalPoints = 240 / intervalMins + 1; // 17 points

    let inn1BatTotal = 0;
    let inn1BowlTotal = 0;
    let inn2BatTotal = 0;
    let inn2BowlTotal = 0;

    for (let i = 0; i < totalPoints; i++) {
        const offsetMins = i * intervalMins;
        const timeStr = formatTimeOffset(matchStartTime, offsetMins);
        const isInnings1 = offsetMins <= 120;
        const activeLagna = getActiveLagnaSlot(lagnaTimeline, offsetMins);

        // Calculate Overs representation
        let overLabel = '';
        let phaseLabel = '';
        let inningIndex = 1;

        if (isInnings1) {
            inningIndex = 1;
            const overStart = Math.min(20, Math.floor((offsetMins / 120) * 20));
            const overEnd = Math.min(20, Math.floor(((offsetMins + intervalMins) / 120) * 20));
            overLabel = overStart === overEnd ? `Over ${overStart}` : `Overs ${overStart}-${overEnd}`;

            if (overStart < 6) phaseLabel = 'Powerplay (PP)';
            else if (overStart < 15) phaseLabel = 'Middle Phase';
            else phaseLabel = 'Death Overs';
        } else {
            inningIndex = 2;
            const inn2Mins = offsetMins - 120;
            const overStart = Math.min(20, Math.floor((inn2Mins / 120) * 20));
            const overEnd = Math.min(20, Math.floor(((inn2Mins + intervalMins) / 120) * 20));
            overLabel = overStart === overEnd ? `Over ${overStart}` : `Overs ${overStart}-${overEnd}`;

            if (overStart < 6) phaseLabel = 'Powerplay (PP)';
            else if (overStart < 15) phaseLabel = 'Middle Phase';
            else phaseLabel = 'Death Overs';
        }

        // Active Batting & Bowling Teams for this interval
        const currentBatTeam = isInnings1 ? inn1BatTeam : inn2BatTeam;
        const currentBowlTeam = isInnings1 ? inn1BowlTeam : inn2BowlTeam;
        const currentPredsBat = (isInnings1 === isTeamABattingFirst) ? predictionsA : predictionsB;
        const currentPredsBowl = (isInnings1 === isTeamABattingFirst) ? predictionsB : predictionsA;

        // Calculate Batting power in this slot (Batters + All-Rounders only)
        let slotBatScore = 0;
        let topBatsman = null;
        let maxBatScore = -999;

        currentBatTeam.forEach(player => {
            if (!isBatEligible(player.role)) return; // Bowlers do not bat
            const pid = player.id || player._id;
            const pred = currentPredsBat[pid];
            if (pred?.bat) {
                const bScore = pred.bat.score || 0;
                // Add lagna resonance weight if player matches active lagna
                let resonance = 0;
                const matchesLagna = pred.bat.matchedLagnas?.some(l => l.index === activeLagna.lSeq);
                const matchesStar = pred.bat.matchedNakshatras?.some(n => n.index === activeLagna.nSeq);
                if (matchesLagna) resonance += 4;
                if (matchesStar) resonance += 2;

                const effectiveScore = bScore + resonance;
                slotBatScore += (effectiveScore * 0.15); // Normalization factor

                if (effectiveScore > maxBatScore) {
                    maxBatScore = effectiveScore;
                    topBatsman = {
                        name: player.name,
                        role: player.role,
                        score: bScore,
                        resonance,
                        matchedLagna: matchesLagna,
                        matchedStar: matchesStar
                    };
                }
            }
        });

        // Calculate Bowling threat in this slot (Bowlers + All-Rounders only)
        let slotBowlScore = 0;
        let topBowler = null;
        let maxBowlScore = -999;

        currentBowlTeam.forEach(player => {
            if (!isBowlEligible(player.role)) return; // Batters do not bowl
            const pid = player.id || player._id;
            const pred = currentPredsBowl[pid];
            if (pred?.bowl) {
                const bwScore = pred.bowl.score || 0;
                let resonance = 0;
                const matchesLagna = pred.bowl.matchedLagnas?.some(l => l.index === activeLagna.lSeq);
                const matchesStar = pred.bowl.matchedNakshatras?.some(n => n.index === activeLagna.nSeq);
                if (matchesLagna) resonance += 4;
                if (matchesStar) resonance += 2;

                const effectiveScore = bwScore + resonance;
                slotBowlScore += (effectiveScore * 0.15);

                if (effectiveScore > maxBowlScore) {
                    maxBowlScore = effectiveScore;
                    topBowler = {
                        name: player.name,
                        role: player.role,
                        score: bwScore,
                        resonance,
                        matchedLagna: matchesLagna,
                        matchedStar: matchesStar
                    };
                }
            }
        });

        // Net Momentum: Positive = Batting Surge (High Runs), Negative = Bowling Threat (Wickets)
        const netMomentum = parseFloat((slotBatScore - slotBowlScore).toFixed(1));

        if (isInnings1) {
            inn1BatTotal += slotBatScore;
            inn1BowlTotal += slotBowlScore;
        } else {
            inn2BatTotal += slotBatScore;
            inn2BowlTotal += slotBowlScore;
        }

        timePoints.push({
            index: i,
            offsetMinutes: offsetMins,
            time: timeStr,
            inning: inningIndex,
            overLabel,
            phaseLabel,
            lagna: activeLagna.lagna,
            nakshatra: activeLagna.nakshatra || activeLagna.star || '',
            nakshatraTamil: activeLagna.nakshatraTamil || '',
            lSeq: activeLagna.lSeq || 1,
            nSeq: activeLagna.nSeq || 1,
            battingTeam: isInnings1 ? inn1BatTeamKey : inn2BatTeamKey,
            bowlingTeam: isInnings1 ? inn1BowlTeamKey : inn2BowlTeamKey,
            batScore: parseFloat(slotBatScore.toFixed(1)),
            bowlScore: parseFloat(slotBowlScore.toFixed(1)),
            momentum: netMomentum,
            isBatDominating: netMomentum > 0,
            topBatsman,
            topBowler
        });
    }

    // 3. Innings Summaries
    const inn1Domination = parseFloat((inn1BatTotal - inn1BowlTotal).toFixed(1));
    const inn2Domination = parseFloat((inn2BatTotal - inn2BowlTotal).toFixed(1));

    // Overall Winner Analysis
    const netTeamAScore = isTeamABattingFirst ? (inn1Domination - inn2Domination) : (inn2Domination - inn1Domination);
    const predictedWinner = netTeamAScore > 0 ? 'Team A' : 'Team B';
    const confidencePercent = Math.min(95, Math.max(55, Math.round(50 + Math.abs(netTeamAScore) * 2.5)));

    return {
        timePoints,
        innings1: {
            battingTeam: inn1BatTeamKey,
            bowlingTeam: inn1BowlTeamKey,
            batTotal: Math.round(inn1BatTotal),
            bowlTotal: Math.round(inn1BowlTotal),
            domination: inn1Domination,
            dominantSide: inn1Domination >= 0 ? `${inn1BatTeamKey} (Batting Surge)` : `${inn1BowlTeamKey} (Bowling Pressure)`,
            timeRange: `${formatTimeOffset(matchStartTime, 0)} - ${formatTimeOffset(matchStartTime, 120)}`
        },
        innings2: {
            battingTeam: inn2BatTeamKey,
            bowlingTeam: inn2BowlTeamKey,
            batTotal: Math.round(inn2BatTotal),
            bowlTotal: Math.round(inn2BowlTotal),
            domination: inn2Domination,
            dominantSide: inn2Domination >= 0 ? `${inn2BatTeamKey} (Batting Surge)` : `${inn2BowlTeamKey} (Bowling Pressure)`,
            timeRange: `${formatTimeOffset(matchStartTime, 120)} - ${formatTimeOffset(matchStartTime, 240)}`
        },
        matchVerdict: {
            batFirstTeam,
            predictedWinner,
            confidence: `${confidencePercent}%`,
            summaryTamil: `${predictedWinner} அணிக்கு அதிக வெற்றி வாய்ப்பு உள்ளது (${confidencePercent}% நம்பிக்கை)`
        }
    };
};
