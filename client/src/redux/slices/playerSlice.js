import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:5001');

export const fetchPlayers = createAsyncThunk(
    'players/fetchPlayers',
    async (params = { all: 'true' }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/players`, { params });
            const data = response.data;
            return Array.isArray(data) ? data : (data.players || []);
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const playerSlice = createSlice({
    name: 'players',
    initialState: {
        list: [],
        loading: false,
        error: null,
        selectedPlayerId: null,
    },
    reducers: {
        setSelectedPlayer: (state, action) => {
            state.selectedPlayerId = action.payload;
        },
        setPlayers: (state, action) => {
            state.list = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPlayers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPlayers.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchPlayers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setSelectedPlayer, setPlayers } = playerSlice.actions;
export default playerSlice.reducer;
