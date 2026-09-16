import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import predictionReducer from './slices/predictionSlice';
import h2hReducer from './slices/h2hSlice';

export const store = configureStore({
    reducer: {
        players: playerReducer,
        predictions: predictionReducer,
        h2h: h2hReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Useful for storing complex astrology objects
        }),
});
