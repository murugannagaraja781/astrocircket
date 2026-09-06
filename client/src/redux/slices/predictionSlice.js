import { createSlice } from '@reduxjs/toolkit';
import { runPrediction } from '../../utils/predictionAdapter';
import { generateMatchTimelineData } from '../../utils/timelineEngine';

const predictionSlice = createSlice({
    name: 'predictions',
    initialState: {
        matchChart: null,
        playerPredictions: {}, // Map of playerId -> { bat: result, bowl: result }
        teamB_Ids: [], // Store team B IDs for consistent predictions
        batFirstTeam: 'teamA', // 'teamA' or 'teamB'
        timelineData: null, // 4-hour dynamic momentum wave & innings breakdown
        matchResults: null,
        loading: false,
    },
    reducers: {
        setMatchChart: (state, action) => {
            state.matchChart = action.payload;
        },
        setBatFirstTeam: (state, action) => {
            state.batFirstTeam = action.payload;
        },
        calculatePredictions: (state, action) => {
            const {
                players = [],
                matchChart,
                teamB_Ids = [],
                teamAPlayers = [],
                teamBPlayers = [],
                batFirstTeam = state.batFirstTeam || 'teamA',
                matchStartTime = '19:30'
            } = action.payload;

            if (!matchChart) return;

            state.batFirstTeam = batFirstTeam;
            const predictions = {};
            let scoreA = 0, scoreB = 0, countA = 0, countB = 0;
            let batA = 0, bowlA = 0, batB = 0, bowlB = 0;

            const mChartOriginal = matchChart.data || matchChart;

            players.forEach(player => {
                const playerChart = player.birthChart?.data || player.birthChart;
                if (!playerChart) return;

                let mChartToUse = mChartOriginal;
                const pid = player.id || player._id;

                // Team B Inning Swap Logic
                const isTeamB = teamB_Ids.includes(pid);
                if (isTeamB) {
                    mChartToUse = { ...mChartOriginal };
                    const tempBatSign = mChartToUse.battingLagnaSign;
                    const tempBatLord = mChartToUse.battingLagnaLord;
                    mChartToUse.battingLagnaSign = mChartToUse.bowlingLagnaSign;
                    mChartToUse.battingLagnaLord = mChartToUse.bowlingLagnaLord;
                    mChartToUse.bowlingLagnaSign = tempBatSign;
                    mChartToUse.bowlingLagnaLord = tempBatLord;
                }

                const bat = runPrediction({ ...playerChart, role: player.role }, mChartToUse, "BAT");
                const bowl = runPrediction({ ...playerChart, role: player.role }, mChartToUse, "BOWL");

                predictions[pid] = { bat, bowl };

                if (bat && bowl) {
                    const contrib = Math.max(bat.score, bowl.score);
                    if (!isTeamB) {
                        scoreA += contrib; batA += bat.score; bowlA += bowl.score; countA++;
                    } else {
                        scoreB += contrib; batB += bat.score; bowlB += bowl.score; countB++;
                    }
                }
            });

            // Calculate 4-hour Timeline & Innings 1 vs 2 data
            const playersA = teamAPlayers.length > 0 ? teamAPlayers : players.filter(p => !teamB_Ids.includes(p.id || p._id));
            const playersB = teamBPlayers.length > 0 ? teamBPlayers : players.filter(p => teamB_Ids.includes(p.id || p._id));

            const timelineData = generateMatchTimelineData(
                playersA,
                playersB,
                matchChart,
                batFirstTeam,
                matchStartTime
            );

            state.playerPredictions = predictions;
            state.timelineData = timelineData;
            state.matchResults = {
                scoreA: (countA > 0 ? (scoreA / countA).toFixed(1) : 0),
                scoreB: (countB > 0 ? (scoreB / countB).toFixed(1) : 0),
                totalA: scoreA, totalB: scoreB,
                batA, bowlA, batB, bowlB
            };
        },
        clearPredictions: (state) => {
            state.playerPredictions = {};
            state.matchChart = null;
            state.timelineData = null;
            state.matchResults = null;
        },
        clearMatchChart: (state) => {
            state.matchChart = null;
            state.timelineData = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setTeamBIds: (state, action) => {
            state.teamB_Ids = action.payload;
        },
        resetPredictions: (state) => {
            state.playerPredictions = {};
            state.timelineData = null;
            state.matchResults = null;
        }
    }
});

export const { 
    setMatchChart, 
    setBatFirstTeam,
    calculatePredictions, 
    clearPredictions, 
    clearMatchChart, 
    setLoading,
    setTeamBIds,
    resetPredictions
} = predictionSlice.actions;
export default predictionSlice.reducer;
