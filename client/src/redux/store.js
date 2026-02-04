import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import predictionReducer from './slices/predictionSlice';

export const store = configureStore({
    reducer: {
        players: playerReducer,
        predictions: predictionReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Useful for storing complex astrology objects
        }),
});
