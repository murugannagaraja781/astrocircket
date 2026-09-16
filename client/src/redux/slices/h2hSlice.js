import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    teamAId: '',
    teamBId: '',
    teamAName: 'Team A',
    teamBName: 'Team B',
    teamAPlayers: [],
    teamBPlayers: [],
    batFirstTeam: 'teamA',
    strikerId: '',
    nonStrikerId: '',
    bowlerId: '',
    isDualBatsmanMode: true,
    timeOffsetMinutes: 0,
    matchDate: new Date().toISOString().split('T')[0],
    matchStartTime: '19:30',
    venueName: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 5.5,
    matchChart: null,
    loading: false
};

const h2hSlice = createSlice({
    name: 'h2h',
    initialState,
    reducers: {
        setH2HTeams: (state, action) => {
            const { teamAId, teamBId, teamAName, teamBName, teamAPlayers, teamBPlayers } = action.payload;
            if (teamAId !== undefined) state.teamAId = teamAId;
            if (teamBId !== undefined) state.teamBId = teamBId;
            if (teamAName !== undefined) state.teamAName = teamAName;
            if (teamBName !== undefined) state.teamBName = teamBName;
            if (teamAPlayers !== undefined) state.teamAPlayers = teamAPlayers;
            if (teamBPlayers !== undefined) state.teamBPlayers = teamBPlayers;
        },
        setH2HMatchChart: (state, action) => {
            state.matchChart = action.payload;
        },
        setH2HBatFirstTeam: (state, action) => {
            state.batFirstTeam = action.payload;
        },
        setStriker: (state, action) => {
            state.strikerId = action.payload;
        },
        setNonStriker: (state, action) => {
            state.nonStrikerId = action.payload;
        },
        setBowler: (state, action) => {
            state.bowlerId = action.payload;
        },
        swapBatsmen: (state) => {
            const temp = state.strikerId;
            state.strikerId = state.nonStrikerId;
            state.nonStrikerId = temp;
        },
        setDualBatsmanMode: (state, action) => {
            state.isDualBatsmanMode = action.payload;
        },
        setTimeOffsetMinutes: (state, action) => {
            state.timeOffsetMinutes = action.payload;
        },
        setMatchStartTime: (state, action) => {
            state.matchStartTime = action.payload;
        },
        setMatchVenueAndTime: (state, action) => {
            const { matchDate, matchStartTime, venueName, latitude, longitude, timezone } = action.payload;
            if (matchDate !== undefined) state.matchDate = matchDate;
            if (matchStartTime !== undefined) state.matchStartTime = matchStartTime;
            if (venueName !== undefined) state.venueName = venueName;
            if (latitude !== undefined) state.latitude = latitude;
            if (longitude !== undefined) state.longitude = longitude;
            if (timezone !== undefined) state.timezone = timezone;
        },
        resetH2HSelections: (state) => {
            state.strikerId = '';
            state.nonStrikerId = '';
            state.bowlerId = '';
            state.timeOffsetMinutes = 0;
        }
    }
});

export const {
    setH2HTeams,
    setH2HMatchChart,
    setH2HBatFirstTeam,
    setStriker,
    setNonStriker,
    setBowler,
    swapBatsmen,
    setDualBatsmanMode,
    setTimeOffsetMinutes,
    setMatchStartTime,
    setMatchVenueAndTime,
    resetH2HSelections
} = h2hSlice.actions;

export default h2hSlice.reducer;
