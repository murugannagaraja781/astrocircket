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
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Switch, Checkbox
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
// 1. Planetary Details Table
const PlanetaryTable = ({ planets }) => {
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
                        {planets.map((p, i) => (
                            <TableRow key={i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="font-bold text-gray-800">{p.planetName}</span>
                                        <span className="text-xs text-blue-600">{p.planetTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="font-medium">{p.signName}</span>
                                        <span className="text-xs text-gray-500">{p.signTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="font-medium text-gray-700">{p.lordName}</span>
                                        <span className="text-xs text-gray-500">{p.lordTamil}</span>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-gray-700">{p.nakshatraLord}</span>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{p.nakshatraName}</span>
                                        <span className="text-xs text-gray-500">{p.nakshatraTamil}</span>
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
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" sx={{ fontSize: 10, color: 'red', wordBreak: 'break-all' }}>
                                        {JSON.stringify(p.raw)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, p: 2, bgcolor: '#1e1e1e', color: '#00ff00', borderRadius: 2, overflowX: 'auto' }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>Backend Formatted JSON Data:</Typography>
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                    {JSON.stringify(planets, null, 2)}
                </pre>
            </Box>
        </Box>
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

            {tabIndex === 1 && <PlanetaryTable planets={chartData?.formattedPlanets} />}
            {tabIndex === 2 && <PanchangamGrid panchangam={chartData?.panchangam} birthData={player.birthData} />}
        </Box>
    );
};

const PlayerRow = ({ player, matchChart, isSelected, onSelect, onEdit }) => {
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
                sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer', bgcolor: isSelected ? 'rgba(30, 64, 175, 0.04)' : 'inherit' }}
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
                            sx={{ width: 44, height: 44, bgcolor: '#1e40af', fontSize: '1.2rem' }}
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

                {(matchChart && isSelected) ? (
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
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

    // Groups State
    const [groups, setGroups] = useState([]);
    const [showTeams, setShowTeams] = useState(false);

    // Prediction State
    const [showPrediction, setShowPrediction] = useState(false);
    const [matchChart, setMatchChart] = useState(null);

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
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={1}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                    <span className="mr-2">🏏</span>
                   Active Teams ({groups.length})
                </Typography>
                <Button size="small" onClick={() => setShowTeams(!showTeams)}>
                    {showTeams ? "Hide" : "Show All"}
                </Button>
            </Box>

            <Collapse in={showTeams}>
                <Grid container spacing={2}>
                    {groups.map(group => (
                        <Grid item xs={12} sm={6} md={4} key={group._id}>
                            <Card variant="outlined" sx={{ bgcolor: '#f8fafc' }}>
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
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: '#f8fafc' }}
                        />
                        <Button
                            variant={showPrediction ? "contained" : "outlined"}
                            color="secondary"
                            disabled={!showPrediction && selectedPlayerIds.length === 0}
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
                {renderTeams()}
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
                                            <TableCell padding="checkbox" sx={{ bgcolor: '#1e40af' }}>
                                                <Checkbox
                                                    color="default"
                                                    indeterminate={selectedPlayerIds.length > 0 && selectedPlayerIds.length < players.length}
                                                    checked={players.length > 0 && selectedPlayerIds.length === players.length}
                                                    onChange={handleSelectAllClick}
                                                    inputProps={{
                                                        'aria-label': 'select all players',
                                                    }}
                                                    sx={{ color: 'white!important' }}
                                                />
                                            </TableCell>
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
                                            paginatedPlayers.map((player) => {
                                                const isItemSelected = isSelected(player.id);
                                                return (
                                                    <PlayerRow
                                                        key={player._id || player.id}
                                                        player={player}
                                                        matchChart={matchChart}
                                                        isSelected={isItemSelected}
                                                        onSelect={handleSelectClick}
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
            </Container>
        </Box>
    );
};

export default UserDashboard;
