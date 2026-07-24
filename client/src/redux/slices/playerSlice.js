import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const fetchPlayers = createAsyncThunk(
    'players/fetchPlayers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/players`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
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
