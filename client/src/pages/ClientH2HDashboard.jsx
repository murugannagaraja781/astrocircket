import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Chip,
    CircularProgress,
    AppBar,
    Toolbar,
    Avatar,
    IconButton,
    Tooltip,
    TextField,
    Autocomplete,
    Collapse
} from '@mui/material';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { City } from 'country-state-city';

import AuthContext from '../context/AuthContext';
import ClientHeadToHead from '../components/ClientHeadToHead';
import {
    setH2HTeams,
    setH2HMatchChart,
    setH2HBatFirstTeam,
    setMatchStartTime,
    setMatchVenueAndTime,
    resetH2HSelections
} from '../redux/slices/h2hSlice';

const calculateTimezoneHelper = (long) => {
    const lonNum = parseFloat(long);
    if (isNaN(lonNum)) return 5.5;
    let offset = lonNum / 15;
    offset = Math.round(offset * 2) / 2;
    if (offset > 14) offset = 14;
    if (offset < -12) offset = -12;
    return offset;
};

const ClientH2HDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, logout, token } = useContext(AuthContext);

    const h2hState = useSelector((state) => state.h2h || {});
    const {
        teamAId,
        teamBId,
        teamAName,
        teamBName,
        teamAPlayers = [],
        teamBPlayers = [],
        batFirstTeam = 'teamA',
        matchDate = new Date().toISOString().split('T')[0],
        matchStartTime = '19:30',
        venueName = 'Mumbai, India',
        latitude = 19.0760,
        longitude = 72.8777,
        timezone = 5.5,
        matchChart = null
    } = h2hState;

    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);
    const [showVenueSettings, setShowVenueSettings] = useState(false);

    // Local form state for venue & time
    const [formDate, setFormDate] = useState(matchDate);
    const [formTime, setFormTime] = useState(matchStartTime);
    const [formVenue, setFormVenue] = useState(venueName);
    const [formLat, setFormLat] = useState(latitude);
    const [formLong, setFormLong] = useState(longitude);
    const [formTimezone, setFormTimezone] = useState(timezone);

    // City search
    const [cityOptions, setCityOptions] = useState([]);
    const [cityLoading, setCityLoading] = useState(false);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    // Fetch Teams/Groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoadingGroups(true);
                const authToken = token || localStorage.getItem('token');
                const res = await axios.get(`${baseUrl}/api/groups`, {
                    headers: authToken ? { 'x-auth-token': authToken } : {}
                });
                const groupData = res.data || [];
                setGroups(groupData);

                if (groupData.length >= 2 && !teamAId && !teamBId) {
                    const gA = groupData[0];
                    const gB = groupData[1];
                    dispatch(setH2HTeams({
                        teamAId: gA._id,
                        teamBId: gB._id,
                        teamAName: gA.name,
                        teamBName: gB.name,
                        teamAPlayers: gA.players || [],
                        teamBPlayers: gB.players || []
                    }));
                } else if (groupData.length === 1 && !teamAId) {
                    const gA = groupData[0];
                    dispatch(setH2HTeams({
                        teamAId: gA._id,
                        teamBId: gA._id,
                        teamAName: gA.name,
                        teamBName: gA.name,
                        teamAPlayers: gA.players || [],
                        teamBPlayers: gA.players || []
                    }));
                }
            } catch (err) {
                console.error('Failed to load teams:', err);
            } finally {
                setLoadingGroups(false);
            }
        };

        fetchGroups();
    }, [baseUrl, token, dispatch]);

    // Handle City Search
    const handleCitySearch = (event, newInputValue) => {
        if (!newInputValue || newInputValue.length < 3) return;
        setCityLoading(true);
        setTimeout(() => {
            try {
                const q = newInputValue.toLowerCase();
                const all = City.getAllCities();
                const matches = [];
                for (let i = 0; i < all.length; i++) {
                    if (all[i].name.toLowerCase().includes(q)) {
                        matches.push(all[i]);
                        if (matches.length >= 40) break;
                    }
                }
                setCityOptions(matches);
            } catch (err) {
                console.error(err);
            } finally {
                setCityLoading(false);
            }
        }, 100);
    };

    const handleCitySelect = (event, cityObj) => {
        if (cityObj) {
            const cityName = `${cityObj.name}, ${cityObj.countryCode}`;
            const lat = parseFloat(cityObj.latitude) || 19.0760;
            const lon = parseFloat(cityObj.longitude) || 72.8777;
            const tz = calculateTimezoneHelper(lon);

            setFormVenue(cityName);
            setFormLat(lat);
            setFormLong(lon);
            setFormTimezone(tz);
        }
    };

    // Calculate Match Chart from form state
    const handleCalculateMatchChart = async (customParams = null) => {
        try {
            setLoadingChart(true);

            const d = customParams?.date || formDate;
            const t = customParams?.time || formTime;
            const lat = customParams?.lat !== undefined ? customParams.lat : formLat;
            const lon = customParams?.long !== undefined ? customParams.long : formLong;
            const tz = customParams?.tz !== undefined ? customParams.tz : formTimezone;
            const vName = customParams?.venue || formVenue;

            const [year, month, day] = (d || new Date().toISOString().split('T')[0]).split('-');
            const [hour, minute] = (t || '19:30').split(':');

            const payload = {
                day: parseInt(day, 10) || new Date().getDate(),
                month: parseInt(month, 10) || (new Date().getMonth() + 1),
                year: parseInt(year, 10) || new Date().getFullYear(),
                hour: parseInt(hour, 10) || 19,
                minute: parseInt(minute, 10) || 30,
                latitude: parseFloat(lat) || 19.0760,
                longitude: parseFloat(lon) || 72.8777,
                timezone: parseFloat(tz) || 5.5,
                ayanamsa: localStorage.getItem('preferredAyanamsa') || 'Lahiri'
            };

            const authToken = token || localStorage.getItem('token');
            const res = await axios.post(`${baseUrl}/api/charts/birth-chart`, payload, {
                headers: authToken ? { 'x-auth-token': authToken } : {}
            });

            if (res.data) {
                dispatch(setH2HMatchChart(res.data));
                dispatch(setMatchVenueAndTime({
                    matchDate: d,
                    matchStartTime: t,
                    venueName: vName,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    timezone: payload.timezone
                }));
            }
        } catch (err) {
            console.warn('Failed to calculate match chart:', err);
        } finally {
            setLoadingChart(false);
        }
    };

    // Automatically load default match chart on initial mount
    useEffect(() => {
        if (!matchChart) {
            handleCalculateMatchChart();
        }
    }, []);

    // Handle Team A Change
    const handleTeamAChange = (newTeamAId) => {
        const gA = groups.find(g => g._id === newTeamAId);
        dispatch(setH2HTeams({
            teamAId: newTeamAId,
            teamAName: gA?.name || 'Team A',
            teamAPlayers: gA?.players || []
        }));
        dispatch(resetH2HSelections());
    };

    // Handle Team B Change
    const handleTeamBChange = (newTeamBId) => {
        const gB = groups.find(g => g._id === newTeamBId);
        dispatch(setH2HTeams({
            teamBId: newTeamBId,
            teamBName: gB?.name || 'Team B',
            teamBPlayers: gB?.players || []
        }));
        dispatch(resetH2HSelections());
    };

    // Toggle Toss / Bat First
    const handleToggleBatFirst = () => {
        const nextBatFirst = batFirstTeam === 'teamA' ? 'teamB' : 'teamA';
        dispatch(setH2HBatFirstTeam(nextBatFirst));
        dispatch(resetH2HSelections());
    };

    const handleLogout = () => {
        if (logout) logout();
        navigate('/login');
    };

    const isTeamABatting = batFirstTeam === 'teamA';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F5', pb: 4 }}>
            {/* Top Navigation Bar */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#1E293B' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#FF6F00', width: 38, height: 38, boxShadow: '0 2px 8px rgba(255,111,0,0.3)' }}>
                            <SportsCricketIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="900" sx={{ color: '#0F172A', letterSpacing: '-0.3px', fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                                AstroCricket <span style={{ color: '#FF6F00' }}>H2H Hub</span>
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' } }}>
                                நேரடி பேட்ஸ்மேன் vs பவுலர் கணிப்பு மையம்
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Tooltip title="மறுபரிசீலனை செய்க (Refresh)">
                            <IconButton onClick={() => handleCalculateMatchChart()} size="small" sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}>
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {user ? (
                            <Chip
                                label={`${user.displayName || user.name || user.username || 'Client User'} (${user.role === 'client' ? 'Client' : user.role === 'superadmin' ? 'Admin' : 'User'})`}
                                size="small"
                                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 'bold' }}
                            />
                        ) : null}

                        <Tooltip title="வெளியேறு (Logout)">
                            <IconButton onClick={handleLogout} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', '&:hover': { bgcolor: '#FECACA' } }}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content Area */}
            <Container maxWidth="xl" sx={{ mt: 2.5 }}>
                {/* Match Venue, Date & Time Bar */}
                <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)', bgcolor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                        {/* Live Venue & Time Summary Pill */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<LocationOnIcon sx={{ color: '#FF6F00 !important' }} />}
                                label={`அரங்கம் / இடம்: ${venueName}`}
                                sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 'bold', fontSize: '0.82rem', border: '1px solid #FFEDD5' }}
                            />
                            <Chip
                                icon={<CalendarMonthIcon sx={{ color: '#2563EB !important' }} />}
                                label={`தேதி: ${matchDate}`}
                                sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 'bold', fontSize: '0.82rem', border: '1px solid #DBEAFE' }}
                            />
                            <Chip
                                icon={<AccessTimeIcon sx={{ color: '#059669 !important' }} />}
                                label={`நேரம்: ${matchStartTime} (UTC ${timezone >= 0 ? '+' : ''}${timezone})`}
                                sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 'bold', fontSize: '0.82rem', border: '1px solid #A7F3D0' }}
                            />
                        </Box>

                        {/* Toggle Settings Button */}
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => setShowVenueSettings(!showVenueSettings)}
                            startIcon={<TuneIcon />}
                            endIcon={showVenueSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{
                                bgcolor: showVenueSettings ? '#FF6F00' : '#1E293B',
                                color: 'white',
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#FF6F00' }
                            }}
                        >
                            {showVenueSettings ? 'இடத்தை மறை (Hide)' : 'இடம் & நேரம் மாற்று (Change Venue/Time)'}
                        </Button>
                    </Box>

                    {/* Collapsible Venue, Date, Time & Coordinates Form */}
                    <Collapse in={showVenueSettings}>
                        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #E2E8F0' }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#0F172A', mb: 1.5 }}>
                                🏟️ மேட்ச் நடக்கும் இடம், தேதி மற்றும் தொடக்க நேரம் (Match Venue & Timing)
                            </Typography>
                            <Grid container spacing={2} alignItems="center">
                                {/* Date Picker */}
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <TextField
                                        label="மேட்ச் தேதி (Date)"
                                        type="date"
                                        size="small"
                                        fullWidth
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                {/* Time Picker */}
                                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                    <TextField
                                        label="துவங்கும் நேரம் (Time)"
                                        type="time"
                                        size="small"
                                        fullWidth
                                        value={formTime}
                                        onChange={(e) => setFormTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                {/* City / Venue Search Autocomplete */}
                                <Grid size={{ xs: 12, sm: 12, md: 4.5 }}>
                                    <Autocomplete
                                        options={cityOptions}
                                        getOptionLabel={(opt) => typeof opt === 'string' ? opt : `${opt.name}, ${opt.countryCode}`}
                                        loading={cityLoading}
                                        onInputChange={handleCitySearch}
                                        onChange={handleCitySelect}
                                        freeSolo
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="நகரம் / மைதான இடம் (Search City / Stadium)"
                                                size="small"
                                                placeholder="Type 3+ letters e.g. London, Chennai, Sydney..."
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: <LocationOnIcon sx={{ color: '#FF6F00', mr: 0.5, fontSize: 20 }} />,
                                                    endAdornment: (
                                                        <>
                                                            {cityLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    )
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* Apply Button */}
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => handleCalculateMatchChart()}
                                        disabled={loadingChart}
                                        sx={{
                                            bgcolor: '#FF6F00',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            borderRadius: '10px',
                                            height: '40px',
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#EA580C' }
                                        }}
                                    >
                                        {loadingChart ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'கணிக்கவும் (Apply)'}
                                    </Button>
                                </Grid>

                                {/* Detailed Lat, Long & Timezone inputs */}
                                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                                    <TextField
                                        label="Latitude (அட்சரேகை)"
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={formLat}
                                        onChange={(e) => setFormLat(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                                    <TextField
                                        label="Longitude (தீர்க்கரேகை)"
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={formLong}
                                        onChange={(e) => {
                                            setFormLong(e.target.value);
                                            setFormTimezone(calculateTimezoneHelper(e.target.value));
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                                    <TextField
                                        label="Timezone (நேர மண்டலம் UTC)"
                                        size="small"
                                        type="number"
                                        fullWidth
                                        value={formTimezone}
                                        onChange={(e) => setFormTimezone(e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Team Selection & Toss Bar */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)', bgcolor: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
                    <Grid container spacing={2} alignItems="center">
                        {/* Team A Dropdown */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>அணி A (Team A)</InputLabel>
                                <Select
                                    value={teamAId || ''}
                                    label="அணி A (Team A)"
                                    onChange={(e) => handleTeamAChange(e.target.value)}
                                    disabled={loadingGroups}
                                >
                                    {groups.map((g) => (
                                        <MenuItem key={g._id} value={g._id}>
                                            {g.name} ({g.players?.length || 0} வீரர்கள்)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Toss / Inning Switch Button */}
                        <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleToggleBatFirst}
                                    startIcon={<SwapHorizIcon />}
                                    sx={{
                                        borderRadius: '24px',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        borderColor: '#FF6F00',
                                        color: '#FF6F00',
                                        bgcolor: '#FFF7ED',
                                        '&:hover': { bgcolor: '#FFEDD5', borderColor: '#EA580C' }
                                    }}
                                >
                                    டாஸ் / பேட்டிங்: {isTeamABatting ? teamAName : teamBName}
                                </Button>
                            </Box>
                        </Grid>

                        {/* Team B Dropdown */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>அணி B (Team B)</InputLabel>
                                <Select
                                    value={teamBId || ''}
                                    label="அணி B (Team B)"
                                    onChange={(e) => handleTeamBChange(e.target.value)}
                                    disabled={loadingGroups}
                                >
                                    {groups.map((g) => (
                                        <MenuItem key={g._id} value={g._id}>
                                            {g.name} ({g.players?.length || 0} வீரர்கள்)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Loading / Ready View */}
                {loadingGroups || loadingChart ? (
                    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '18px', bgcolor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <CircularProgress sx={{ color: '#FF6F00', mb: 2 }} />
                        <Typography variant="body1" fontWeight="700" color="#334155">
                            மேட்ச் ஜாதகக் கணக்கீடு மற்றும் வீரர்கள் தரவு ஏற்றப்படுகிறது...
                        </Typography>
                    </Paper>
                ) : teamAPlayers.length === 0 || teamBPlayers.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '18px', bgcolor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <SportsCricketIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight="700" color="#1E293B">
                            இரு அணிகளையும் தேர்ந்தெடுக்கவும்
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ஹெட்-டு-ஹெட் (Head-to-Head) மோதல் பலன்களைக் கணிக்க மேலே உள்ள இரு அணிகளையும் தேர்ந்தெடுக்கவும்.
                        </Typography>
                    </Paper>
                ) : (
                    <ClientHeadToHead
                        teamAPlayers={teamAPlayers}
                        teamBPlayers={teamBPlayers}
                        teamAName={teamAName}
                        teamBName={teamBName}
                        matchChart={matchChart}
                        batFirstTeam={batFirstTeam}
                        matchStartTime={matchStartTime}
                        matchDate={matchDate}
                        venueName={venueName}
                    />
                )}
            </Container>
        </Box>
    );
};

export default ClientH2HDashboard;
