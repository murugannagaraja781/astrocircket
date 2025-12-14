export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cricketGreen: '#0A5B1D',
                cricketWhite: '#FFFFFF',
                cricketRed: '#FF0000',
                cricketGold: '#FFD700',
                skyBlue: '#87CEEB',
                pitchBrown: '#8B4513',
            },
            backgroundImage: {
                'pitch-sky': 'linear-gradient(135deg, #0A5B1D, #87CEEB)',
                'trophy-shine': 'linear-gradient(45deg, #FFD700, #FFA500)',
            },
            fontFamily: {
                sans: ['Open Sans', 'sans-serif'],
                heading: ['Montserrat', 'sans-serif'],
                score: ['Rajdhani', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
