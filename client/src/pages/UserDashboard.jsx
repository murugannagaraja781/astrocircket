import React, { useContext, useState, useEffect, useMemo } from 'react';
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
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Switch, Checkbox, Slide
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

// --- COLOR PALETTE (CSK THEME - YELLOW/GREEN/ORANGE) ---
const visionPro = {
    background: '#F0FDF4', // Light Green
    paper: '#FFFFFF', // Clean White
    primary: '#F9CD05', // CSK Yellow
    secondary: '#F97316', // Orange
    accent: '#FFD600', // Yellow Warm
    text: '#004D40', // Dark Green
    textSecondary: '#00695C', // Dark Teal
    border: 'rgba(0, 77, 64, 0.12)', // Subtle Dark Green Border
    success: '#10B981', // Success Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Error Red
    gradientPrimary: 'linear-gradient(90deg, #F9CD05, #F97316)',
    gradientWarm: 'linear-gradient(135deg, #F9CD05 0%, #F97316 100%)',
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
                {report && report.map((r, i) => <div key={i}>• {r}</div>)}
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
const PlayerDetailPanel = ({ player, matchChart, hideHeader = false }) => {
    const [tabIndex, setTabIndex] = useState(0);

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
                                <Typography key={i} variant="caption" display="block" sx={{ color: 'green' }}>✓ {log}</Typography>
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
                                <Typography key={i} variant="caption" display="block" sx={{ color: 'green' }}>✓ {log}</Typography>
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

            {/* Debug Data Structure - Remove in Prod */}
            {/* <Box sx={{ p: 1, bgcolor: '#000', color: '#0f0', fontSize: 10, overflow: 'auto', maxHeight: 100 }}>
                Keys: {JSON.stringify(Object.keys(chartData || {}))}
                Planets: {JSON.stringify(chartData?.planets ? 'Yes' : 'No')}
            </Box> */}

            {tabIndex === 0 && (
                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} md={8} lg={6}>
                        {/* Rasi Chart Component */}
                        <RasiChart data={chartData} />
                    </Grid>
                </Grid>
            )}

            {tabIndex === 1 && <QuickSummaryTable data={player.birthChart} hideHeader={hideHeader} />}
            {tabIndex === 2 && <PanchangamGrid panchangam={chartData?.panchangam} birthData={player.birthData} hideHeader={hideHeader} />}
        </Box>
    );
};

const PlayerRow = ({ player, matchChart, isSelected, onSelect, onEdit, onViewChart, hideHeader = false }) => {
    const [open, setOpen] = useState(false);

    // Summary info for the row
    const chart = player.birthChart?.data || player.birthChart;
    const rasi = chart?.moonSign?.english || chart?.planets?.Moon?.sign || '-';
    // Use first letter of name for Avatar
    const avatarLetter = player.name ? player.name.charAt(0).toUpperCase() : '?';

    // Calculate Permissions if Match Chart is available AND player is selected
    let batResult = null;
    let bowlResult = null;

    if (matchChart && chart && isSelected) {
        batResult = runPrediction(chart, matchChart.data || matchChart, "BAT");
        bowlResult = runPrediction(chart, matchChart.data || matchChart, "BOWL");
    }

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
                onClick={() => setOpen(!open)}
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
                <TableCell width="50">
                    <IconButton aria-label="expand row" size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
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

                {(matchChart && isSelected) ? (
                     <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onViewChart(player); }} color="primary">
                                <GridOnIcon />
                            </IconButton>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <PredictionChip type="Bat" score={batResult?.score} report={batResult?.report} />
                                <PredictionChip type="Bowl" score={bowlResult?.score} report={bowlResult?.report} />
                            </Box>
                        </Box>
                     </TableCell>
                ) : (
                     <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onViewChart(player); }} color="primary">
                                <GridOnIcon />
                            </IconButton>
                            <Chip
                                label={rasi !== '-' ? `Moon: ${rasi}` : 'No Data'}
                                size="small"
                                color={rasi !== '-' ? "primary" : "default"}
                                variant={rasi !== '-' ? "outlined" : "filled"}
                            />
                        </Box>
                    </TableCell>
                )}
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: hideHeader ? '1px solid rgba(255, 255, 255, 0.05)' : 'inherit' }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <PlayerDetailPanel player={player} matchChart={matchChart} hideHeader={hideHeader} />
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const ChartPopup = ({ open, onClose, player, hideHeader = false }) => {
    const [tabIndex, setTabIndex] = useState(0);
    if (!player) return null;

    const chartData = player.birthChart?.data || player.birthChart;

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
                <PlayerDetailPanel player={player} hideHeader={hideHeader} />
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
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '19:30',
        location: 'Mumbai',
        lat: 19.076,
        long: 72.877,
        timezone: 5.5
    });

    // Reset when opening or teams change
    useEffect(() => {
        if (!open) {
            setTeamA('');
            setTeamB('');
            setMatchChart(null);
            setResults(null);
        }
    }, [open]);

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

    const handleMatchReady = (chart, details) => {
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

                // Save Result
                resDetails[pid] = { bat, bowl };

                // Add to team totals (Using MAX of Bat/Bowl as contribution)
                const contribution = Math.max(bat.score, bowl.score);

                const isTeamA = groups.find(g => g._id === teamA)?.players.some(tp => tp.id === pid);
                const isTeamB = groups.find(g => g._id === teamB)?.players.some(tp => tp.id === pid);

                if (isTeamA) { scoreA += contribution; countA++; }
                else if (isTeamB) { scoreB += contribution; countB++; }
            }
        });

        // Calculate Average Score (to normalize if team sizes differ)
        const avgA = countA > 0 ? (scoreA / countA).toFixed(1) : 0;
        const avgB = countB > 0 ? (scoreB / countB).toFixed(1) : 0;

        setResults({ details: resDetails, scoreA: avgA, scoreB: avgB, totalA: scoreA, totalB: scoreB });
    };

    // --- MOBILE RESPONSIVE HOOK ---
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const togglePlayer = (pid) => {
        if (selectedPlayers.includes(pid)) setSelectedPlayers(prev => prev.filter(id => id !== pid));
        else setSelectedPlayers(prev => [...prev, pid]);
    };

    const renderPlayerList = (teamId, teamName) => {
        const grp = groups.find(g => g._id === teamId);
        if (!grp) return null;

        const myScore = teamId === teamA ? results?.totalA : results?.totalB;
        const opponentScore = teamId === teamA ? results?.totalB : results?.totalA;
        const isWinner = results && Number(myScore) > Number(opponentScore);

        return (
            <Paper variant="outlined" sx={{
                p: isMobile ? 1 : 2,
                height: '100%',
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
                    borderColor: hideHeader ? 'rgba(255, 255, 255, 0.1)' : 'rgba(167, 243, 208, 1)',
                    pb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#059669', fontSize: isMobile ? '0.9rem' : '1rem' }}>{teamName}</Typography>
                    {results && (
                        <Chip label={`Score: ${myScore}`} color={isWinner ? "success" : "default"} variant={isWinner ? "filled" : "outlined"} size="small" />
                    )}
                </Box>

                {/* --- MOBILE VIEW (CARDS) --- */}
                {isMobile ? (
                    <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {/* Select All for Mobile */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, pl: 1 }}>
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
                        </Box>

                        {grp.players.map(p => {
                            const isSel = selectedPlayers.includes(p.id);
                            const res = results?.details?.[p.id];
                            return (
                                <Paper key={p.id} elevation={0} sx={{
                                    p: 1.5, mb: 1,
                                    border: '1px solid',
                                    borderColor: isSel ? '#10B981' : 'rgba(0,0,0,0.1)',
                                    bgcolor: isSel ? 'rgba(16, 185, 129, 0.05)' : 'white',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5
                                }} onClick={() => togglePlayer(p.id)}>
                                    <Checkbox checked={isSel} size="small" sx={{ p:0 }} />
                                    <Avatar src={p.profile} sx={{ width: 40, height: 40, fontSize: 14 }}>{p.name[0]}</Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.1} fontSize="0.85rem">{p.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" fontSize="0.7rem">{p.birthPlace || '-'}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{p.dob} | {p.birthTime}</Typography>
                                    </Box>
                                    {res && (
                                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                                            <Chip label={`Bat:${res.bat.score}`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} color={res.bat.score >= 1 ? 'success' : 'default'} />
                                            <Chip label={`Bowl:${res.bowl.score}`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} color={res.bowl.score >= 1 ? 'success' : 'default'} />
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>
                ) : (
                /* --- DESKTOP VIEW (TABLE) --- */
                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ bgcolor: 'transparent' }}>
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
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'transparent', color: '#059669' }}>Name</TableCell>
{/* ID Column Header Removed */}
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'transparent', color: '#059669' }}>DOB / Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'transparent', color: '#059669' }}>Place</TableCell>
                                {results && <TableCell sx={{ fontWeight: 'bold', bgcolor: 'transparent', color: '#059669' }}>Pred.</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {grp.players.map(p => {
                                const isSel = selectedPlayers.includes(p.id);
                                const res = results?.details?.[p.id];
                                return (
                                    <TableRow
                                        key={p.id}
                                        hover
                                        onClick={() => togglePlayer(p.id)}
                                        sx={{ cursor: 'pointer', bgcolor: isSel ? 'rgba(16, 185, 129, 0.08)' : 'inherit' }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={isSel} size="small" />
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
                                        <TableCell>
                                             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{p.dob}</Typography>
                                                <Typography variant="caption" color="text.secondary">{p.birthTime}</Typography>
                                             </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 80, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.birthPlace}
                                            </Typography>
                                        </TableCell>
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
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
            <AppBar position="static" sx={{ bgcolor: '#059669', backgroundImage: 'linear-gradient(to right, #059669, #10B981)' }}>
                <Toolbar sx={{ gap: 1, py: 0.5 }}>



                    {/* Match Setup - Using MatchPredictionControl */}
                    <Box sx={{ flexGrow: 1 }}>
                        <MatchPredictionControl
                            onPredictionComplete={handleMatchReady}
                            token={token}
                        />
                    </Box>

                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* CENTERED TEAM SELECTION */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                py: 1.5,
                px: 2,
                bgcolor: visionPro.paper,
                borderBottom: `1px solid ${visionPro.border}`
            }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>TEAM A</InputLabel>
                    <Select
                        value={teamA}
                        label="TEAM A"
                        onChange={(e) => setTeamA(e.target.value)}
                        sx={{ '& .MuiSelect-select': { fontWeight: 'bold', color: '#059669' } }}
                    >
                        {groups.map(g => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
                    </Select>
                </FormControl>

                <Box sx={{
                    width: 45, height: 45, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: visionPro.primary, color: 'white',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}>
                    <Typography variant="subtitle1" fontWeight="900">VS</Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>TEAM B</InputLabel>
                    <Select
                        value={teamB}
                        label="TEAM B"
                        onChange={(e) => setTeamB(e.target.value)}
                        sx={{ '& .MuiSelect-select': { fontWeight: 'bold', color: '#059669' } }}
                    >
                        {groups.map(g => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            {/* SIDE BY SIDE PLAYER TABLES */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                gap: 1,
                p: 1,
                overflow: 'hidden',
                height: 'calc(100vh - 130px)'
            }}>
                {teamA && teamB ? (
                    <>
                        {/* TEAM A - LEFT */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {renderPlayerList(teamA, groups.find(g => g._id === teamA)?.name)}
                        </Box>
                        {/* TEAM B - RIGHT */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {renderPlayerList(teamB, groups.find(g => g._id === teamB)?.name)}
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
                        <Paper sx={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#000' }}>
                                <thead>
                                    <tr style={{ background: '#059669', color: 'white' }}>
                                        <th style={{ padding: 8 }}>கிரகம்</th>
                                        <th style={{ padding: 8 }}>ராசி</th>
                                        <th style={{ padding: 8 }}>நட்சத்திரம்</th>
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
                                ⭐ நட்சத்திரம்: {matchChart.ascendant?.nakshatra?.tamil}
                            </Typography>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}
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
                : `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%), radial-gradient(circle at 10% 10%, rgba(110, 231, 183, 0.05) 0%, transparent 40%)`,
        }}>
             {/* Header */}
            {!hideHeader && (
                <AppBar position="sticky" sx={{
                    bgcolor: visionPro.primary,
                    backgroundImage: `linear-gradient(135deg, ${visionPro.primary} 0%, ${visionPro.secondary} 100%)`,
                    backdropFilter: 'blur(10px)',
                    borderBottom: `1px solid ${visionPro.border}`,
                    boxShadow: '0 4px 20px rgba(5, 150, 105, 0.2)'
                }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        {/* Left Side Logo - Round */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color:'white',
                            border:'darkorange'
                        }}>
                            <img
                                src="/logo.png"
                                alt="S&B Entertainment"
                                style={{
                                    objectFit: 'cover',
                                    height: '45px',
                                    width: '45px',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(255, 255, 255, 0.5)',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                }}
                                className="header-logo"
                            /> <h2><b>S&B Astro </b> </h2>
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

            <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
                {/* Search Bar */}
                <Paper sx={{
                    p: 2,
                    mb: 4,
                    borderRadius: '24px',
                    bgcolor: hideHeader ? 'rgba(255, 255, 255, 0.05)' : visionPro.paper,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${hideHeader ? 'rgba(255, 255, 255, 0.1)' : visionPro.border}`,
                    boxShadow: hideHeader ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.3)'
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
                                bgcolor: visionPro.primary,
                                '&:hover': {
                                    bgcolor: '#047857',
                                    transform: 'scale(1.02)'
                                },
                                '&:active': { transform: 'scale(0.98)' },
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                            }}
                        >
                            {showPrediction ? "Close Prediction" : "Predict Match"}
                        </Button>
                    </Box>
                </Paper>

                {/* Match Prediction Control */}
                <Collapse in={showPrediction}>
                    <MatchPredictionControl onPredictionComplete={handlePredictionReady} token={token} />
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
                                <Box sx={{ p: 2, bgcolor: hideHeader ? 'transparent' : '#f8fafc' }}>
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
                            <TableContainer sx={{ maxHeight: '70vh' }}>
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
                                                        onViewChart={(p) => {
                                                            setChartPopupPlayer(p);
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

                {/* POPUPS */}
                <ChartPopup open={chartPopupOpen} onClose={() => setChartPopupOpen(false)} player={chartPopupPlayer} hideHeader={hideHeader} />
                <MatchWizardDialog open={matchWizardOpen} onClose={() => setMatchWizardOpen(false)} groups={groups} token={token} hideHeader={hideHeader} />


            </Container>
        </Box>
    );
};

export default UserDashboard;