export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // CSK Theme - Yellow, Green, Orange
                cskYellow: '#F9CD05',
                cskYellowWarm: '#FFD600',

                deepGreen: '#004D40',
                deepGreenLight: '#00695C',

                lightGreen: '#F0FDF4',
                mint: '#DCFCE7',

                vibrantOrange: '#F97316',
                deepOrange: '#EA580C',

                // Legacy mappings (for backwards compatibility)
                indiaBlue: '#004D40', // Mapped to Deep Green
                indiaOrange: '#F97316', // Mapped to Orange
                indiaGreen: '#004D40',
                indiaWhite: '#FFFFFF',
                indiaGray: '#F0FDF4', // Mapped to Light Green

                cricketGreen: '#004D40',
                cricketGreenDeep: '#00695C',
                pitchBrown: '#F97316',
                cricketRed: '#EA580C',
                pitchGold: '#F9CD05',
                boundaryBlue: '#004D40',
            },
            backgroundImage: {
                // CSK Theme Gradients
                'gradient-primary': 'linear-gradient(90deg, #F9CD05 0%, #F97316 100%)',
                'gradient-header': 'linear-gradient(90deg, #004D40 0%, #00695C 100%)',
                'gradient-light': 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',

                'stadium-light': 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
                'gradient-mint': 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',

                // Legacy
                'team-india-gradient': 'linear-gradient(90deg, #F9CD05 0%, #F97316 100%)',
                'gradient-cricket': 'linear-gradient(90deg, #F9CD05 0%, #F97316 100%)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Montserrat', 'sans-serif'],
                score: ['Teko', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 4px 20px rgba(0, 77, 64, 0.08)',
                'card-hover': '0 8px 30px rgba(0, 77, 64, 0.12)',
                'button': '0 4px 14px rgba(249, 115, 22, 0.25)',
                'button-hover': '0 6px 20px rgba(249, 115, 22, 0.35)',

                // Legacy
                'card-soft': '0 4px 6px -1px rgba(0, 77, 64, 0.1)',
                'blue-glow': '0 0 10px rgba(0, 77, 64, 0.3)',
                'cricket-glow': '0 0 20px rgba(249, 205, 5, 0.25)',
                'gold-glow': '0 0 15px rgba(249, 205, 5, 0.4)',
                'orange-glow': '0 0 15px rgba(249, 115, 22, 0.3)',
            },
            borderRadius: {
                'pill': '50px',
            },
        },
    },
    plugins: [],
}
