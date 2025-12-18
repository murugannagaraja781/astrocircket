export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Indian Cricket Team Palette
                indiaBlue: '#003B95', // "Bleed Blue" - Royal Blue
                indiaOrange: '#FF6600', // Saffron
                indiaGreen: '#138808', // Flag Green (Accents)
                indiaWhite: '#FFFFFF', // Clean White
                indiaGray: '#F3F4F6', // Light Gray background

                // Legacy / Semantic mappings
                cricketGreen: '#003B95', // Mapping old green vars to Blue for instant theme switch
                pitchBrown: '#FF6600',   // Mapping old brown to Orange
            },
            backgroundImage: {
                'stadium-light': 'linear-gradient(to bottom, #F3F4F6, #FFFFFF)', // Bright Day theme
                'team-india-gradient': 'linear-gradient(135deg, #003B95 0%, #002255 100%)', // Jersey gradient
                'pitch-pattern': "url('https://www.transparenttextures.com/patterns/grass.png')",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Montserrat', 'sans-serif'],
                score: ['Teko', 'sans-serif'],
            },
            boxShadow: {
                'card-soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'blue-glow': '0 0 10px rgba(0, 59, 149, 0.3)',
            },
        },
    },
    plugins: [],
}
