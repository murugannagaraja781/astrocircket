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
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Switch
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';

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
const PlanetaryTable = ({ rawPlanets }) => {
    if (!rawPlanets) return <Typography color="text.secondary">No Planetary Data Available (தரவு இல்லை)</Typography>;

    // Tamil Dictionaries
    const planetTamilMap = {
        'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்',
        'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்', 'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது',
        'Asc': 'லக்னம்', 'Lagna': 'லக்னம்', 'Uranus': 'யுரேனஸ்', 'Neptune': 'நெப்டியூன்', 'Pluto': 'புளூட்டோ'
    };

    const dignityTamilMap = {
        'Exalted': 'உச்சம்', 'Debilitated': 'நீசம்', 'Own Sign': 'ஆட்சி',
        'Friendly': 'நட்பு', 'Neutral': 'சமம்', 'Enemy': 'பகை', 'Great Enemy': 'தீவிர பகை', 'Great Friend': 'உற்ற நண்பன்'
    };

    // flatten data if it's in House format
    let planetList = [];
    const keys = Object.keys(rawPlanets);
    const isHouseData = keys.some(k => !isNaN(parseInt(k)));

    if (isHouseData) {
        // Extract planets from houses
        Object.values(rawPlanets).forEach(house => {
            // Determine where the planet list is: direct array, or inside .planets / .Planets
            let planets = [];
            if (Array.isArray(house)) {
                planets = house;
            } else if (house.planets) {
                planets = Array.isArray(house.planets) ? house.planets : Object.values(house.planets);
            } else if (house.Planets) {
                planets = Array.isArray(house.Planets) ? house.Planets : Object.values(house.Planets);
            }

            if (planets.length > 0) {
                planets.forEach(pRaw => {
                    const pName = typeof pRaw === 'string' ? pRaw : (pRaw.name || pRaw.englishName);
                    if (!pName) return;

                    planetList.push({
                        englishName: pName,
                        tamilName: planetTamilMap[pName] || pName,
                        sign: house.sign || (typeof pRaw === 'object' ? pRaw.sign : null),
                        signTamil: house.signTamil || (typeof pRaw === 'object' ? pRaw.signTamil : null),
                        lord: house.lord || (typeof pRaw === 'object' ? pRaw.lord : null),
                        lordTamil: house.lordTamil || (typeof pRaw === 'object' ? pRaw.lordTamil : null),
                        nakshatra: (typeof pRaw === 'object' ? pRaw.nakshatra : null) || '-',
                        nakshatraLord: (typeof pRaw === 'object' ? pRaw.nakshatraLord : null),
                        degree: (typeof pRaw === 'object' ? pRaw.degree : 0),
                        isRetro: (typeof pRaw === 'object' ? pRaw.isRetro : false),
                        isCombust: (typeof pRaw === 'object' ? pRaw.isCombust : false),
                        dignity: (typeof pRaw === 'object' ? pRaw.dignity : {}),
                        raw: pRaw
                    });
                });
            }
        });
    } else {
        // Already valid planet map
         planetList = Object.values(rawPlanets).map(p => ({
             ...p,
             tamilName: planetTamilMap[p.englishName || p.name] || p.tamilName || p.englishName || p.name
         }));
    }

    if (planetList.length === 0) {
         return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                    No Planetary Data Available (கிரக தரவு இல்லை)<br/>
                    <span style={{ fontSize: '0.7rem', color: 'red' }}>
                        Debug: Keys [{Object.keys(rawPlanets || {}).join(', ')}] <br/>
                        isHouseData: {isHouseData ? 'Yes' : 'No'}
                    </span>
                </Typography>
            </Box>
         );
    }

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
                <TableHead sx={{ backgroundColor: '#1e3a8a' }}>
                    <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>கிரகம்</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ராசி</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ராசி நாதன்</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>நட்சத்திர நாதன்</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>நட்சத்திரம்</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>பாகை</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>அந்தஸ்து</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>நிலை</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Debug</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {planetList.map((p, i) => {
                        // Normalize potential object fields
                        const planetName = p.englishName || p.name;
                        const signName = p.sign?.name || p.sign || '-';
                        const lordName = p.lord?.name || p.lord || '-';
                        const nakshatraName = p.nakshatra?.name || p.nakshatra || '-';

                        // Safe Degree Parsing
                        const degreeVal = p.degree !== undefined && p.degree !== null ? parseFloat(p.degree) : 0;
                        const degreeStr = !isNaN(degreeVal) && degreeVal > 0 ? degreeVal.toFixed(2) + '°' : '-';

                        const dignityEnglish = p.dignity?.english || (typeof p.dignity === 'string' ? p.dignity : '-');
                        const dignityTamil = dignityTamilMap[dignityEnglish] || dignityEnglish;

                        return (
                        <TableRow key={planetName || i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="font-bold text-gray-800">{planetName}</span>
                                    <span className="text-xs text-blue-600">{p.tamilName || planetTamilMap[planetName]}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="font-medium">{signName}</span>
                                    <span className="text-xs text-gray-500">{p.signTamil}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="font-medium text-gray-700">{lordName}</span>
                                    <span className="text-xs text-gray-500">{p.lordTamil}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <span className="font-medium text-gray-700">{p.nakshatraLord || getNakshatraLordHelper(nakshatraName)}</span>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{nakshatraName} {p.pada ? `(${p.pada})` : ''}</span>
                                    <span className="text-xs text-gray-500">{p.nakshatraTamil}</span>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Chip label={degreeStr} size="small" variant="outlined" sx={{ minWidth: 60 }} />
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={dignityTamil}
                                    size="small"
                                    color={dignityEnglish === 'Exalted' ? 'success' : dignityEnglish === 'Debilitated' ? 'error' : 'default'}
                                    variant="filled"
                                    sx={{ minWidth: 80 }}
                                />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {p.isRetro && <Chip label="வக்ரம்" size="small" color="secondary" sx={{ height: 24, fontSize: 10 }} />}
                                    {p.isCombust && <Chip label="அஸ்தமனம்" size="small" color="warning" sx={{ height: 24, fontSize: 10 }} />}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption" sx={{ fontSize: 10, color: 'red', wordBreak: 'break-all' }}>
                                    {JSON.stringify(p.raw)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// 2. Panchangam Grid
const PanchangamGrid = ({ panchangam, birthData }) => {
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
        <Card variant="outlined" sx={{ mt: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
             <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                        Panchangam Details
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', color: 'gray' }}>
                        {birthData?.date} {birthData?.time}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {items.map((item, i) => (
                        <Grid item xs={6} sm={4} md={2} key={i}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center', height: '100%' }}>
                                <Typography variant="h5" sx={{ mb: 1 }}>{item.icon}</Typography>
                                <Typography variant="caption" color="textSecondary" display="block" textTransform="uppercase" fontWeight="bold" fontSize={10}>
                                    {item.label}
                                </Typography>
                                <Typography variant="body2" fontWeight="medium" color="textPrimary">
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
const PlayerDetailPanel = ({ player, matchChart }) => {
    const [tabIndex, setTabIndex] = useState(0);

    // Normalize Data (Handle wrappers)
    const chartData = player.birthChart?.data || player.birthChart;
    const matchData = matchChart?.data || matchChart;

    // Run Advanced Prediction if Match Chart is available
    const batsmanPred = useMemo(() => matchData ? runPrediction(chartData, matchData, "BAT") : null, [chartData, matchData]);
    const bowlerPred = useMemo(() => matchData ? runPrediction(chartData, matchData, "BOWL") : null, [chartData, matchData]);

    return (
        <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
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
                       <Paper sx={{ p: 2, borderLeft: 5, borderColor: batsmanPred?.verdict === 'EXCELLENT' ? 'success.main' : 'warning.main' }}>
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
                       <Paper sx={{ p: 2, borderLeft: 5, borderColor: bowlerPred?.verdict === 'EXCELLENT' ? 'success.main' : 'warning.main' }}>
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

            <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} textColor="primary" indicatorColor="primary"
                variant="scrollable" scrollButtons="auto"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Rasi Chart" />
                <Tab label="Planetary Positions" />
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

            {tabIndex === 1 && <PlanetaryTable rawPlanets={chartData?.planets || chartData?.houses} />}
            {tabIndex === 2 && <PanchangamGrid panchangam={chartData?.panchangam} birthData={player.birthData} />}
        </Box>
    );
};

const PlayerRow = ({ player, matchChart }) => {
    const [open, setOpen] = useState(false);

    // Summary info for the row
    const chart = player.birthChart?.data || player.birthChart;
    const rasi = chart?.moonSign?.english || chart?.planets?.Moon?.sign || '-';
    // Use first letter of name for Avatar
    const avatarLetter = player.name ? player.name.charAt(0).toUpperCase() : '?';

    // Calculate Permissions if Match Chart is available
    let batResult = null;
    let bowlResult = null;

    if (matchChart && chart) {
        // matchChart is the chart object from the API
        batResult = runPrediction(chart, matchChart.data || matchChart, "BAT");
        bowlResult = runPrediction(chart, matchChart.data || matchChart, "BOWL");
    }

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} hover onClick={() => setOpen(!open)}>
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
                            sx={{ width: 44, height: 44, bgcolor: '#1e40af', fontSize: '1.2rem' }}
                        >
                            {avatarLetter}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {player.name} {getFlag(player)}
                            </Typography>
                             <Typography variant="caption" color="text.secondary">
                                ID: {player.id}
                            </Typography>
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
                            {player.dob}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PublicIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{player.timezone || '-'}</Typography>
                    </Box>
                </TableCell>

                {matchChart ? (
                     <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <PredictionChip type="Bat" score={batResult?.score} report={batResult?.report} />
                            <PredictionChip type="Bowl" score={bowlResult?.score} report={bowlResult?.report} />
                        </Box>
                     </TableCell>
                ) : (
                     <TableCell>
                        <Chip
                            label={rasi !== '-' ? `Moon: ${rasi}` : 'No Data'}
                            size="small"
                            color={rasi !== '-' ? "primary" : "default"}
                            variant={rasi !== '-' ? "outlined" : "filled"}
                        />
                    </TableCell>
                )}
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <PlayerDetailPanel player={player} matchChart={matchChart} />
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

// In UserDashboard component
const UserDashboard = () => {
    const { logout, token } = useContext(AuthContext); // Destructure token


    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');

    // Prediction State
    const [showPrediction, setShowPrediction] = useState(false);
    const [matchChart, setMatchChart] = useState(null);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    // Fetch Players
    useEffect(() => {
        const fetchPlayers = async () => {
             try {
                // Use token from Context first, then localStorage
                const authToken = token || localStorage.getItem('x-auth-token');
                if(!authToken) return;

                const res = await axios.get(`${baseUrl}/api/players`, {
                    headers: { 'x-auth-token': authToken }
                });
                setPlayers(res.data);
            } catch (err) {
                console.error("Load Error", err);
                // if(err.response?.status === 401) logout();
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [token, baseUrl]);

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

    const paginatedPlayers = filteredPlayers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9' }}>
             {/* Header */}
            <AppBar position="sticky" sx={{ bgcolor: 'white', color: '#1e3a8a', boxShadow: 1 }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: -0.5, display: 'flex', alignItems: 'center' }}>
                         <span className="text-royal-blue mr-2 text-2xl">⚛️</span>
                         ASTRO CRICKET
                         <Chip label="ADMIN DASHBOARD" size="small" sx={{ ml: 2, height: 20, fontSize: '0.65rem' }} />
                    </Typography>
                     <Button color="inherit" onClick={logout} sx={{ ml: 2, fontSize: '0.8rem' }}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
                {/* Search Bar */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search by Name, City, ID, Rasi, or Nakshatra..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: '#f8fafc' }}
                        />
                        <Button
                            variant={showPrediction ? "contained" : "outlined"}
                            color="secondary"
                            startIcon={<SportsCricketIcon />}
                            onClick={() => {
                                setShowPrediction(!showPrediction);
                                if(showPrediction) setMatchChart(null);
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
                <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                    {loading ? (
                        <Box sx={{ p: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress size={40} thickness={4} />
                            <Typography variant="body2" color="text.secondary">Loading Astronomy Data...</Typography>
                        </Box>
                    ) : (
                        <>
                            <TableContainer sx={{ maxHeight: '70vh' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="50" sx={{ bgcolor: '#1e40af', color: 'white' }} />
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>PLAYER PROFILE</TableCell>
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>BIRTH PLACE</TableCell>
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>TIMEZONE</TableCell>
                                            <TableCell sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 'bold' }}>
                                                {matchChart ? "PREDICTION RESULT (BAT / BOWL)" : "CHART SUMMARY"}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedPlayers.length > 0 ? (
                                            paginatedPlayers.map((player) => (
                                                <PlayerRow
                                                    key={player._id || player.id}
                                                    player={player}
                                                    matchChart={matchChart}
                                                />
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">No players found matching "{searchTerm}"</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                component="div"
                                count={filteredPlayers.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                            />
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default UserDashboard;
