import { MD3DarkTheme } from 'react-native-paper';

export const theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#4ade80', // Neon Green-ish
        onPrimary: '#000000',
        secondary: '#22c55e',
        background: '#0f172a', // Dark Blue/Slate
        surface: '#1e293b', // Lighter Slate for cards
        onSurface: '#f8fafc', // White text
        text: '#ffffff',
        placeholder: '#94a3b8',

        // Custom specific colors
        success: '#4ade80',
        error: '#ef4444',
        warning: '#eab308',

        // Gradients logic (handled in components, but base colors here)
        gradientStart: '#1d4ed8', // Deep Blue
        gradientEnd: '#000000',
    },
    roundness: 12,
};

export const customColors = {
    greenHighlight: '#65a30d',
    neon: '#a3e635',
    darkBg: '#020617',
    cardBg: '#1e293b'
};
