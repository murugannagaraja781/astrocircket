import { createSlice } from '@reduxjs/toolkit';
import { runPrediction } from '../../utils/predictionAdapter';

const predictionSlice = createSlice({
    name: 'predictions',
    initialState: {
        matchChart: null,
        playerPredictions: {}, // Map of playerId -> { bat: result, bowl: result }
        loading: false,
    },
    reducers: {
        setMatchChart: (state, action) => {
            state.matchChart = action.payload;
        },
        calculatePredictions: (state, action) => {
            const { players, matchChart, teamB_Ids = [] } = action.payload;
            if (!matchChart) return;

            const predictions = {};
            let scoreA = 0, scoreB = 0, countA = 0, countB = 0;
            let batA = 0, bowlA = 0, batB = 0, bowlB = 0;

            const mChartOriginal = matchChart.data || matchChart;

            players.forEach(player => {
                const playerChart = player.birthChart?.data || player.birthChart;
                if (!playerChart) return;

                let mChartToUse = mChartOriginal;
                // Normalize ID: UserDashboard uses p.id, so we must use it here for mapping consistency
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

                const bat = runPrediction(playerChart, mChartToUse, "BAT");
                const bowl = runPrediction(playerChart, mChartToUse, "BOWL");

                predictions[pid] = { bat, bowl };

                // Aggregate Logic: Only count players who are actually in Team A or Team B list
                if (bat && bowl) {
                    const contrib = Math.max(bat.score, bowl.score);
                    if (!isTeamB) {
                        scoreA += contrib; batA += bat.score; bowlA += bowl.score; countA++;
                    } else {
                        scoreB += contrib; batB += bat.score; bowlB += bowl.score; countB++;
                    }
                }
            });

            state.playerPredictions = predictions;
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
        },
        clearMatchChart: (state) => {
            state.matchChart = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    }
});

export const { setMatchChart, calculatePredictions, clearPredictions, clearMatchChart, setLoading } = predictionSlice.actions;
export default predictionSlice.reducer;
