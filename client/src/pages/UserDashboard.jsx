import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import RasiChart from '../components/RasiChart';
import MatchPredictionControl from '../components/MatchPredictionControl';
import { runPrediction } from '../utils/predictionAdapter'; // Helper imported
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Box, TextField, InputAdornment, TablePagination,
    Select, MenuItem, FormControl, InputLabel, Collapse, IconButton,
    Container, AppBar, Toolbar, Avatar, Chip, Grid, Card, CardContent, Button,
    CircularProgress, Tabs, Tab, Divider, useMediaQuery, useTheme,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Switch, Checkbox, Slide,
    Breadcrumbs, Link
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import GridOnIcon from '@mui/icons-material/GridOn';
import CloseIcon from '@mui/icons-material/Close';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// --- COLOR PALETTE (YELLOW + ORANGE PURE APP THEME) ---
const visionPro = {
    background: '#FFFBF5', // Soft off-white / light cream
    paper: '#FFFFFF', // Pure white cards
    primary: '#FFC107', // Warm Golden Yellow
    secondary: '#FF6F00', // Deep Orange
    accent: '#FFD54F', // Light Yellow accent
    text: '#212121', // Near-black charcoal
    textSecondary: '#616161', // Muted dark gray
    border: 'rgba(0, 0, 0, 0.08)', // Subtle border
    success: '#4CAF50', // Success Green
    warning: '#FF9800', // Amber Warning
    error: '#F44336', // Error Red
    gradientPrimary: 'linear-gradient(90deg, #FFC107 0%, #FF6F00 100%)', // Yellow to Orange
    gradientWarm: 'linear-gradient(135deg, #FFD54F 0%, #FF6F00 100%)', // Subtle warm gradient
};

// --- HELPERS ---
const getFlag = (player) => {
    const tz = player.timezone || '';
    const place = player.birthPlace || '';
    if (tz.includes('Kolkata') || place.includes('India') || place.includes('Mumbai') || place.includes('Pune')) return '🇮🇳';
    if (tz.includes('Australia') || place.includes('Australia')) return '🇦🇺';
    if (tz.includes('London') || place.includes('UK') || place.includes('England')) return '🇬🇧';
    if (tz.includes('Johannesburg') || place.includes('South Africa')) return '🇿🇦';
    if (tz.includes('Auckland') || place.includes('New Zealand')) return '🇳🇿';
    if (tz.includes('Colombo') || place.includes('Sri Lanka')) return '🇱🇰';
    if (tz.includes('Karachi') || place.includes('Pakistan')) return '🇵🇰';
    if (tz.includes('Dhaka') || place.includes('Bangladesh')) return '🇧🇩';
    if (tz.includes('USA') || place.includes('New_York')) return '🇺🇸';
    if (place.includes('West Indies')) return '🌴';
    if (place.includes('Afghanistan')) return '🇦🇫';
    return '🏳️';
};

// --- SUB-COMPONENTS ---

// Prediction Chip
const PredictionChip = ({ score, type, report = [] }) => {
    let color = 'default';
    let label = 'Neutral';

    if (score >= 2) { color = 'success'; label = 'Excellent'; }
    else if (score >= 1) { color = 'primary'; label = 'Good'; }
    else { color = 'error'; label = 'Flop'; }

    return (
        <Tooltip title={
            <div className="text-xs">
                {report && report.map((r, i) => (
                    <div key={i}>
                        • {typeof r === 'object' ? `${r.en} / ${r.ta}` : r}
                    </div>
                ))}
                {(!report || report.length === 0) && "No rules matched (Flop)"}
            </div>
        } arrow placement="top">
            <Chip
                label={`${type}: ${label}`}
                size="small"
                color={color}
                variant={score > 0 ? 'filled' : 'outlined'}
                sx={{ mr: 1, fontWeight: 'bold' }}
            />
        </Tooltip>
    );
};

// Helper to get Star Lord if missing from API
const getNakshatraLordHelper = (nakshatraName) => {
    if (!nakshatraName) return '-';

    const lordMap = {
        'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
        'Rohini': 'Moon', 'Mrigashirsha': 'Mars', 'Ardra': 'Rahu',
        'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
        'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
        'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
        'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshtha': 'Mercury',
        'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
        'Shravana': 'Moon', 'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu',
        'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury'
    };

    // Handle partial matches or different spellings if needed
    for (const [key, val] of Object.entries(lordMap)) {
        if (nakshatraName.includes(key)) return val;
    }
    return '-';
};

// 1. Planetary Details Table
// 1. Planetary Details Table
// 1. Planetary Details Table
const PlanetaryTable = ({ planets, hideHeader = false }) => {
    // If planets is undefined or not an array, show empty state
    if (!planets || !Array.isArray(planets) || planets.length === 0) {
         return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                    No Planetary Data Available (தரவு இல்லை)
                </Typography>
            </Box>
         );
    }

    return (
        <Box>
            <TableContainer component={Paper} variant="outlined" sx={{
                mt: 2,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : visionPro.paper,
                borderColor: hideHeader ? 'rgba(255, 255, 255, 0.1)' : visionPro.border
            }}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: hideHeader ? '#D1FAE5' : '#D1FAE5' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>கிரகம்</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ராசி</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ராசி நாதன்</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>நட்சத்திர நாதன்</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>நட்சத்திரம்</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>பாகை</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>அந்தஸ்து</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>நிலை</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>தன்மை</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Debug</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {planets.map((p, i) => (
                            <TableRow key={i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.02)' : 'rgba(110, 231, 183, 0.03)' } }}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className={`font-bold ${hideHeader ? 'text-green-600' : 'text-gray-800'}`}>{p.planetName}</span>
                                        <span className={`text-xs ${hideHeader ? 'text-green-500' : 'text-green-700'}`}>{p.planetTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="font-medium">{p.signName}</span>
                                        <span className={`text-xs ${hideHeader ? 'text-gray-400' : 'text-gray-500'}`}>{p.signTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className={`font-medium ${hideHeader ? 'text-green-600' : 'text-gray-700'}`}>{p.lordName}</span>
                                        <span className={`text-xs ${hideHeader ? 'text-gray-400' : 'text-gray-500'}`}>{p.lordTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className={`font-medium ${hideHeader ? 'text-green-600' : 'text-gray-700'}`}>{p.nakshatraLord}</span>
                                        <span className={`text-xs ${hideHeader ? 'text-gray-400' : 'text-gray-500'}`}>{p.nakshatraLordTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{p.nakshatraName}</span>
                                        <span className={`text-xs ${hideHeader ? 'text-gray-400' : 'text-gray-500'}`}>{p.nakshatraTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={p.degreeFormatted} size="small" variant="outlined" sx={{ minWidth: 60 }} />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={p.dignityTamil}
                                        size="small"
                                        color={p.dignityName === 'Exalted' ? 'success' : p.dignityName === 'Debilitated' ? 'error' : 'default'}
                                        variant="filled"
                                        sx={{ minWidth: 80 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={p.avasthaTamil || '-'}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        sx={{ minWidth: 70 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {p.isRetro && <Chip label="வக்ரம்" size="small" color="secondary" sx={{ height: 24, fontSize: 10 }} />}
                                        {p.isCombust && <Chip label="அஸ்தமனம்" size="small" color="warning" sx={{ height: 24, fontSize: 10 }} />}
                                        {!p.isRetro && !p.isCombust && <Chip label="நேர்கதி" size="small" variant="outlined" sx={{ height: 24, fontSize: 10, opacity: 0.6 }} />}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={<pre style={{ fontSize: '10px', color: hideHeader ? '#fff' : '#000', maxHeight: '300px', overflow: 'auto' }}>{JSON.stringify(p.raw || {}, null, 2)}</pre>} arrow>
                                        <Chip
                                            label="JSON"
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                cursor: 'help',
                                                height: 20,
                                                fontSize: '9px',
                                                borderColor: hideHeader ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                                                color: hideHeader ? '#A7F3D0' : '#059669'
                                            }}
                                        />
                                    </Tooltip>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>


        </Box>
    );
};

const planetTamilMap = {
    'sun': 'சூரியன்', 'moon': 'சந்திரன்', 'mars': 'செவ்வாய்', 'mercury': 'புதன்',
    'jupiter': 'குரு', 'venus': 'சுக்கிரன்', 'saturn': 'சனி', 'rahu': 'ராகு', 'ketu': 'கேது',
    'asc': 'லக்னம்', 'lagna': 'லக்னம்', 'uranus': 'யுரேனஸ்', 'neptune': 'நெப்டியூன்', 'pluto': 'புளூட்டோ',
    'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
    'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
    'Asc': 'லக்னம்', 'Lagna': 'லக்னம்'
};

const signTamilMap = {
    'aries': 'மேஷம்', 'taurus': 'ரிஷபம்', 'gemini': 'மிதுனம்', 'cancer': 'கடகம்',
    'leo': 'சிம்மம்', 'virgo': 'கன்னி', 'libra': 'துலாம்', 'scorpio': 'விருச்சிகம்',
    'sagittarius': 'தனுசு', 'capricorn': 'மகரம்', 'aquarius': 'கும்பம்', 'pisces': 'மீனம்',
    'Aries': 'மேஷம்', 'Taurus': 'ரிஷபம்', 'Gemini': 'மிதுனம்', 'Cancer': 'கடகம்',
    'Leo': 'சிம்மம்', 'Virgo': 'கன்னி', 'Libra': 'துலாம்', 'Scorpio': 'விருச்சிகம்',
    'Sagittarius': 'தனுசு', 'Capricorn': 'மகரம்', 'Aquarius': 'கும்பம்', 'Pisces': 'மீனம்'
};

// 1.1 Quick Summary Table (Deep Loop Implementation)
const QuickSummaryTable = ({ data, hideHeader = false }) => {
    // Deep Extraction Loop: Search for planets across various structures (formatted, planets map, houses array)
    const extractItems = (input) => {
        if (!input) return [];

        // Potential pools for planetary data
        const searchPool = [input, input.data, input.planets, input.birthChart].filter(Boolean);

        for (const pool of searchPool) {
            const raw = pool.rawplanet || pool.rawplanets || pool.rawPlanets || pool.raw_planets || pool['raw planet'] || pool['raw planets'];

            if (raw) {
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'object') {
                    // Map keys to 'name' if missing in values
                    return Object.entries(raw).map(([key, val]) => {
                        if (typeof val !== 'object') return { name: key, value: val };
                        return {
                            name: key,
                            ...val,
                            planet: val.planet || val.Planet || val.name || key
                        };
                    });
                }
            }

            // Check direct arrays
            if (pool.Planets && Array.isArray(pool.Planets)) return pool.Planets;
            if (pool.planets && Array.isArray(pool.planets)) return pool.planets;
        }

        // Fallbacks for standard structures
        const chart = input.data || input;
        if (chart.formattedPlanets && chart.formattedPlanets.length > 0) return chart.formattedPlanets;
        if (chart.planets && typeof chart.planets === 'object') {
             return Object.entries(chart.planets).map(([k, v]) => ({ name: k, ...v }));
        }

        return [];
    };

    const planets = extractItems(data);

    if (planets.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: visionPro.paper, borderRadius: 2, mt: 2, border: `1px solid ${visionPro.border}` }}>
                <Typography sx={{ color: visionPro.text, fontWeight: 'bold' }}>
                    Fetching planetary details... (தகவல் தேடப்படுகிறது)
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0} sx={{
            mt: 2,
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: visionPro.paper,
            border: `1px solid ${visionPro.border}`
        }}>
            <Table size="small">
                <TableHead sx={{ bgcolor: visionPro.accent }}>
                    <TableRow>
                        <TableCell sx={{ color: visionPro.text, fontWeight: '900' }}>கிரகம்</TableCell>
                        <TableCell sx={{ color: visionPro.text, fontWeight: 'bold' }}>ராசி</TableCell>
                        <TableCell sx={{ color: visionPro.text, fontWeight: 'bold' }}>நட்சத்திரம்</TableCell>
                        <TableCell sx={{ color: visionPro.primary, fontWeight: 'bold' }}>பாதம்</TableCell>
                        <TableCell sx={{ color: visionPro.primary, fontWeight: 'bold' }}>பாகை</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {planets.map((pRaw, i) => {
                        const p = typeof pRaw === 'string' ? { name: pRaw } : pRaw;
                        const nameKey = p.planetTamil || p.planetName || p.name || p.Planet || p.Graha || p.graha || p.planet;
                        const signKey = p.signTamil || p.signName || p.sign || p.Sign || p.Rasi || p.rasi;

                        return (
                            <TableRow key={i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(5, 150, 105, 0.03)' } }}>
                                <TableCell sx={{ fontWeight: 'bold', color: visionPro.text }}>
                                    {planetTamilMap[nameKey] || nameKey || '-'}
                                </TableCell>
                                <TableCell sx={{ color: visionPro.text }}>
                                    {signTamilMap[signKey] || signKey || '-'}
                                </TableCell>
                            <TableCell sx={{ color: visionPro.textSecondary }}>
                                {p.nakshatraTamil || p.nakshatraName || p.nakshatra || p.Nakshatra || p.star || '-'}
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={p.pada || p.Pada || p.Charan || p.charan || '-'}
                                    size="small"
                                    sx={{ bgcolor: visionPro.primary, color: '#fff', fontWeight: '900' }}
                                />
                            </TableCell>
                            <TableCell sx={{ color: visionPro.primary, fontWeight: '800' }}>
                                {p.degreeFormatted || p.degree || p.Ansh || p.ansh || (p.Degree ? Number(p.Degree).toFixed(2) + '°' : '-')}
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// 2. Panchangam Grid
const PanchangamGrid = ({ panchangam, birthData, hideHeader = false }) => {
    if (!panchangam) return null;

    const items = [
        { label: 'திதி', val: panchangam.tithi?.name || panchangam.tithi, icon: '🌙' },
        { label: 'வாரம்', val: panchangam.vara?.name || panchangam.vara, icon: '📅' },
        { label: 'நட்சத்திரம்', val: panchangam.nakshatra?.name || panchangam.nakshatra, icon: '✨' },
        { label: 'யோகம்', val: panchangam.yoga?.name || panchangam.yoga, icon: '🧘' },
        { label: 'கரணம்', val: panchangam.karana?.name || panchangam.karana, icon: '🦁' },
        { label: 'உதய / அஸ்தமன', val: `${panchangam.sunrise} / ${panchangam.sunset}`, icon: '🌅' },
    ];

    return (
        <Card variant="outlined" sx={{
            mt: 2,
            bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : visionPro.paper,
            borderRadius: 2,
            boxShadow: hideHeader ? 'none' : '0 10px 30px rgba(0,0,0,0.3)',
            borderColor: hideHeader ? 'rgba(255, 255, 255, 0.1)' : visionPro.border,
            color: hideHeader ? 'white' : visionPro.text
        }}>
             <CardContent>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    borderBottom: `1px solid ${hideHeader ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.2)'}`,
                    pb: 1
                }}>
                    <Typography variant="h6" color={hideHeader ? 'secondary' : visionPro.primary} fontWeight="bold">
                        Panchangam Details
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', color: hideHeader ? '#A0AEC0' : 'gray' }}>
                        {birthData?.date} {birthData?.time}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {items.map((item, i) => (
                        <Grid item xs={6} sm={4} md={2} key={i}>
                            <Paper elevation={0} sx={{
                                p: 2,
                                bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                                borderRadius: 2,
                                textAlign: 'center',
                                height: '100%',
                                border: hideHeader ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${visionPro.border}`,
                                color: hideHeader ? 'white' : '#fff'
                            }}>
                                <Typography variant="h5" sx={{ mb: 1 }}>{item.icon}</Typography>
                                <Typography variant="caption" color={hideHeader ? 'textSecondary' : 'textSecondary'} display="block" textTransform="uppercase" fontWeight="bold" fontSize={10}>
                                    {item.label}
                                </Typography>
                                <Typography variant="body2" fontWeight="medium" color={hideHeader ? 'white' : 'textPrimary'}>
                                    {item.val || '-'}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

// 3. Player Detail Panel (Collapsible)
const PlayerDetailPanel = ({ player, matchChart, initialTab = 0, hideHeader = false }) => {
    const [tabIndex, setTabIndex] = useState(initialTab);

    // Normalize Data (Handle wrappers)
    const chartData = player.birthChart?.data || player.birthChart;
    const matchData = matchChart?.data || matchChart;

    // Run Advanced Prediction if Match Chart is available
    const batsmanPred = useMemo(() => matchData ? runPrediction(chartData, matchData, "BAT") : null, [chartData, matchData]);
    const bowlerPred = useMemo(() => matchData ? runPrediction(chartData, matchData, "BOWL") : null, [chartData, matchData]);

    return (
        <Box sx={{
            p: 3,
            bgcolor: hideHeader ? 'rgba(0, 0, 0, 0.2)' : 'rgba(10, 10, 26, 0.6)',
            borderTop: hideHeader ? '1px solid rgba(255, 255, 255, 0.05)' : `1px solid ${visionPro.border}`,
            borderRadius: hideHeader ? 0 : '0 0 16px 16px'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                     <Typography variant="h6" color="primary" fontWeight="bold">
                        {player.tamilName} ({player.englishName})
                    </Typography>
                    <Typography variant="caption" display="block">
                        Born: {player.birthData?.date || '-'} at {player.birthData?.time || '-'} | Place: {player.birthData?.place || '-'}
                    </Typography>
                </Box>
                {/* Prediction Results */}
                {matchData && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <PredictionChip score={batsmanPred?.score} type="BAT" report={batsmanPred?.logs} />
                        <PredictionChip score={bowlerPred?.score} type="BOWL" report={bowlerPred?.logs} />
                    </Box>
                )}
            </Box>

            {/* Detailed Stats if Prediction Available */}
            {matchData && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                       <Paper sx={{
                           p: 2,
                           borderLeft: 5,
                           borderColor: batsmanPred?.verdict === 'EXCELLENT' ? 'success.main' : 'warning.main',
                           bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : 'white',
                           color: hideHeader ? 'white' : 'inherit'
                       }}>
                            <Typography variant="subtitle1" fontWeight="bold">Batting Analysis</Typography>
                             <Typography variant="h5" color={batsmanPred?.verdict === 'EXCELLENT' ? 'success.main' : 'text.primary'}>
                                {batsmanPred?.verdict} ({batsmanPred?.score})
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>{batsmanPred?.message}</Typography>
                            <Divider sx={{ my: 1 }} />
                            {batsmanPred?.logs?.map((log, i) => (
                                <Typography key={i} variant="caption" display="block" sx={{ color: 'green' }}>
                                    ✓ {typeof log === 'object' ? `${log.en} / ${log.ta}` : log}
                                </Typography>
                            ))}
                       </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                       <Paper sx={{
                           p: 2,
                           borderLeft: 5,
                           borderColor: bowlerPred?.verdict === 'EXCELLENT' ? 'success.main' : 'warning.main',
                           bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : 'white',
                           color: hideHeader ? 'white' : 'inherit'
                       }}>
                            <Typography variant="subtitle1" fontWeight="bold">Bowling Analysis</Typography>
                             <Typography variant="h5" color={bowlerPred?.verdict === 'EXCELLENT' ? 'success.main' : 'text.primary'}>
                                {bowlerPred?.verdict} ({bowlerPred?.score})
                            </Typography>
                             <Typography variant="body2" color="text.secondary" gutterBottom>{bowlerPred?.message}</Typography>
                             <Divider sx={{ my: 1 }} />
                             {bowlerPred?.logs?.map((log, i) => (
                                <Typography key={i} variant="caption" display="block" sx={{ color: 'green' }}>
                                    ✓ {typeof log === 'object' ? `${log.en} / ${log.ta}` : log}
                                </Typography>
                            ))}
                       </Paper>
                    </Grid>
                </Grid>
            )}

            <Divider sx={{ mb: 2 }} />

            <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}
                sx={{
                    mb: 2,
                    borderBottom: `1px solid ${hideHeader ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.2)'}`,
                    "& .MuiTab-root": { color: hideHeader ? '#A0AEC0' : '#A0AEC0', fontWeight: 'bold' },
                    "& .Mui-selected": { color: `${hideHeader ? '#fff' : visionPro.primary} !important` },
                    "& .MuiTabs-indicator": { bgcolor: hideHeader ? visionPro.primary : visionPro.primary }
                }}>
                <Tab label="Rasi Chart" />
                <Tab label="கிரக நிலைகள்" />
                <Tab label="Panchangam" />
            </Tabs>

            {/* Debug JSON Toggle */}
            <Box sx={{ mt: 2, mb: 1 }}>
                <Button
                    size="small"
                    onClick={() => {
                        console.log(`=== PLAYER JSON (${player.name}) ===`, chartData);
                        console.log(`=== MATCH JSON ===`, matchData);
                        const el = document.getElementById(`debug-${player.id || player._id}`);
                        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    }}
                    sx={{ fontSize: '0.7rem', color: '#666' }}
                >
                    🔍 Debug JSON
                </Button>
                <Box id={`debug-${player.id || player._id}`} sx={{ display: 'none', p: 1, bgcolor: '#111', color: '#0f0', fontSize: 10, overflow: 'auto', maxHeight: 200, borderRadius: 1 }}>
                    <pre>
{JSON.stringify({
    playerChart: chartData,
    matchChart: matchData,
    batPrediction: batsmanPred,
    bowlPrediction: bowlerPred
}, null, 2)}
                    </pre>
                </Box>
            </Box>

            {tabIndex === 0 && (
                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} md={8} lg={6}>
                        {/* Rasi Chart Component with Dignity Colors */}
                        <RasiChart
                            data={chartData}
                            planetsData={(() => {
                                if (!chartData) return null;
                                const pList = chartData.formattedPlanets || (chartData.planets && Array.isArray(chartData.planets) ? chartData.planets : []);
                                const styleMap = {};
                                pList.forEach(p => {
                                    const name = p.name || p.planetName;
                                    const dignity = p.dignityName || p.dignity;
                                    let color = '#000';
                                    if (dignity) {
                                        if (['Exalted', 'Uchcham', 'உச்சம்'].some(v => dignity.includes(v))) color = '#059669'; // Green
                                        else if (['Own', 'Atchi', 'ஆட்சி', 'Moolatrikona'].some(v => dignity.includes(v))) color = '#d97706'; // Orange
                                        else if (['Debilitated', 'Neecham', 'நீசம்'].some(v => dignity.includes(v))) color = '#dc2626'; // Red
                                        else if (['Friendly', 'Natpu', 'நட்பு'].some(v => dignity.includes(v))) color = '#2563eb'; // Blue
                                    }

                                    if (name) styleMap[name] = { dignityColor: color };
                                });
                                return styleMap;
                            })()}
                        />
                         {/* Summary Table mimicking Match Prediction Control */}
                         <Box sx={{ mt: 3 }}>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid rgba(255, 111, 0, 0.2)' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(255, 193, 7, 0.15)' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00' }}>விபரம்</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00' }}>இராசி/நட்சத்திரம்</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00' }}>அதிபதி</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(() => {
                                            const summary = [];
                                            // 1. Lagna
                                            const asc = chartData?.ascendant || {};
                                            const ascSign = asc.tamil || "Not Found";
                                            const ascLord = asc.lordTamil || asc.lord || "-";
                                            summary.push({ label: "லக்னம்", sign: ascSign, lord: ascLord });
                                            // 2. Moon
                                            const moon = chartData?.moonSign || {};
                                            const moonSign = moon.tamil || "Not Found";
                                            const moonLord = moon.lordTamil || moon.lord || "-";
                                            summary.push({ label: "சந்திரன்", sign: moonSign, lord: moonLord });
                                            // 3. Nakshatra
                                            const nak = chartData?.nakshatra || chartData?.moonNakshatra || {};
                                            const nakName = nak.tamil || nak.name || "Not Found";
                                            let nakLord = nak.lordTamil || nak.lord || "-";
                                            const tamilLords = { 'Ketu': 'கேது', 'Venus': 'சுக்கிரன்', 'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Rahu': 'ராகு', 'Jupiter': 'குரு', 'Saturn': 'சனி', 'Mercury': 'புதன்' };
                                            if (tamilLords[nakLord]) nakLord = tamilLords[nakLord];
                                            summary.push({ label: "நட்சத்திரம்", sign: nakName, lord: nakLord });

                                            return summary.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>{row.label}</TableCell>
                                                    <TableCell sx={{ color: '#000' }}>{row.sign}</TableCell>
                                                    <TableCell sx={{ color: '#000' }}>{row.lord}</TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                         {/* PLANETARY DETAILS LIST (Dignity Colors) */}
                         <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#FF6F00' }}>
                                 கிரக விவரங்கள் (Planetary Details)
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid rgba(255, 111, 0, 0.2)' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(255, 193, 7, 0.15)' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.75rem' }}>Planet</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.75rem' }}>Rasi</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.75rem' }}>Star</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.75rem' }}>Star Lord</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.75rem' }}>Dignity</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(() => {
                                            const pList = chartData?.formattedPlanets || chartData?.planets || [];
                                            return Array.isArray(pList) ? pList.map((p, i) => {
                                                const name = p.name || p.planetName;
                                                if (!name) return null;

                                                // Dignity Color Logic
                                                const dignity = p.dignityName || p.dignity || '-';
                                                let dColor = 'text.primary';
                                                if (['Exalted', 'Uchcham', 'உச்சம்'].some(v => dignity.toLowerCase().includes(v.toLowerCase()))) dColor = '#059669'; // Green
                                                else if (['Own', 'Atchi', 'ஆட்சி', 'Moolatrikona'].some(v => dignity.toLowerCase().includes(v.toLowerCase()))) dColor = '#d97706'; // Orange
                                                else if (['Debilitated', 'Neecham', 'நீசம்'].some(v => dignity.toLowerCase().includes(v.toLowerCase()))) dColor = '#dc2626'; // Red
                                                else if (['Friendly', 'Natpu', 'நட்பு'].some(v => dignity.toLowerCase().includes(v.toLowerCase()))) dColor = '#2563eb'; // Blue

                                                return (
                                                    <TableRow key={i} hover sx={{ '& td': { fontSize: '0.75rem', py: 0.8 } }}>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>{p.tamilName || name}</TableCell>
                                                        <TableCell>{p.signTamil || p.signName || p.currentSign || '-'}</TableCell>
                                                        <TableCell>{p.nakshatraTamil || p.nakshatra || '-'}</TableCell>
                                                        <TableCell>{p.nakshatraLordTamil || p.nakshatraLord || '-'}</TableCell>
                                                        <TableCell sx={{ color: dColor, fontWeight: 'bold' }}>{dignity}</TableCell>
                                                    </TableRow>
                                                );
                                            }) : (
                                                <TableRow><TableCell colSpan={4} align="center">No details available</TableCell></TableRow>
                                            );
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Grid>
                </Grid>
            )}

            {tabIndex === 1 && <QuickSummaryTable data={player.birthChart} hideHeader={hideHeader} />}
            {tabIndex === 2 && <PanchangamGrid panchangam={chartData?.panchangam || player.birthChart?.panchangam} birthData={player.birthData} hideHeader={hideHeader} />}
        </Box>
    );
};

const PlayerRow = ({ player, matchChart, isSelected, onSelect, onEdit, onViewChart, hideHeader = false }) => {


    // Summary info for the row
    const chart = player.birthChart?.data || player.birthChart;
    const rasi = chart?.moonSign?.english || chart?.planets?.Moon?.sign || '-';
    // Use first letter of name for Avatar
    const avatarLetter = player.name ? player.name.charAt(0).toUpperCase() : '?';

    // Calculate Permissions if Match Chart is available
    let batResult = null;
    let bowlResult = null;

    if (matchChart && chart) {
        batResult = runPrediction(chart, matchChart.data || matchChart, "BAT");
        bowlResult = runPrediction(chart, matchChart.data || matchChart, "BOWL");
    }

    const isSpecialPlayer = batResult?.isSpecial || bowlResult?.isSpecial;

    return (
        <>
            <TableRow
                sx={{
                    '& > *': { borderBottom: hideHeader ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(16, 185, 129, 0.05)' },
                    cursor: 'pointer',
                    bgcolor: isSelected
                        ? (hideHeader ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)')
                        : 'inherit',
                    '&:hover': {
                        bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05) !important' : 'rgba(110, 231, 183, 0.05) !important'
                    }
                }}
                hover
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(player.id);
                }}
            >
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        checked={isSelected}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(player.id);
                        }}
                    />
                </TableCell>
                <TableCell width="20" />
                <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={player.profile}
                            alt={player.name}
                            sx={{
                                width: 44,
                                height: 44,
                                bgcolor: hideHeader ? visionPro.primary : '#10B981',
                                border: hideHeader ? 'none' : '2px solid rgba(110, 231, 183, 0.2)',
                                fontSize: '1.2rem'
                            }}
                        >
                            {avatarLetter}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {player.name} {getFlag(player)}
                                    {isSpecialPlayer && (
                                        <Chip
                                            label="SPECIAL"
                                            size="small"
                                            color="secondary"
                                            sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                                        />
                                    )}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(player);
                                    }}
                                    sx={{ p: 0.5 }}
                                >
                                    <span style={{ fontSize: '1rem' }}>✏️</span>
                                </IconButton>
                            </Box>
{/* ID Removed */}

                        </Box>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2">{player.birthPlace || 'Unknown'}</Typography>
                        </Box>
                         <Typography variant="caption" color="text.secondary" sx={{ ml: 2.3 }}>
                            {player.dob} {player.birthTime ? `| ${player.birthTime}` : ''}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PublicIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{player.timezone || '-'}</Typography>
                    </Box>
                </TableCell>

            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     {/* 3 Icons for Chart, Planets, Panchangam */}
                     <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onViewChart(player, 0); }}
                        sx={{
                            color: '#FF6F00',
                            borderColor: '#FF6F00',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            minWidth: 'auto',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'rgba(255, 111, 0, 0.1)', borderColor: '#FF6F00' }
                        }}
                     >
                        Rasi Details
                     </Button>

                    {matchChart && isSelected && (
                         <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                             <PredictionChip type="Bat" score={batResult?.score} report={batResult?.report} />
                             <PredictionChip type="Bowl" score={bowlResult?.score} report={bowlResult?.report} />
                         </Box>
                    )}
                </Box>
             </TableCell>
            </TableRow>

        </>
    );
};

const ChartPopup = ({ open, onClose, player, matchChart, initialTab = 0, hideHeader = false }) => {
    // Local state for fetched chart data
    const [fetchedChart, setFetchedChart] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && player) {
            setLoading(true);
            setFetchedChart(null);

            // Per User Request: "take call /birth-chart api"
            const dobParts = player.dob ? player.dob.split('-') : [];
            const timeParts = player.birthTime ? player.birthTime.split(':') : ['12', '00'];

            if (dobParts.length === 3) {
                const payload = {
                    year: dobParts[0], month: dobParts[1], day: dobParts[2],
                    hour: timeParts[0], minute: timeParts[1],
                    latitude: player.latitude || 13.0827,
                    longitude: player.longitude || 80.2707,
                    timezone: player.timezone || 5.5
                };

                axios.post('/api/charts/birth-chart', payload)
                    .then(res => {
                        console.log("API Response Data:", res.data);
                        setFetchedChart(res.data);
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Error fetching chart:", err);
                        setLoading(false);
                    });
            } else {
                setLoading(false);
            }
        }
    }, [open, player]);

    // Merge fetched chart into player object
    const playerWithChart = useMemo(() => {
        if (!player) return null;
        return { ...player, birthChart: fetchedChart || player.birthChart };
    }, [player, fetchedChart]);

    if (!player) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{
                bgcolor: visionPro.accent,
                color: visionPro.text,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${visionPro.border}`
            }}>
                <Box>
                    <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: 0.5 }}>{player.name}</Typography>
                    <Typography variant="caption" sx={{ color: visionPro.textSecondary }}>
                        {player.birthPlace} | {player.dob} {player.birthTime ? `| ${player.birthTime}` : ''}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: visionPro.text }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: visionPro.background }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <PlayerDetailPanel player={playerWithChart} matchChart={matchChart} initialTab={initialTab} hideHeader={hideHeader} />
                )}
            </DialogContent>
        </Dialog>
    );
};

// --- TAMIL RULES LIST (For Animation - Grouped for all 27 Stars) ---
const TAMIL_RULE_LIST = [
    { id: 1, label: "ராசி/நட்சத்திர பொருத்தம் (Rasi/Nakshatra Matching)" },
    { id: 2, label: "உச்சம்/நீசம் நிலைகள் (Exaltation/Debilitation Check)" },
    { id: 3, label: "பாஸ்கர ஜிக் ஜாக் விதி (ZigZag Rule - Parivarthana)" },
    { id: 4, label: "ஒரே வீடு இடமாற்றம் (Same House Rule)" },
    { id: 5, label: "கிரக சேர்க்கை விதிகள் (Conjunction Rules)" },
    { id: 6, label: "லக்ன ராசி அதிபதி விதி (Lagna/Rasi Lord Evaluation)" },
    { id: 7, label: "27 நட்சத்திர சிறப்பு விதிகள் (27 Star Special Rules)" },
    { id: 8, label: "வெற்றி வாய்ப்பு கணக்கீடு (Success Probability Logic)" }
];

// --- RULE APPLYING DIALOG ---
const RuleApplyingDialog = ({ open, completedRules }) => {
    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    bgcolor: '#FFFBF5',
                    p: 2,
                    border: '2px solid #FFC107'
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', color: '#FF6F00', fontWeight: '900', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={40} sx={{ color: '#FF6F00' }} />
                கணிப்பு விதிகள் சரிபார்க்கப்படுகிறது...
                <Typography variant="caption" sx={{ color: '#F57C00' }}>Applying Astrological Prediction Rules</Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    {TAMIL_RULE_LIST.map((rule, index) => {
                        const isCompleted = completedRules.includes(rule.id);
                        const isCurrent = !isCompleted && (index === 0 || completedRules.includes(TAMIL_RULE_LIST[index-1].id));

                        return (
                            <Box
                                key={rule.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: '12px',
                                    bgcolor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : (isCurrent ? 'rgba(255, 193, 7, 0.1)' : 'white'),
                                    border: '1px solid',
                                    borderColor: isCompleted ? '#4CAF50' : (isCurrent ? '#FFC107' : 'rgba(0,0,0,0.05)'),
                                    transition: 'all 0.3s ease',
                                    transform: isCurrent ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <Box sx={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    bgcolor: isCompleted ? '#4CAF50' : (isCurrent ? '#FFC107' : '#E0E0E0'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '0.8rem', fontWeight: 'bold'
                                }}>
                                    {isCompleted ? '✓' : (index + 1)}
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: isCompleted || isCurrent ? 'bold' : 'normal',
                                        color: isCompleted ? '#2E7D32' : (isCurrent ? '#FF6F00' : '#9E9E9E'),
                                        flexGrow: 1
                                    }}
                                >
                                    {rule.label}
                                </Typography>
                                {isCompleted && <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>APPLIED</Typography>}
                                {isCurrent && <CircularProgress size={16} sx={{ color: '#FF6F00' }} />}
                            </Box>
                        );
                    })}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

const MatchWizardDialog = ({ open, onClose, groups, token, hideHeader = false }) => {
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [matchChart, setMatchChart] = useState(null);
    const [results, setResults] = useState(null);
    const [filterA, setFilterA] = useState(false);
    const [filterB, setFilterB] = useState(false);
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '19:30',
        location: 'Mumbai',
        lat: 19.076,
        long: 72.877,
        timezone: 5.5
    });
    const [isFullView, setIsFullView] = useState(false);
    const wizardPredictionRef = useRef(null);

    // Rule Animation State
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
    const [completedRules, setCompletedRules] = useState([]);

    // Reset when opening or teams change
    useEffect(() => {
        if (!open) {
            setTeamA('');
            setTeamB('');
            setMatchChart(null);
            setResults(null);
            setRuleDialogOpen(false);
            setCompletedRules([]);
        }
    }, [open]);

    // Track expanded rules for players
    const [expandedRules, setExpandedRules] = useState({});

    const toggleRules = (pid) => {
        setExpandedRules(prev => ({ ...prev, [pid]: !prev[pid] }));
    };

    // Update selected players when teams change
    useEffect(() => {
        const newSelected = [];
        if (teamA) {
            const grp = groups.find(g => g._id === teamA);
            if (grp) newSelected.push(...grp.players.map(p => p.id));
        }
        if (teamB) {
            const grp = groups.find(g => g._id === teamB);
            if (grp) newSelected.push(...grp.players.map(p => p.id));
        }
        // Unique IDs
        setSelectedPlayers([...new Set(newSelected)]);
        setMatchChart(null);
        setResults(null);
    }, [teamA, teamB, groups]);

    const handleMatchReady = async (chart, details) => {
        console.log("=== MATCH CHART JSON ===", chart);
        console.log("=== MATCH DETAILS ===", details);

        // 1. Open Rule Dialog
        setRuleDialogOpen(true);
        setCompletedRules([]);

        // 2. Animate Rules Loop
        for (const rule of TAMIL_RULE_LIST) {
            await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay per rule
            setCompletedRules(prev => [...prev, rule.id]);
        }

        // Short pause after all done
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Process Actual Prediction
        setMatchChart(chart);
        if (details) setMatchDetails(details);
        const resDetails = {};
        let scoreA = 0;
        let scoreB = 0;
        let countA = 0;
        let countB = 0;

        const allPlayers = groups.flatMap(g => g.players);

        selectedPlayers.forEach(pid => {
            const p = allPlayers.find(ap => ap.id === pid);
            if (p && (p.birthChart?.data || p.birthChart)) {
                const pChart = p.birthChart.data || p.birthChart;
                const mChart = chart.data || chart;

                const bat = runPrediction(pChart, mChart, "BAT");
                const bowl = runPrediction(pChart, mChart, "BOWL");

                if (bat && bowl) {
                    // Save Result
                    resDetails[pid] = { bat, bowl };

                    // Add to team totals (Using MAX of Bat/Bowl as contribution)
                    const contribution = Math.max(bat.score, bowl.score);

                    const isTeamA = groups.find(g => g._id === teamA)?.players?.some(tp => tp.id === pid);
                    const isTeamB = groups.find(g => g._id === teamB)?.players?.some(tp => tp.id === pid);

                    if (isTeamA) { scoreA += contribution; countA++; }
                    else if (isTeamB) { scoreB += contribution; countB++; }
                }
            }
        });

        // Calculate Average Score (to normalize if team sizes differ)
        const avgA = countA > 0 ? (scoreA / countA).toFixed(1) : 0;
        const avgB = countB > 0 ? (scoreB / countB).toFixed(1) : 0;

        setResults({ details: resDetails, scoreA: avgA, scoreB: avgB, totalA: scoreA, totalB: scoreB });

        // 4. Close Rule Dialog
        setRuleDialogOpen(false);
    };

    // --- MOBILE RESPONSIVE HOOK ---
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const togglePlayer = (pid) => {
        if (selectedPlayers.includes(pid)) setSelectedPlayers(prev => prev.filter(id => id !== pid));
        else setSelectedPlayers(prev => [...prev, pid]);
    };

    const renderPlayerList = (teamId, teamName, filterActive, setFilterActive) => {
        const grp = groups.find(g => g._id === teamId);
        if (!grp) return null;

        const myScore = teamId === teamA ? results?.totalA : results?.totalB;
        const opponentScore = teamId === teamA ? results?.totalB : results?.totalA;
        const isWinner = results && Number(myScore) > Number(opponentScore);

        return (
            <Paper variant="outlined" sx={{
                p: isMobile ? 1 : 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: isWinner
                    ? (hideHeader ? 'rgba(76, 175, 80, 0.1)' : 'rgba(16, 185, 129, 0.1)')
                    : (hideHeader ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'), // Slightly darker bg for visibility
                borderColor: isWinner
                    ? (hideHeader ? 'success.main' : '#10B981')
                    : (hideHeader ? 'rgba(255, 255, 255, 0.1)' : 'rgba(167, 243, 208, 0.5)'),
                borderWidth: isWinner ? 2 : 1,
                borderRadius: '16px',
                color: hideHeader ? 'white' : '#1F2937' // Darker text for table readability
            }}>
                <Box sx={{
                    mb: 2,
                    borderBottom: 1,
                    borderColor: hideHeader ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 193, 7, 0.5)',
                    pb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                    gap: 1
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#FF6F00', fontSize: isMobile ? '0.8rem' : '1rem' }}>{teamName}</Typography>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                                setTimeout(() => {
                                    wizardPredictionRef.current?.runPrediction();
                                }, 100);
                            }}
                            sx={{
                                height: 24,
                                fontSize: '0.65rem',
                                px: 1,
                                bgcolor: '#FF6F00',
                                '&:hover': { bgcolor: '#E65100' },
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Predict
                        </Button>
                    </Box>
                    {results && (
                        <Chip label={`Score: ${myScore}`} color={isWinner ? "success" : "default"} variant={isWinner ? "filled" : "outlined"} size="small" />
                    )}
                </Box>

                {/* --- MOBILE VIEW (CARDS) --- */}
                {isMobile ? (
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
                        {/* Select All + Filter Button */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, pl: 1, gap: 1 }}>
                             <Checkbox
                                size="small"
                                indeterminate={
                                    grp.players.some(p => selectedPlayers.includes(p.id)) &&
                                    !grp.players.every(p => selectedPlayers.includes(p.id))
                                }
                                checked={grp.players.every(p => selectedPlayers.includes(p.id))}
                                onChange={() => {
                                    const allIds = grp.players.map(p => p.id);
                                    if (allIds.every(id => selectedPlayers.includes(id))) {
                                        setSelectedPlayers(prev => prev.filter(id => !allIds.includes(id)));
                                    } else {
                                        setSelectedPlayers(prev => [...new Set([...prev, ...allIds])]);
                                    }
                                }}
                            />
                            <Typography variant="caption" fontWeight="bold">Select All</Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Button
                                size="small"
                                variant={filterActive ? "contained" : "outlined"}
                                onClick={() => setFilterActive(!filterActive)}
                                sx={{
                                    fontSize: '0.65rem',
                                    px: 1.5,
                                    py: 0.3,
                                    borderRadius: '20px',
                                    bgcolor: filterActive ? '#FF6F00' : 'transparent',
                                    borderColor: '#FFC107',
                                    color: filterActive ? 'white' : '#FF6F00',
                                    '&:hover': { bgcolor: filterActive ? '#E65100' : 'rgba(255, 193, 7, 0.1)' }
                                }}
                            >
                                {filterActive ? '✓ Filtered' : 'Filter'}
                            </Button>
                        </Box>

                        {/* Player List - sorted by selection when filter is active */}
                        {[...grp.players]
                            .filter(p => !filterActive || selectedPlayers.includes(p.id))
                            .sort((a, b) => {
                                // 1. Matched Rules First (Score > 0)
                                if (results?.details) {
                                    const aScore = Math.max(results.details[a.id]?.bat?.score || 0, results.details[a.id]?.bowl?.score || 0);
                                    const bScore = Math.max(results.details[b.id]?.bat?.score || 0, results.details[b.id]?.bowl?.score || 0);
                                    if (aScore > 0 && bScore === 0) return -1;
                                    if (aScore === 0 && bScore > 0) return 1;
                                    if (aScore !== bScore) return bScore - aScore; // Highest score first
                                }

                                // 2. Selected First (if filter active)
                                if (filterActive) {
                                    const aSelected = selectedPlayers.includes(a.id);
                                    const bSelected = selectedPlayers.includes(b.id);
                                    if (aSelected && !bSelected) return -1;
                                    if (!aSelected && bSelected) return 1;
                                }
                                return 0;
                            })
                            .map(p => {
                            const isSel = selectedPlayers.includes(p.id);
                            const res = results?.details?.[p.id];
                            const dimmed = filterActive && !isSel;
                            return (
                                <Paper key={p.id} elevation={0} sx={{
                                    p: 1.5, mb: 1,
                                    border: '2px solid',
                                    borderColor: isSel ? '#FF6F00' : 'rgba(0,0,0,0.08)',
                                    bgcolor: isSel ? 'rgba(255, 111, 0, 0.08)' : 'white',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    opacity: dimmed ? 0.4 : 1,
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSel ? '0 2px 8px rgba(255, 111, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
                                }} onClick={() => results ? toggleRules(p.id) : togglePlayer(p.id)}>
                                    <Checkbox
                                        checked={isSel}
                                        size="small"
                                        sx={{ p: 0 }}
                                        onClick={(e) => { e.stopPropagation(); togglePlayer(p.id); }}
                                    />
                                    {/* Avatar Hidden on Mobile as per request */}
                                    {/* <Avatar src={p.profile} sx={{ width: 40, height: 40, fontSize: 14 }}>{p.name[0]}</Avatar> */}
                                    <Box sx={{ flexGrow: 1, ml: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.1} fontSize="0.85rem">{p.name}</Typography>

                                        {/* Prediction Chips (Moved Below Name) */}
                                        {res && (
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.2 }}>
                                                <Chip label={`B:${res.bat.score}`} size="small" sx={{ height: 18, fontSize: '0.65rem', px: 0.5, bgcolor: res.bat.score >= 1 ? '#e6fffa' : '#f3f4f6', color: res.bat.score >= 1 ? '#059669' : '#374151', border: '1px solid', borderColor: res.bat.score >= 1 ? '#10b981' : '#d1d5db' }}  />
                                                <Chip label={`Bw:${res.bowl.score}`} size="small" sx={{ height: 18, fontSize: '0.65rem', px: 0.5, bgcolor: res.bowl.score >= 1 ? '#e6fffa' : '#f3f4f6', color: res.bowl.score >= 1 ? '#059669' : '#374151', border: '1px solid', borderColor: res.bowl.score >= 1 ? '#10b981' : '#d1d5db'  }} />
                                            </Box>
                                        )}
                                    </Box>

                                    {/* RULES DISPLAY (Mobile) */}
                                    {res && expandedRules[p.id] && (
                                        <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                            <Typography variant="caption" fontWeight="bold" display="block" color="#000" sx={{ mb: 0.5 }}>Target Success List:</Typography>
                                            {[...(res.bat.logs || []), ...(res.bowl.logs || [])].map((log, i) => (
                                                <Typography key={i} variant="caption" display="block" color="#000" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                                    • {log}
                                                </Typography>
                                            ))}
                                            {(!res.bat.logs?.length && !res.bowl.logs?.length) && (
                                                <Typography variant="caption" color="#000">No specific rules matched.</Typography>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>
                ) : (
                /* --- DESKTOP VIEW (TABLE) --- */
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                    {/* Filter Button for Desktop */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, flexShrink: 0 }}>
                        <Button
                            size="small"
                            variant={filterActive ? "contained" : "outlined"}
                            onClick={() => setFilterActive(!filterActive)}
                            sx={{
                                fontSize: '0.7rem',
                                px: 2,
                                py: 0.5,
                                borderRadius: '20px',
                                bgcolor: filterActive ? '#FF6F00' : 'transparent',
                                borderColor: '#FFC107',
                                color: filterActive ? 'white' : '#FF6F00',
                                '&:hover': { bgcolor: filterActive ? '#E65100' : 'rgba(255, 193, 7, 0.1)' }
                            }}
                        >
                            {filterActive ? '✓ Filtered' : 'Filter Selected'}
                        </Button>
                    </Box>
                    <TableContainer sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, maxHeight: 'calc(100vh - 240px)' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ bgcolor: 'white' }}>
                                    <Checkbox
                                        size="small"
                                        indeterminate={
                                            grp.players.some(p => selectedPlayers.includes(p.id)) &&
                                            !grp.players.every(p => selectedPlayers.includes(p.id))
                                        }
                                        checked={grp.players.every(p => selectedPlayers.includes(p.id))}
                                        onChange={() => {
                                            const allIds = grp.players.map(p => p.id);
                                            const allSelected = allIds.every(id => selectedPlayers.includes(id));
                                            if (allSelected) {
                                                setSelectedPlayers(prev => prev.filter(id => !allIds.includes(id)));
                                            } else {
                                                setSelectedPlayers(prev => [...new Set([...prev, ...allIds])]);
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white', color: '#FF6F00' }}>Name</TableCell>
{/* ID Column Header Removed */}
                                {/* <TableCell sx={{ fontWeight: 'bold', bgcolor: 'transparent', color: '#FF6F00' }}>DOB / Time</TableCell> */}
                                {/* <TableCell sx={{ fontWeight: 'bold', bgcolor: 'transparent', color: '#FF6F00' }}>Place</TableCell> */}
                                {results && <TableCell sx={{ fontWeight: 'bold', bgcolor: 'white', color: '#FF6F00' }}>Pred.</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...grp.players]
                                .filter(p => !filterActive || selectedPlayers.includes(p.id))
                                .sort((a, b) => {
                                    // 1. Matched Rules First (Score > 0)
                                    if (results?.details) {
                                        const aScore = Math.max(results.details[a.id]?.bat?.score || 0, results.details[a.id]?.bowl?.score || 0);
                                        const bScore = Math.max(results.details[b.id]?.bat?.score || 0, results.details[b.id]?.bowl?.score || 0);
                                        if (aScore > 0 && bScore === 0) return -1;
                                        if (aScore === 0 && bScore > 0) return 1;
                                        if (aScore !== bScore) return bScore - aScore; // Highest score first
                                    }

                                    // 2. Selected First (if filter active)
                                    if (filterActive) {
                                        const aSelected = selectedPlayers.includes(a.id);
                                        const bSelected = selectedPlayers.includes(b.id);
                                        if (aSelected && !bSelected) return -1;
                                        if (!aSelected && bSelected) return 1;
                                    }
                                    return 0;
                                })
                                .map(p => {
                                const isSel = selectedPlayers.includes(p.id);
                                const res = results?.details?.[p.id];
                                const dimmed = filterActive && !isSel;
                                 const isSpecial = res?.bat?.isSpecial || res?.bowl?.isSpecial;
                                 return (
                                 <React.Fragment key={p.id}>
                                     <TableRow
                                         hover
                                         onClick={() => results ? toggleRules(p.id) : togglePlayer(p.id)}
                                         sx={{
                                             cursor: 'pointer',
                                             bgcolor: isSpecial ? 'rgba(212, 175, 55, 0.15)' : (isSel ? 'rgba(255, 111, 0, 0.08)' : 'inherit'),
                                             borderLeft: isSpecial ? '4px solid #D4AF37' : 'none',
                                             opacity: dimmed ? 0.4 : 1,
                                             transition: 'all 0.2s ease'
                                         }}
                                     >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isSel}
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); togglePlayer(p.id); }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar src={p.profile} sx={{ width: 24, height: 24, fontSize: 10 }}>{p.name[0]}</Avatar>
                                                <Typography variant="body2" fontWeight={isSel ? 'bold' : 'normal'}>
                                                    {p.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
{/* ID Cell Removed */}
                                        {/* <TableCell>
                                             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{p.dob}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.birthTime}</Typography>
                                             </Box>
                                        </TableCell> */}
                                        {/* <TableCell>
                                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 80, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.birthPlace}
                                            </Typography>
                                        </TableCell> */}
                                        {results && (
                                            <TableCell>
                                                {res ? (
                                                     <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Chip label={`B:${res.bat.score}`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} color={res.bat.score >= 1 ? 'success' : 'default'} />
                                                        <Chip label={`Bo:${res.bowl.score}`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} color={res.bowl.score >= 1 ? 'success' : 'default'} />
                                                    </Box>
                                                ) : <Typography variant="caption">-</Typography>}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    {/* RULES ROW (Desktop) */}
                                    {res && expandedRules[p.id] && (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ p: 0, borderBottom: 'none' }}>
                                                 <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <Typography variant="subtitle2" fontWeight="bold" color="#000" gutterBottom>Target Success List:</Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                         {[...(res.bat.logs || []), ...(res.bowl.logs || [])].map((log, i) => (
                                                            <Typography key={i} variant="body2" color="#000" sx={{ fontSize: '0.8rem' }}>
                                                                • {typeof log === 'object' ? `${log.en} / ${log.ta}` : log}
                                                            </Typography>
                                                        ))}
                                                        {(!res.bat.logs?.length && !res.bowl.logs?.length) && (
                                                            <Typography variant="body2" color="#000">No specific rules matched.</Typography>
                                                        )}
                                                    </Box>
                                                 </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                </Box>
                )}
            </Paper>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Slide}
        >
            {/* APP BAR - MATCH PREDICTION SETUP */}
            <AppBar position="static" sx={{ bgcolor: '#FF6F00', backgroundImage: visionPro.gradientPrimary, display: isFullView ? 'none' : 'block' }}>
                <Toolbar sx={{ gap: 1, py: 0.5 }}>



                    {/* Match Setup - Using MatchPredictionControl */}
                    <Box sx={{ flexGrow: 1 }}>
                        <MatchPredictionControl
                            ref={wizardPredictionRef}
                            onPredictionComplete={handleMatchReady}
                            token={token}
                        />
                    </Box>

                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* BREADCRUMBS: Match Details -> Team Selection */}
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', display: isFullView ? 'none' : 'block' }}>
                 <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                    <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                        Match Details
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center', color: '#FF6F00', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Team A vs Team B
                    </Typography>
                </Breadcrumbs>
            </Box>


            {/* MOBILE: FULL SCREEN TEAM SELECTION (when teams not selected) */}
            {(!teamA || !teamB) && (
                <Box sx={{
                    display: { xs: 'flex', sm: 'none' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'calc(100vh - 70px)',
                    bgcolor: visionPro.background,
                    p: 3,
                    gap: 3
                }}>
                    {/* Title */}
                    <Typography variant="h6" fontWeight="900" sx={{ color: '#FF6F00', textAlign: 'center' }}>
                        🏏 Select Teams to Start
                    </Typography>

                    {/* Team A */}
                    <FormControl fullWidth sx={{ maxWidth: 280 }}>
                        <InputLabel sx={{ fontWeight: 'bold', fontSize: '1rem' }}>TEAM A</InputLabel>
                        <Select
                            value={teamA}
                            label="TEAM A"
                            onChange={(e) => setTeamA(e.target.value)}
                            sx={{
                                '& .MuiSelect-select': { fontWeight: 'bold', color: '#FF6F00', fontSize: '1.1rem', py: 2 },
                                borderRadius: '14px',
                                bgcolor: 'rgba(255, 193, 7, 0.08)',
                                border: '2px solid #FFC107'
                            }}
                        >
                            {groups.map(g => <MenuItem key={g._id} value={g._id} sx={{ fontSize: '1rem' }}>{g.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    {/* VS Badge */}
                    <Box sx={{
                        width: 50, height: 50, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: visionPro.gradientPrimary, color: 'white',
                        boxShadow: '0 4px 16px rgba(255, 111, 0, 0.4)'
                    }}>
                        <Typography variant="subtitle1" fontWeight="900">VS</Typography>
                    </Box>

                    {/* Team B */}
                    <FormControl fullWidth sx={{ maxWidth: 280 }}>
                        <InputLabel sx={{ fontWeight: 'bold', fontSize: '1rem' }}>TEAM B</InputLabel>
                        <Select
                            value={teamB}
                            label="TEAM B"
                            onChange={(e) => setTeamB(e.target.value)}
                            sx={{
                                '& .MuiSelect-select': { fontWeight: 'bold', color: '#FF6F00', fontSize: '1.1rem', py: 2 },
                                borderRadius: '14px',
                                bgcolor: 'rgba(255, 193, 7, 0.08)',
                                border: '2px solid #FFC107'
                            }}
                        >
                            {groups.map(g => <MenuItem key={g._id} value={g._id} sx={{ fontSize: '1rem' }}>{g.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <Typography variant="caption" sx={{ color: visionPro.textSecondary, mt: 2 }}>
                        Select both teams to view players
                    </Typography>
                </Box>
            )}

            {/* DESKTOP: INLINE TEAM SELECTION (always visible on desktop, sticky on mobile) */}
            <Box sx={{
                display: { xs: (teamA && teamB) ? 'flex' : 'none', sm: 'flex' },
                flexDirection: 'row',
                alignItems: 'center',
                display: { xs: (teamA && teamB) ? 'flex' : 'none', sm: 'flex' },
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: { xs: 1, sm: 2 },
                py: 1.5,
                px: 1,
                bgcolor: visionPro.paper,
                borderBottom: `1px solid ${visionPro.border}`,
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                {/* TEAM A */}
                <FormControl size="small" sx={{ flex: 1, maxWidth: { xs: 130, sm: 180 } }}>
                    <InputLabel sx={{ fontWeight: 'bold' }}>TEAM A</InputLabel>
                    <Select
                        value={teamA}
                        label="TEAM A"
                        onChange={(e) => setTeamA(e.target.value)}
                        sx={{
                            '& .MuiSelect-select': { fontWeight: 'bold', color: '#FF6F00', fontSize: { xs: '0.8rem', sm: '1rem' } },
                            borderRadius: '10px',
                            bgcolor: 'rgba(255, 193, 7, 0.05)'
                        }}
                    >
                        {groups.map(g => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
                    </Select>
                </FormControl>

                {/* VS Badge */}
                <Box sx={{
                    width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 },
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: visionPro.gradientPrimary, color: 'white',
                    boxShadow: '0 3px 10px rgba(255, 111, 0, 0.35)',
                    flexShrink: 0
                }}>
                    <Typography variant="caption" fontWeight="900">VS</Typography>
                </Box>

                {/* TEAM B */}
                <FormControl size="small" sx={{ flex: 1, maxWidth: { xs: 130, sm: 180 } }}>
                    <InputLabel sx={{ fontWeight: 'bold' }}>TEAM B</InputLabel>
                    <Select
                        value={teamB}
                        label="TEAM B"
                        onChange={(e) => setTeamB(e.target.value)}
                        sx={{
                            '& .MuiSelect-select': { fontWeight: 'bold', color: '#FF6F00', fontSize: { xs: '0.8rem', sm: '1rem' } },
                            borderRadius: '10px',
                            bgcolor: 'rgba(255, 193, 7, 0.05)'
                        }}
                    >
                        {groups.map(g => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Button
                        variant="contained"
                        size="small"
                        onClick={() => wizardPredictionRef.current?.runPrediction()}
                        sx={{
                            bgcolor: '#FF6F00',
                            color: 'white',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            minWidth: 'auto',
                            px: 1,
                            '&:hover': { bgcolor: '#E65100' },
                            display: isFullView ? 'inline-flex' : 'none'
                        }}
                     >
                        Predict
                     </Button>
                     <IconButton onClick={() => setIsFullView(!isFullView)} color="primary" sx={{ p:0.5 }}>
                        {isFullView ? <FullscreenExitIcon /> : <FullscreenIcon />}
                     </IconButton>
                </Box>
            </Box>

            {/* SIDE BY SIDE PLAYER TABLES - Only show when both teams selected */}
            <Box sx={{
                flexGrow: 1,
                display: (teamA && teamB) ? 'flex' : 'none',
                gap: 1,
                p: 1,
                overflow: 'hidden',
                height: 'calc(100vh - 130px)'
            }}>
                {teamA && teamB ? (
                    <>
                        {/* TEAM A - LEFT */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {renderPlayerList(teamA, groups.find(g => g._id === teamA)?.name, filterA, setFilterA)}
                        </Box>
                        {/* TEAM B - RIGHT */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {renderPlayerList(teamB, groups.find(g => g._id === teamB)?.name, filterB, setFilterB)}
                        </Box>
                    </>
                ) : (
                    <Box sx={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: 2, color: 'text.secondary'
                    }}>
                        <SportsCricketIcon sx={{ fontSize: 80, opacity: 0.3 }} />
                        <Typography variant="h6" color="text.secondary">Select both teams to view players</Typography>
                        <Typography variant="body2" color="text.secondary">இரண்டு அணிகளையும் தேர்வு செய்யவும்</Typography>
                    </Box>
                )}
            </Box>

            {/* MATCH CHART POPUP */}
            {matchChart && (
                <Dialog
                    open={!!matchChart}
                    onClose={() => setMatchChart(null)}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 2 } }}
                >
                    <DialogTitle sx={{
                        bgcolor: '#059669',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1
                    }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            📊 Match Chart - {matchDetails.date} {matchDetails.time} | {matchDetails.location}
                        </Typography>
                        <IconButton onClick={() => setMatchChart(null)} size="small" sx={{ color: 'white' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        {/* Dignity Summary with Colors */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>கிரக பலன் சுருக்கம்</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {Object.entries(matchChart.planets || {}).map(([planet, data]) => (
                                    <Chip
                                        key={planet}
                                        label={`${planet}: ${data.dignityTamil}`}
                                        size="small"
                                        sx={{
                                            bgcolor: data.dignityColor || '#708090',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* Planet Details Table */}
                        <Paper sx={{ overflow: 'auto', maxHeight: '400px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#000' }}>
                                <thead>
                                    <tr style={{ background: '#059669', color: 'white' }}>
                                        <th style={{ padding: 8 }}>கிரகம்</th>
                                        <th style={{ padding: 8 }}>ராசி</th>
                                        <th style={{ padding: 8 }}>நட்சத்திரம்</th>
                                        <th style={{ padding: 8 }}>நட்சத்திர நாதன்</th>
                                        <th style={{ padding: 8 }}>பாதம்</th>
                                        <th style={{ padding: 8 }}>நிலை</th>
                                        <th style={{ padding: 8 }}>டிகிரி</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(matchChart.planets || {}).map(([planet, data]) => (
                                        <tr key={planet} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>{planet}</td>
                                            <td style={{ padding: 8 }}>{data.signTamil} ({data.sign})</td>
                                            <td style={{ padding: 8 }}>{data.nakshatraTamil}</td>
                                            <td style={{ padding: 8 }}>{data.nakshatraLordTamil || data.nakshatraLord}</td>
                                            <td style={{ padding: 8, textAlign: 'center' }}>{data.pada}</td>
                                            <td style={{
                                                padding: 8,
                                                color: data.dignityColor,
                                                fontWeight: 'bold',
                                                backgroundColor: `${data.dignityColor}20`
                                            }}>
                                                {data.dignityTamil}
                                            </td>
                                            <td style={{ padding: 8 }}>{data.formattedDegree}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Paper>

                        {/* RASI CHART WITH DIGNITY COLORS */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Box sx={{
                                border: '2px solid #059669',
                                borderRadius: 2,
                                p: 1,
                                bgcolor: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
                                    📊 இராசி கட்டம் (Dignity Colors)
                                </Typography>
                                <RasiChart
                                    data={(() => {
                                        // Transform planets data to houses format
                                        if (!matchChart.planets) return {};

                                        // Sign name to number mapping
                                        const signToNum = {
                                            'Aries': 1, 'Taurus': 2, 'Gemini': 3, 'Cancer': 4,
                                            'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Scorpio': 8,
                                            'Sagittarius': 9, 'Capricorn': 10, 'Aquarius': 11, 'Pisces': 12
                                        };

                                        // Build houses with planets
                                        const houses = {};
                                        for (let i = 1; i <= 12; i++) {
                                            houses[i] = { signNumber: i, planets: [], lord: '' };
                                        }

                                        // Add Lagna/Ascendant
                                        if (matchChart.ascendant) {
                                            const lagnaSign = signToNum[matchChart.ascendant.name] || 1;
                                            houses[lagnaSign].planets.push('Lagna');
                                        }

                                        // Add planets to their signs
                                        Object.entries(matchChart.planets).forEach(([planet, data]) => {
                                            const signNum = signToNum[data.sign];
                                            if (signNum && houses[signNum]) {
                                                houses[signNum].planets.push(planet);
                                            }
                                        });

                                        return { houses };
                                    })()}
                                    planetsData={matchChart.planets}
                                    style={{ width: '280px' }}
                                />
                            </Box>
                        </Box>

                        {/* Lagna Info */}
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#ecfdf5', borderRadius: 1, border: '1px solid #059669' }}>
                            <Typography variant="body2" fontWeight="bold">
                                🏠 லக்னம்: {matchChart.ascendant?.tamil} ({matchChart.ascendant?.name}) |
                                ⭐ நட்சத்திரம்: {matchChart.ascendant?.nakshatra?.tamil} |
                                அதிபதி: {matchChart.ascendant?.nakshatra?.lordTamil || matchChart.ascendant?.nakshatra?.lord || '-'}
                            </Typography>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}

            {/* RULE ANIMATION POPUP */}
            <RuleApplyingDialog open={ruleDialogOpen} completedRules={completedRules} />

        </Dialog>
    );
};

const PlayerMobileCard = ({ player, matchChart, isSelected, onSelect, onEdit, onViewChart, hideHeader = false }) => {
    const [expanded, setExpanded] = useState(false);

    // Summary info
    const chart = player.birthChart?.data || player.birthChart;
    const rasi = chart?.moonSign?.english || chart?.planets?.Moon?.sign || '-';

    // Prediction Logic
    let batResult = null;
    let bowlResult = null;
    if (matchChart && chart && isSelected) {
        batResult = runPrediction(chart, matchChart.data || matchChart, "BAT");
        bowlResult = runPrediction(chart, matchChart.data || matchChart, "BOWL");
    }

    return (
        <Card sx={{
            mb: 2,
            borderRadius: 2,
            bgcolor: isSelected ? 'rgba(16, 185, 129, 0.05)' : (hideHeader ? 'rgba(255,255,255,0.05)' : 'white'),
            border: isSelected ? '1px solid #10B981' : (hideHeader ? '1px solid rgba(255,255,255,0.1)' : 'none'),
            boxShadow: hideHeader ? 'none' : 1
        }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Checkbox */}
                    <Checkbox
                        checked={isSelected}
                        onClick={(e) => { e.stopPropagation(); onSelect(player.id); }}
                        size="small"
                        sx={{ p: 0 }}
                    />

                    {/* Avatar */}
                     <Avatar
                        src={player.profile}
                        sx={{
                            width: 48, height: 48,
                            bgcolor: hideHeader ? visionPro.primary : '#10B981',
                            fontSize: '1.2rem',
                            border: '2px solid rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        {player.name ? player.name[0] : '?'}
                    </Avatar>

                    {/* Info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                    {player.name} {getFlag(player)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                    {player.birthPlace || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {player.dob} | {player.birthTime}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => setExpanded(!expanded)}
                                sx={{
                                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    color: visionPro.primary
                                }}
                            >
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>

                {/* Actions Row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                     <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            startIcon={<span style={{ fontSize: 14 }}>✏️</span>}
                            onClick={() => onEdit(player)}
                            sx={{ color: 'text.secondary', fontSize: '0.75rem', minWidth: 0 }}
                        >
                            Edit
                        </Button>
                        <Button
                            size="small"
                            startIcon={<GridOnIcon sx={{ fontSize: 16 }} />}
                            onClick={() => onViewChart(player)}
                            sx={{ color: visionPro.primary, fontSize: '0.75rem', minWidth: 0 }}
                        >
                            Chart
                        </Button>
                     </Box>

                     {/* Prediction / Rasi Chip */}
                    {matchChart && isSelected ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={`Bat:${batResult?.score || 0}`} size="small" color={batResult?.score > 0 ? "success" : "default"} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                            <Chip label={`Bowl:${bowlResult?.score || 0}`} size="small" color={bowlResult?.score > 0 ? "success" : "default"} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        </Box>
                    ) : (
                         <Chip
                            label={`Rasi: ${rasi}`}
                            size="small"
                            color={rasi !== '-' ? "primary" : "default"}
                            variant={rasi !== '-' ? "outlined" : "filled"}
                            sx={{ height: 24, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>

                {/* Expanded Details */}
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2 }}>
                        <PlayerDetailPanel player={player} matchChart={matchChart} hideHeader={hideHeader} />
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

const UserDashboard = ({ hideHeader = false }) => {
    const { logout, token } = useContext(AuthContext);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

    // Groups State
    const [groups, setGroups] = useState([]);
    const [showTeams, setShowTeams] = useState(false);

    // Prediction State
    const [showPrediction, setShowPrediction] = useState(false);
    const [matchChart, setMatchChart] = useState(null);
    const [chartPopupOpen, setChartPopupOpen] = useState(false);
    const [chartPopupPlayer, setChartPopupPlayer] = useState(null);
    const [matchWizardOpen, setMatchWizardOpen] = useState(false);
    const dashboardPredictionRef = useRef(null);

    // View State - Controls which view is shown (home, players, prediction)
    const [currentView, setCurrentView] = useState('home');

    // Selection Handlers
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = players.map((n) => n.id);
            setSelectedPlayerIds(newSelecteds);
            return;
        }
        setSelectedPlayerIds([]);
    };

    const handleSelectClick = (id) => {
        const selectedIndex = selectedPlayerIds.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedPlayerIds, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedPlayerIds.slice(1));
        } else if (selectedIndex === selectedPlayerIds.length - 1) {
            newSelected = newSelected.concat(selectedPlayerIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedPlayerIds.slice(0, selectedIndex),
                selectedPlayerIds.slice(selectedIndex + 1),
            );
        }
        setSelectedPlayerIds(newSelected);
    };

    const isSelected = (id) => selectedPlayerIds.indexOf(id) !== -1;

    // --- EDIT PLAYER LOGIC ---
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [editForm, setEditForm] = useState({});
    // State for popup tab (0=Chart, 1=Planets, 2=Panchangam)
    const [chartPopupTab, setChartPopupTab] = useState(0);

    const handleEditClick = (player) => {
        setEditingPlayer(player);
        setEditForm({
            name: player.name || '',
            profile: player.profile || '',
            dob: player.dob || '',
            birthTime: player.birthTime || '',
            birthPlace: player.birthPlace || '',
            timezone: player.timezone || '',
            // Flatten birthChart helper fields if needed, but usually we just allow editing raw text if complex,
            // OR simpler fields. User asked for DOB, Place, Time...
            // Assuming DOB is string for now as per display.
            // Ideally we'd validte dates.
        });
        setEditDialogOpen(true);
    };

    const handleEditClose = () => {
        setEditDialogOpen(false);
        setEditingPlayer(null);
    };

    const handleSavePlayer = async () => {
        try {
            const authToken = token || localStorage.getItem('x-auth-token');
            // Optimistic update or wait? Wait.

            // Assuming we use custom 'id' for URL parameter based on controller logic
            await axios.put(`${baseUrl}/api/players/${editingPlayer.id}`, editForm, {
                headers: { 'x-auth-token': authToken }
            });

            // Refresh list (or update locally)
            setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...editForm } : p));
            setEditDialogOpen(false);
            // Optionally show success snackbar
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update player");
        }
    };

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';



    // Fetch Data (Players & Groups)
    useEffect(() => {
        const incrementView = async () => {
            try {
                await axios.post(`${baseUrl}/api/auth/increment-view`);
            } catch (e) { console.error("Could not increment view", e); }
        };
        incrementView();

        const fetchData = async () => {
             try {
                // Use token from Context first, then localStorage
                const authToken = token || localStorage.getItem('x-auth-token');
                if(!authToken) return;

                // 1. Fetch Players
                const res = await axios.get(`${baseUrl}/api/players?page=${page + 1}&limit=${rowsPerPage}`, {
                    headers: { 'x-auth-token': authToken }
                });

                // Handle new paginated response structure
                if (res.data.players) {
                    setPlayers(res.data.players);
                } else {
                     setPlayers(res.data);
                }

                if (res.data.totalPlayers) {
                     setTotalPlayers(res.data.totalPlayers);
                }

                // 2. Fetch Groups (Teams)
                const groupRes = await axios.get(`${baseUrl}/api/groups`, {
                    headers: { 'x-auth-token': authToken }
                });
                setGroups(groupRes.data);

            } catch (err) {
                console.error("Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, baseUrl, page, rowsPerPage]);

    // ===== HOME PAGE COMPONENT WITH QUICK ACTIONS =====
    const HomePage = () => {
        const quickActions = [
            {
                id: 'prediction',
                title: 'Prediction Wizard',
                desc: 'Start match prediction',
                icon: '🏏',
                color: '#FF6F00',
                isPrimary: true // Prominent CTA
            },
            {
                id: 'players',
                title: 'All Players',
                desc: `${players.length} players available`,
                icon: '👥',
                color: '#FFC107'
            },
            {
                id: 'teams',
                title: 'Teams',
                desc: `${groups.length} teams created`,
                icon: '🏟️',
                color: '#FF9800'
            },
        ];

        return (
            <Box sx={{ px: 2, py: 3 }}>
                {/* Welcome Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ color: visionPro.text, mb: 1 }}>
                        🏏 Cricket Astro Prediction
                    </Typography>
                    <Typography variant="body2" sx={{ color: visionPro.textSecondary }}>
                        Select an action to get started
                    </Typography>
                </Box>

                {/* PROMINENT PREDICTION WIZARD BUTTON */}
                <Paper
                    elevation={0}
                    onClick={() => setMatchWizardOpen(true)}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: '20px',
                        background: visionPro.gradientPrimary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        boxShadow: '0 8px 24px rgba(255, 111, 0, 0.35)',
                        transition: 'all 0.2s ease',
                        '&:active': { transform: 'scale(0.98)', opacity: 0.9 }
                    }}
                >
                    <Box sx={{
                        width: 60, height: 60,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem'
                    }}>
                        🏏
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="900" sx={{ color: 'white' }}>
                            Start Prediction Wizard
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Predict match outcomes with astrology
                        </Typography>
                    </Box>
                    <Box sx={{ fontSize: '1.5rem', color: 'white' }}>→</Box>
                </Paper>

                {/* QUICK ACTION CARDS - Equal Size Grid */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {quickActions.filter(a => !a.isPrimary).map(action => (
                        <Grid item xs={6} key={action.id}>
                            <Paper
                                elevation={0}
                                onClick={() => setCurrentView(action.id)}
                                sx={{
                                    p: 2,
                                    height: '140px', // Fixed height for equal sizes
                                    borderRadius: '16px',
                                    bgcolor: visionPro.paper,
                                    border: `1px solid ${visionPro.border}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s ease',
                                    '&:active': { transform: 'scale(0.97)', opacity: 0.9 }
                                }}
                            >
                                <Box sx={{
                                    width: 56, height: 56,
                                    borderRadius: '16px',
                                    bgcolor: `${action.color}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    mb: 1.5
                                }}>
                                    {action.icon}
                                </Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ color: visionPro.text, textAlign: 'center' }}>
                                    {action.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: visionPro.textSecondary, textAlign: 'center' }}>
                                    {action.desc}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* STATS SUMMARY */}
                <Paper
                    elevation={0}
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: visionPro.paper,
                        border: `1px solid ${visionPro.border}`
                    }}
                >
                    <Typography variant="caption" fontWeight="bold" sx={{ color: visionPro.textSecondary, mb: 1.5, display: 'block' }}>
                        📊 Quick Stats
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="900" sx={{ color: '#FF6F00' }}>{players.length}</Typography>
                            <Typography variant="caption" sx={{ color: visionPro.textSecondary }}>Players</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="900" sx={{ color: '#FFC107' }}>{groups.length}</Typography>
                            <Typography variant="caption" sx={{ color: visionPro.textSecondary }}>Teams</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        );
    };

    // Render Teams Section
    const renderTeams = () => (
        <Paper sx={{
            p: 2,
            mb: 4,
            borderRadius: '24px',
            bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : visionPro.paper,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${hideHeader ? 'rgba(255, 255, 255, 0.1)' : visionPro.border}`,
            boxShadow: hideHeader ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.3)'
        }} elevation={0}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: hideHeader ? visionPro.secondary : visionPro.primary, fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                    <span className="mr-2">🏏</span>
                   Active Teams ({groups.length})
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setMatchWizardOpen(true)}
                        sx={{
                            mr: 2,
                            bgcolor: visionPro.primary,
                            color: '#fff',
                            '&:hover': { bgcolor: '#047857' },
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            textTransform: 'none'
                        }}
                        startIcon={<SportsCricketIcon />}
                    >
                        Start Prediction Wizard
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowTeams(!showTeams)}
                        sx={{
                            color: visionPro.primary,
                            borderColor: visionPro.primary,
                            fontWeight: 'bold',
                            '&:hover': {
                                borderColor: '#047857',
                                bgcolor: 'rgba(5, 150, 105, 0.05)'
                            }
                        }}
                    >
                        {showTeams ? "Hide Teams" : "Expand All"}
                    </Button>
                </Box>
            </Box>

            <Collapse in={showTeams}>
                <Grid container spacing={2}>
                    {groups.map(group => (
                        <Grid item xs={12} sm={6} md={4} key={group._id}>
                            <Card variant="outlined" sx={{
                                borderRadius: '16px',
                                bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                                borderColor: hideHeader ? 'rgba(255, 255, 255, 0.1)' : visionPro.border,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: hideHeader ? visionPro.primary : visionPro.primary,
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                }
                            }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold">{group.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {group.players.length} Players
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                        {group.players.slice(0, 5).map(p => (
                                            <Chip key={p._id} label={p.name} size="small" sx={{ fontSize: '0.7rem' }} />
                                        ))}
                                        {group.players.length > 5 && <Chip label={`+${group.players.length - 5}`} size="small" variant="outlined" />}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {groups.length === 0 && (
                        <Grid item xs={12}>
                             <Typography color="text.secondary" align="center">No teams created yet.</Typography>
                        </Grid>
                    )}
                </Grid>
            </Collapse>
        </Paper>
    );

    // Handle Match Prediction Result
    const handlePredictionReady = (chartData) => {
        setMatchChart(chartData);
    };

    // Filter Logic
    const filteredPlayers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        if (!lowerSearch) return players;

        return players.filter(p => {
            // Flatten generic data for search
            const basicMatch = (
                p.name?.toLowerCase().includes(lowerSearch) ||
                p.birthPlace?.toLowerCase().includes(lowerSearch) ||
                p.id?.toString().includes(lowerSearch)
            );

            // Deep search into chart data if exists
            let chartMatch = false;
            const chart = p.birthChart?.data || p.birthChart;
            if (chart) {
                const rasiEng = chart.moonSign?.english?.toLowerCase();
                const rasiTam = chart.moonSign?.tamil?.toLowerCase();
                const nak = chart.moonNakshatra?.name?.toLowerCase();

                if (rasiEng?.includes(lowerSearch) || rasiTam?.includes(lowerSearch) || nak?.includes(lowerSearch)) {
                    chartMatch = true;
                }
            }

            return basicMatch || chartMatch;
        });
    }, [searchTerm, players]);

    const paginatedPlayers = filteredPlayers; // Server handles pagination now

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: hideHeader ? 'transparent' : visionPro.background,
            color: hideHeader ? '#fff' : visionPro.text,
            backgroundImage: hideHeader
                ? 'none'
                : `radial-gradient(circle at 50% 50%, rgba(255, 193, 7, 0.05) 0%, transparent 50%), radial-gradient(circle at 10% 10%, rgba(255, 152, 0, 0.05) 0%, transparent 40%)`,
        }}>
             {/* Header */}
            {!hideHeader && (
                <AppBar position="sticky" sx={{
                    bgcolor: visionPro.secondary,
                    backgroundImage: visionPro.gradientPrimary,
                    backdropFilter: 'blur(10px)',
                    borderBottom: `1px solid ${visionPro.border}`,
                    boxShadow: '0 4px 20px rgba(255, 111, 0, 0.25)'
                }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        {/* Left Side Logo */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color:'white',
                            gap: 2
                        }}>
                            <img
                                src="/logo.png"
                                alt="S&B Entertainment"
                                style={{
                                    objectFit: 'contain',
                                    height: '50px',
                                    width: '50px',
                                    borderRadius: '50%',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                }}
                                className="header-logo"
                            />
                            <h2 style={{color:'white', margin: 0, fontSize: '1.5rem'}}><b>S&B Astro</b></h2>
                        </Box>

                        {/* Logout Button */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<ExitToAppIcon />}
                                onClick={logout}
                                sx={{
                                    borderRadius: '12px',
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0))',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    backdropFilter: 'blur(5px)',
                                    // Hide text on mobile, show icon only
                                    '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                                    minWidth: { xs: 40, sm: 'auto' },
                                    px: { xs: 1, sm: 2 }
                                }}
                            >
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Logout</Box>
                            </Button>
                        </Box>
                    </Toolbar>
                </AppBar>
            )}

            <Container maxWidth="xl" sx={{ mt: hideHeader ? 4 : 0, pb: 8 }}>

                {/* CONDITIONAL VIEW RENDERING */}
                {currentView === 'home' ? (
                    <HomePage />
                ) : (
                    <>
                        {/* BACK BUTTON HEADER */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 3,
                            pt: 2
                        }}>
                            <Button
                                variant="text"
                                onClick={() => setCurrentView('home')}
                                sx={{
                                    color: visionPro.secondary,
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: 'rgba(255, 111, 0, 0.08)' }
                                }}
                            >
                                ← Back
                            </Button>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: visionPro.text }}>
                                {currentView === 'players' ? '👥 All Players' : currentView === 'teams' ? '🏟️ Teams' : ''}
                            </Typography>
                        </Box>

                        {/* TEAMS VIEW */}
                        {currentView === 'teams' && renderTeams()}

                        {/* PLAYERS VIEW - Search Bar + Player Table */}
                        {currentView === 'players' && (
                            <>
                {/* Search Bar */}
                <Paper sx={{
                    p: 2,
                    mb: 4,
                    borderRadius: '24px',
                    bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : visionPro.paper,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${hideHeader ? 'rgba(255, 255, 255, 0.1)' : visionPro.border}`,
                    boxShadow: hideHeader ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.08)'
                }} elevation={0}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                         {/* Selection Info */}
                        {selectedPlayerIds.length > 0 && (
                            <Chip label={`${selectedPlayerIds.length} Selected`} color="primary" onDelete={() => setSelectedPlayerIds([])} />
                        )}
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search by Name, City, ID, Rasi, or Nakshatra..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: hideHeader ? '#718096' : visionPro.primary }} />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: '16px',
                                    bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : visionPro.background,
                                    color: visionPro.text,
                                    '& fieldset': { borderColor: visionPro.border },
                                    '&:hover fieldset': { borderColor: visionPro.primary },
                                    '&.Mui-focused fieldset': { borderColor: visionPro.primary },
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            disabled={!showPrediction && selectedPlayerIds.length === 0}
                            startIcon={<SportsCricketIcon />}
                            onClick={() => {
                                setShowPrediction(!showPrediction);
                                if(showPrediction) setMatchChart(null);
                            }}
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                px: 3,
                                fontWeight: '900',
                                color: '#fff',
                                bgcolor: visionPro.secondary,
                                '&:hover': {
                                    bgcolor: '#E65100',
                                    transform: 'scale(1.02)'
                                },
                                '&:active': { transform: 'scale(0.98)' },
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(255, 111, 0, 0.35)'
                            }}
                        >
                            {showPrediction ? "Close Prediction" : "Predict Match"}
                        </Button>
                    </Box>
                </Paper>

                {/* Match Prediction Control */}
                <Collapse in={showPrediction}>
                    <MatchPredictionControl ref={dashboardPredictionRef} onPredictionComplete={handlePredictionReady} token={token} />
                </Collapse>

                {/* Content Area */}
                {renderTeams()}
                <Paper sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: hideHeader ? 'none' : 2,
                    bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    backdropFilter: hideHeader ? 'blur(10px)' : 'none',
                    border: hideHeader ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                }}>
                    {loading ? (
                        <Box sx={{ p: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress size={40} thickness={4} />
                            <Typography variant="body2" color="text.secondary">Loading Astronomy Data...</Typography>
                        </Box>
                    ) : (
                        <>
                            {isMobile ? (
                                <Box sx={{
                                    p: 2,
                                    bgcolor: hideHeader ? 'transparent' : '#f8fafc',
                                    maxHeight: 'calc(100vh - 350px)',
                                    overflowY: 'auto'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                                         <Typography variant="subtitle2" color="text.secondary">
                                            {paginatedPlayers.length} Players Found
                                         </Typography>
                                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Checkbox
                                                checked={players.length > 0 && selectedPlayerIds.length === players.length}
                                                indeterminate={selectedPlayerIds.length > 0 && selectedPlayerIds.length < players.length}
                                                onChange={handleSelectAllClick}
                                                size="small"
                                            />
                                            <Typography variant="caption" fontWeight="bold">Select All</Typography>
                                         </Box>
                                    </Box>

                                    {paginatedPlayers.length > 0 ? (
                                        paginatedPlayers.map(player => (
                                            <PlayerMobileCard
                                                key={player._id || player.id}
                                                player={player}
                                                matchChart={matchChart}
                                                isSelected={isSelected(player.id)}
                                                onSelect={handleSelectClick}
                                                onEdit={handleEditClick}
                                                onViewChart={(p) => {
                                                    setChartPopupPlayer(p);
                                                    setChartPopupOpen(true);
                                                }}
                                                hideHeader={hideHeader}
                                            />
                                        ))
                                    ) : (
                                        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                            No players found
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                            <TableContainer sx={{ maxHeight: 'calc(100vh - 450px)', overflow: 'auto' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" sx={{ bgcolor: visionPro.accent, borderBottom: `1px solid ${visionPro.border}` }}>
                                                <Checkbox
                                                    color="primary"
                                                    indeterminate={selectedPlayerIds.length > 0 && selectedPlayerIds.length < players.length}
                                                    checked={players.length > 0 && selectedPlayerIds.length === players.length}
                                                    onChange={handleSelectAllClick}
                                                    inputProps={{
                                                        'aria-label': 'select all players',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell width="50" sx={{ bgcolor: visionPro.accent, color: visionPro.text, borderBottom: `1px solid ${visionPro.border}` }} />
                                            <TableCell sx={{ bgcolor: visionPro.accent, color: visionPro.text, fontWeight: 'bold', borderBottom: `1px solid ${visionPro.border}` }}>PLAYER PROFILE</TableCell>
                                            <TableCell sx={{ bgcolor: visionPro.accent, color: visionPro.text, fontWeight: 'bold', borderBottom: `1px solid ${visionPro.border}` }}>BIRTH PLACE</TableCell>
                                            <TableCell sx={{ bgcolor: visionPro.accent, color: visionPro.text, fontWeight: 'bold', borderBottom: `1px solid ${visionPro.border}` }}>TIMEZONE</TableCell>
                                            <TableCell sx={{ bgcolor: visionPro.accent, color: visionPro.text, fontWeight: 'bold', borderBottom: `1px solid ${visionPro.border}` }}>
                                                {matchChart ? "PREDICTION RESULT (BAT / BOWL)" : "CHART SUMMARY"}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedPlayers.length > 0 ? (
                                            paginatedPlayers.map((player) => {
                                                const isItemSelected = isSelected(player.id);
                                                return (
                                                    <PlayerRow
                                                        key={player._id || player.id}
                                                        player={player}
                                                        matchChart={matchChart}
                                                        isSelected={isItemSelected}
                                                        onSelect={handleSelectClick}
                                                        onEdit={handleEditClick}
                                                        onViewChart={(p, tabIndex = 0) => {
                                                            setChartPopupPlayer(p);
                                                            setChartPopupTab(tabIndex);
                                                            setChartPopupOpen(true);
                                                        }}
                                                        hideHeader={hideHeader}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">No players found matching "{searchTerm}"</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            )}
                            <TablePagination
                                rowsPerPageOptions={[11, 25, 50, 100]}
                                component="div"
                                count={totalPlayers}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </>
                    )}
                </Paper>
                            </>
                        )}
                    </>
                )}

                {/* POPUPS */}
                <ChartPopup
                    open={chartPopupOpen}
                    onClose={() => setChartPopupOpen(false)}
                    player={chartPopupPlayer}
                    matchChart={matchChart}
                    initialTab={chartPopupTab}
                    hideHeader={hideHeader}
                />
                <MatchWizardDialog open={matchWizardOpen} onClose={() => setMatchWizardOpen(false)} groups={groups} token={token} hideHeader={hideHeader} />


            </Container>
        </Box>
    );
};

export default UserDashboard;