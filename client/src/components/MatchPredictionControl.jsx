import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert, Autocomplete, Collapse } from '@mui/material';
import axios from 'axios';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControlLabel, Checkbox } from '@mui/material';
import { Country, State, City } from 'country-state-city';
import ct from 'countries-and-timezones';
import RasiChart, { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, planetFullTamilMap } from './RasiChart';

const MatchPredictionControl = forwardRef(({ onPredictionComplete, onPredictionStart, token }, ref) => {
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: '19:30',
        battingTime: '',
        bowlingTime: '',
        location: 'Mumbai, India', // Default
        lat: 19.0760,
        long: 72.8777,
        timezone: 5.5,
        ayanamsa: localStorage.getItem('preferredAyanamsa') || 'Lahiri'
    });
    const [loading, setLoading] = useState(false);
    const [viewChartLoading, setViewChartLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewChartOpen, setViewChartOpen] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [matchChartResult, setMatchChartResult] = useState(null); // Store result for display

    // Country-State-City Selection States
    // Single Line Search State
    const [locationOptions, setLocationOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);



    const calculateTimezone = (long) => {
        const lonNum = parseFloat(long);
        if (isNaN(lonNum)) return 5.5;
        let offset = lonNum / 15;
        offset = Math.round(offset * 2) / 2;
        if (offset > 14) offset = 14;
        if (offset < -12) offset = -12;
        return offset;
    };



    const handleChange = (field, value) => {
        setMatchDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationSearch = (event, newInputValue) => {
        if (!newInputValue || newInputValue.length < 3) {
            return;
        }

        setLocationLoading(true);
        // Small delay to prevent blocking typing
        setTimeout(() => {
            const q = newInputValue.toLowerCase();
            const all = City.getAllCities();
            const matches = [];
            for (let i = 0; i < all.length; i++) {
                if (all[i].name.toLowerCase().includes(q)) {
                    matches.push(all[i]);
                    if (matches.length >= 50) break;
                }
            }
            setLocationOptions(matches);
            setLocationLoading(false);
        }, 100);
    };



    const handleRun = async () => {
        setLoading(true);
        if (onPredictionStart) onPredictionStart();
        setError('');
        try {
            const [year, month, day] = matchDetails.date.split('-');
            const [hour, minute] = matchDetails.time.split(':');

            const payload = {
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
                hour: parseInt(hour),
                minute: parseInt(minute),
                latitude: matchDetails.lat,
                longitude: matchDetails.long,
                timezone: matchDetails.timezone,
                ayanamsa: matchDetails.ayanamsa || 'Lahiri'
            };

            // Add Batting/Bowling times if present
            if (matchDetails.battingTime) {
                const [bh, bm] = matchDetails.battingTime.split(':');
                payload.battingHour = parseInt(bh);
                payload.battingMinute = parseInt(bm);
            }
            if (matchDetails.bowlingTime) {
                const [bwh, bwm] = matchDetails.bowlingTime.split(':');
                payload.bowlingHour = parseInt(bwh);
                payload.bowlingMinute = parseInt(bwm);
            }

            // Fetch Match Chart
            const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await axios.post(`${baseUrl}/api/charts/birth-chart`, payload, {
                headers: { 'x-auth-token': token }
            });

            // Store result for display
            setMatchChartResult(res.data);

            // Pass the derived Match Chart parent
            onPredictionComplete(res.data, matchDetails);

        } catch (err) {
            console.error("Match Chart Error", err);
            setError("Failed to generate Match Chart.");
        } finally {
            setLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        runPrediction: handleRun
    }));

    const handleViewChart = async () => {
        setViewChartLoading(true);
        setError('');
        try {
            const [year, month, day] = matchDetails.date.split('-');
            const [hour, minute] = matchDetails.time.split(':');

            const payload = {
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
                hour: parseInt(hour),
                minute: parseInt(minute),
                latitude: matchDetails.lat,
                longitude: matchDetails.long,
                timezone: matchDetails.timezone,
                ayanamsa: matchDetails.ayanamsa || 'Lahiri'
            };

            const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await axios.post(`${baseUrl}/api/charts/birth-chart`, payload, {
                headers: { 'x-auth-token': token }
            });

            setChartData(res.data);
            setViewChartOpen(true);

        } catch (err) {
            console.error("View Chart Error", err);
            setError("Failed to fetch Rasi Chart.");
        } finally {
            setViewChartLoading(false);
        }
    };

    const getChartSummary = () => {
        if (!chartData) return [];
        const summary = [];

        // 1. Lagna (Ascendant)
        const asc = chartData.ascendant || {};
        const ascSign = asc.tamil || "Not Found";
        const ascLord = asc.lordTamil || asc.lord || "-";

        // Get Lagna Nakshatra Name Tamil/English
        const ascNakName = asc.nakshatra?.tamil || asc.nakshatra?.name || "-";
        const ascNakLord = asc.nakshatra?.lord || getNakshatraLordHelper(asc.nakshatra?.name);

        let ascNakLordTamil = ascNakLord;
        const tamilLordsMap = {
            'Ketu': 'கேது', 'Venus': 'சுக்கிரன்', 'Sun': 'சூரியன்', 'Moon': 'சந்திரன்',
            'Mars': 'செவ்வாய்', 'Rahu': 'ராகு', 'Jupiter': 'குரு', 'Saturn': 'சனி', 'Mercury': 'புதன்'
        };
        if (tamilLordsMap[ascNakLord]) ascNakLordTamil = tamilLordsMap[ascNakLord];

        summary.push({ label: "லக்னம் (Lagna)", sign: `${ascSign} | ${ascNakName}`, lord: `${ascLord} | நட்சத்திர அதிபதி: ${ascNakLordTamil || '-'}` });

        // 2. Moon (Rasi)
        const moon = chartData.moonSign || {};
        const moonSign = moon.tamil || "Not Found";
        const moonLord = moon.lordTamil || moon.lord || "-";
        summary.push({ label: "சந்திரன்", sign: moonSign, lord: moonLord });

        // 3. Nakshatra
        // Check both root 'nakshatra' and 'moonNakshatra'
        const nak = chartData.nakshatra || chartData.moonNakshatra || {};
        const nakName = nak.tamil || nak.name || "Not Found";

        // Ensure Lord is in Tamil
        let nakLord = nak.lordTamil || nak.lord || "-";
        // Simple mapping if not already Tamil
        const tamilLords = {
            'Ketu': 'கேது', 'Venus': 'சுக்கிரன்', 'Sun': 'சூரியன்', 'Moon': 'சந்திரன்',
            'Mars': 'செவ்வாய்', 'Rahu': 'ராகு', 'Jupiter': 'குரு', 'Saturn': 'சனி', 'Mercury': 'புதன்'
        };
        if (tamilLords[nakLord]) nakLord = tamilLords[nakLord];

        summary.push({ label: "நட்சத்திரம்", sign: nakName, lord: nakLord });

        return summary;
    };

    const renderRawDataTable = (title, data) => {
        if (!data || Object.keys(data).length === 0) return null;
        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#059669', mb: 1 }}>
                    {title}
                </Typography>
                <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>Key</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(data).map(([key, value]) => {
                                // Skip objects/arrays for simple key-value display, or JSON stringify them
                                let displayValue = value;
                                if (typeof value === 'object' && value !== null) {
                                    displayValue = JSON.stringify(value);
                                }
                                return (
                                    <TableRow key={key}>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>{key}</TableCell>
                                        <TableCell sx={{ color: '#4b5563', wordBreak: 'break-word' }}>{String(displayValue)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const [expanded, setExpanded] = useState(false); // Default collapsed
    const [chartExpanded, setChartExpanded] = useState(true); // Default open when result available

    const formatLagnaTime = (isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            const utcTime = date.getTime();
            const localDate = new Date(utcTime + (parseFloat(matchDetails.timezone || 0) * 3600000));
            let hours = localDate.getUTCHours();
            const minutes = localDate.getUTCMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        } catch (e) {
            console.error("Time format error", e);
            return isoString.split('T')[1]?.slice(0, 5) || isoString;
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 0, mb: { xs: 1, sm: 3 }, overflow: 'hidden', borderRadius: { xs: '10px', sm: '16px' }, border: '1px solid rgba(0,0,0,0.08)' }}>

            {/* Form Container */}
            <Box sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#FFFBF5' }}>
                {/* Title Header - Clickable to Toggle */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                        bgcolor: 'rgba(255, 111, 0, 0.08)',
                        p: 1.5,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 111, 0, 0.2)'
                    }}
                >
                    <Typography variant="subtitle2" fontWeight="900" sx={{ color: '#FF6F00', display: 'flex', alignItems: 'center', gap: 1 }}>
                        📅 Match Schedule & Venue
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 'bold', bgcolor: 'white', px: 1, py: 0.5, borderRadius: '6px', border: '1px solid #FFCC80' }}>
                        {matchDetails.date} @ {matchDetails.time}
                    </Typography>
                </Box>

                <Grid container spacing={2} alignItems="flex-start">
                    {/* Date */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            label="Match Date"
                            type="date"
                            size="small"
                            fullWidth
                            value={matchDetails.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    bgcolor: '#fff',
                                    border: '1px solid #FFCC80'
                                },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', color: '#E65100' }
                            }}
                        />
                    </Grid>

                    {/* Time */}
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            label="Match Time"
                            type="time"
                            size="small"
                            fullWidth
                            value={matchDetails.time}
                            onChange={(e) => handleChange('time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    bgcolor: '#fff',
                                    border: '1px solid #FFCC80'
                                },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', color: '#E65100' }
                            }}
                        />
                    </Grid>

                    {/* Location Search & Details */}
                    <Grid item xs={12} sm={6} md={8}>
                        <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
                            <Autocomplete
                                options={locationOptions}
                                loading={locationLoading}
                                getOptionLabel={(option) => `${option.name}, ${option.stateCode}, ${option.countryCode}`}
                                onInputChange={(event, newInputValue) => {
                                    if (!newInputValue || newInputValue.length < 3) return;
                                    setLocationLoading(true);
                                    setTimeout(() => {
                                        const q = newInputValue.toLowerCase();
                                        const all = City.getAllCities();
                                        const matches = [];
                                        for (let i = 0; i < all.length; i++) {
                                            if (all[i].name.toLowerCase().includes(q)) {
                                                matches.push(all[i]);
                                                if (matches.length >= 50) break;
                                            }
                                        }
                                        setLocationOptions(matches);
                                        setLocationLoading(false);
                                    }, 300);
                                }}
                                onChange={(event, val) => {
                                    if (val) {
                                        const country = Country.getCountryByCode(val.countryCode);
                                        const state = State.getStateByCodeAndCountry(val.stateCode, val.countryCode);
                                        const locationName = `${val.name}, ${state?.name || val.stateCode}, ${country?.name || val.countryCode}`;
                                        const lat = parseFloat(val.latitude);
                                        const long = parseFloat(val.longitude);
                                        let tz = 5.5;
                                        try {
                                            const timezones = ct.getTimezonesForCountry(val.countryCode);
                                            if (timezones && timezones.length > 0) {
                                                tz = timezones[0].utcOffset / 60;
                                            } else {
                                                tz = calculateTimezone(long);
                                            }
                                        } catch (e) {
                                            tz = calculateTimezone(long);
                                        }
                                        setMatchDetails(prev => ({ ...prev, location: locationName, lat, long, timezone: tz }));
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="� Search Venue (City)"
                                        size="small"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {locationLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const country = Country.getCountryByCode(option.countryCode);
                                    return (
                                        <li {...props} key={`${option.name}-${option.latitude}`}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{option.name}</Typography>
                                                <Typography variant="caption" color="textSecondary">{option.stateCode}, {country?.name}</Typography>
                                            </Box>
                                        </li>
                                    )
                                }}
                            />

                            {/* Hidden/Compact Details */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField label="Lat" value={matchDetails.lat} size="small" sx={{ width: 80 }} disabled InputProps={{ style: { fontSize: '0.7rem' } }} />
                                <TextField label="Long" value={matchDetails.long} size="small" sx={{ width: 80 }} disabled InputProps={{ style: { fontSize: '0.7rem' } }} />
                                <TextField label="TZ" value={matchDetails.timezone} size="small" sx={{ width: 50 }} disabled InputProps={{ style: { fontSize: '0.7rem' } }} />
                                <TextField
                                    select
                                    label="Ayanamsa"
                                    size="small"
                                    value={matchDetails.ayanamsa || 'Lahiri'}
                                    onChange={(e) => {
                                        handleChange('ayanamsa', e.target.value);
                                        localStorage.setItem('preferredAyanamsa', e.target.value);
                                    }}
                                    SelectProps={{ native: true }}
                                    sx={{ width: 100 }}
                                    InputProps={{ style: { fontSize: '0.75rem' } }}
                                >
                                    <option value="Lahiri">Lahiri</option>
                                    <option value="KP">KP</option>
                                    <option value="KP Straight">KP Straight</option>
                                </TextField>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                {/* BUTTONS - Compact on Mobile */}
                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mt: { xs: 1.5, sm: 3 }, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        onClick={handleViewChart}
                        disabled={viewChartLoading || loading}
                        sx={{
                            flex: 1,
                            minWidth: { xs: '80px', sm: '120px' },
                            height: { xs: '36px', sm: '48px' },
                            fontSize: { xs: '0.8rem', sm: '1rem' },
                            fontWeight: 'bold',
                            borderRadius: { xs: '10px', sm: '14px' },
                            color: '#FFC107',
                            borderColor: '#FFC107',
                            borderWidth: '2px',
                            '&:hover': { bgcolor: 'rgba(255, 193, 7, 0.1)', borderColor: '#FF9800' }
                        }}
                    >
                        {viewChartLoading ? <CircularProgress size={20} /> : "📊 Chart"}
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleRun}
                        disabled={loading || viewChartLoading}
                        sx={{
                            flex: 2,
                            minWidth: { xs: '120px', sm: '160px' },
                            height: { xs: '36px', sm: '48px' },
                            fontSize: { xs: '0.85rem', sm: '1rem' },
                            fontWeight: '900',
                            borderRadius: { xs: '10px', sm: '14px' },
                            bgcolor: '#FF6F00',
                            boxShadow: '0 4px 12px rgba(255, 111, 0, 0.35)',
                            '&:hover': { bgcolor: '#E65100' },
                            '&:active': { transform: 'scale(0.98)' }
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "🏏 Predict"}
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>{error}</Alert>}

                {/* MATCH CHART SUMMARY TABLE - Tamil Format (Collapsible) */}
                {matchChartResult && (
                    <Box sx={{ mt: 2.5 }}>
                        {/* Headers - Clickable to Toggle */}
                        <Box
                            onClick={() => setChartExpanded(!chartExpanded)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 1,
                                cursor: 'pointer',
                                bgcolor: 'rgba(255, 111, 0, 0.05)',
                                p: 1,
                                borderRadius: '8px'
                            }}
                        >
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#FF6F00', fontSize: '0.85rem' }}>
                                📊 போட்டி ராசி விவரம் (Match Chart Details)
                            </Typography>
                            <IconButton size="small" sx={{ p: 0.5, color: '#FF6F00' }}>
                                {chartExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={chartExpanded}>
                            <Grid container spacing={2}>
                                {/* Left Column: Match Details */}
                                <Grid item xs={12} md={6}>
                                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '10px', border: '1px solid rgba(255, 111, 0, 0.2)', height: '100%' }}>
                                        <Table size="small">
                                            <TableBody>
                                                {/* Ascendant Row */}
                                                <TableRow sx={{ bgcolor: 'rgba(255, 193, 7, 0.08)' }}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', width: '35%', py: 0.8, fontSize: '0.75rem' }}>
                                                        லக்னம் (Asc)
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#212121', py: 0.8, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {matchChartResult.ascendant?.tamil || matchChartResult.ascendant?.english || '-'} <br />
                                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>
                                                            ({matchChartResult.ascendant?.nakshatra?.tamil || nakshatraTamilMap[matchChartResult.ascendant?.nakshatra?.name] || matchChartResult.ascendant?.nakshatra?.name || '-'})
                                                        </span>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#616161', py: 0.8, fontSize: '0.75rem' }}>
                                                        {matchChartResult.ascendant?.lordTamil || planetFullTamilMap[matchChartResult.ascendant?.lord] || matchChartResult.ascendant?.lord || '-'} <br />
                                                        <span style={{ fontSize: '0.7rem', color: '#888' }}>
                                                            (நட்சத்திர அதிபதி: {planetFullTamilMap[getNakshatraLordHelper(matchChartResult.ascendant?.nakshatra?.name)] || getNakshatraLordHelper(matchChartResult.ascendant?.nakshatra?.name) || '-'})
                                                        </span>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Moon Sign Row */}
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', py: 0.8, fontSize: '0.75rem' }}>
                                                        சந்திரன் (Moon)
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#212121', py: 0.8, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {matchChartResult.moonSign?.tamil || matchChartResult.moonSign?.english || '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#616161', py: 0.8, fontSize: '0.75rem' }}>
                                                        {matchChartResult.moonSign?.lordTamil || planetFullTamilMap[matchChartResult.moonSign?.lord] || matchChartResult.moonSign?.lord || '-'}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Nakshatra Row */}
                                                <TableRow sx={{ bgcolor: 'rgba(255, 193, 7, 0.08)' }}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', py: 0.8, fontSize: '0.75rem' }}>
                                                        நட்சத்திரம் (Star)
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#212121', py: 0.8, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {matchChartResult.moonNakshatra?.tamil || nakshatraTamilMap[matchChartResult.moonNakshatra?.name || matchChartResult.nakshatra?.name] || matchChartResult.moonNakshatra?.name || matchChartResult.nakshatra?.name || '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#616161', py: 0.8, fontSize: '0.75rem' }}>
                                                        {matchChartResult.moonNakshatra?.lordTamil || planetFullTamilMap[matchChartResult.moonNakshatra?.lord || getNakshatraLordHelper(matchChartResult.moonNakshatra?.name || matchChartResult.nakshatra?.name)] || matchChartResult.moonNakshatra?.lord || getNakshatraLordHelper(matchChartResult.moonNakshatra?.name || matchChartResult.nakshatra?.name) || '-'}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Pada Row */}
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', py: 0.8, fontSize: '0.75rem' }}>
                                                        பாதம் (Pada)
                                                    </TableCell>
                                                    <TableCell colSpan={2} sx={{ color: '#212121', py: 0.8, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {matchChartResult.moonNakshatra?.pada || matchChartResult.nakshatra?.pada || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                {/* Right Column: Lagna Timeline */}
                                <Grid item xs={12} md={6}>
                                    {matchChartResult.lagnaTimeline && matchChartResult.lagnaTimeline.length > 0 && (
                                        <Box sx={{ height: '100%' }}>
                                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid rgba(255, 111, 0, 0.2)', height: '100%' }}>
                                                <Table size="small">
                                                    <TableHead sx={{ bgcolor: 'rgba(255, 193, 7, 0.15)' }}>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>#</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>தொடக்கம்</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>முடிவு</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>லக்னம்</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>நட்சத்திரம்</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>அதிபதி</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', fontSize: '0.7rem', px: 0.5 }}>கால அளவு</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {(() => {
                                                            // Pre-compute L# and N# labels
                                                            let lagnaCount = 0;
                                                            let nakCount = 0;
                                                            let prevLagna = null;
                                                            let prevNak = null;
                                                            const timeline = matchChartResult.lagnaTimeline;
                                                            const labeled = timeline.map((slot) => {
                                                                if (slot.lagna !== prevLagna) {
                                                                    lagnaCount++;
                                                                    prevLagna = slot.lagna;
                                                                }
                                                                if (slot.nakshatra !== prevNak) {
                                                                    nakCount++;
                                                                    prevNak = slot.nakshatra;
                                                                }
                                                                return { ...slot, lagnaLabel: `L${lagnaCount}`, nakLabel: `N${nakCount}` };
                                                            });

                                                            return labeled.map((slot, index) => {
                                                                const signMap = {
                                                                    'Aries': 'மேஷம்', 'Taurus': 'ரிஷபம்', 'Gemini': 'மிதுனம்', 'Cancer': 'கடகம்',
                                                                    'Leo': 'சிம்மம்', 'Virgo': 'கன்னி', 'Libra': 'துலாம்', 'Scorpio': 'விருச்சிகம்',
                                                                    'Sagittarius': 'தனுசு', 'Capricorn': 'மகரம்', 'Aquarius': 'கும்பம்', 'Pisces': 'மீனம்'
                                                                };
                                                                const lagnaTamil = signMap[slot.lagna] || slot.lagna;
                                                                const lordTamil = planetFullTamilMap[slot.lord] || slot.lord;
                                                                const nakTamil = slot.nakshatraTamil || nakshatraTamilMap[slot.nakshatra] || slot.nakshatra || '-';
                                                                const nakLordTamil = planetFullTamilMap[slot.nakshatraLord] || slot.nakshatraLord || '-';

                                                                // Calculate duration
                                                                const startMs = new Date(slot.start).getTime();
                                                                const endMs = new Date(slot.end).getTime();
                                                                const diffMs = endMs - startMs;
                                                                const diffMin = Math.floor(diffMs / 60000);
                                                                const durationHrs = Math.floor(diffMin / 60);
                                                                const durationMins = diffMin % 60;
                                                                const durationStr = durationHrs > 0 ? `${durationHrs}h ${durationMins}m` : `${durationMins}m`;

                                                                // Color coding for L# and N# badges
                                                                const lagnaColors = ['#FF6F00', '#1565C0', '#2E7D32', '#6A1B9A', '#C62828'];
                                                                const lColor = lagnaColors[(parseInt(slot.lagnaLabel.slice(1)) - 1) % lagnaColors.length];

                                                                return (
                                                                    <TableRow key={index} sx={{
                                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                                        bgcolor: slot.isMain ? 'rgba(255, 193, 7, 0.08)' : 'inherit'
                                                                    }}>
                                                                        <TableCell sx={{ fontSize: '0.65rem', px: 0.5, whiteSpace: 'nowrap' }}>
                                                                            <Box sx={{ display: 'flex', gap: 0.3 }}>
                                                                                <Box sx={{
                                                                                    bgcolor: lColor, color: '#fff', px: 0.5, py: 0.1,
                                                                                    borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold',
                                                                                    lineHeight: 1.3, minWidth: '20px', textAlign: 'center'
                                                                                }}>{slot.lagnaLabel}</Box>
                                                                                <Box sx={{
                                                                                    bgcolor: '#00897B', color: '#fff', px: 0.5, py: 0.1,
                                                                                    borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold',
                                                                                    lineHeight: 1.3, minWidth: '20px', textAlign: 'center'
                                                                                }}>{slot.nakLabel}</Box>
                                                                            </Box>
                                                                        </TableCell>
                                                                        <TableCell sx={{ fontSize: '0.7rem', px: 0.5, whiteSpace: 'nowrap' }}>{formatLagnaTime(slot.start)}</TableCell>
                                                                        <TableCell sx={{ fontSize: '0.7rem', px: 0.5, whiteSpace: 'nowrap' }}>{formatLagnaTime(slot.end)}</TableCell>
                                                                        <TableCell sx={{ fontSize: '0.7rem', px: 0.5, fontWeight: slot.isMain ? 'bold' : 'normal' }}>
                                                                            {lagnaTamil} {slot.isMain ? '⭐' : ''}
                                                                        </TableCell>
                                                                        <TableCell sx={{ fontSize: '0.7rem', px: 0.5 }}>{nakTamil}</TableCell>
                                                                        <TableCell sx={{ fontSize: '0.7rem', px: 0.5 }}>
                                                                            {lordTamil}/{nakLordTamil}
                                                                        </TableCell>
                                                                        <TableCell sx={{ fontSize: '0.7rem', px: 0.5, color: '#666' }}>{durationStr}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            });
                                                        })()}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    )}
                                </Grid>
                            </Grid>
                        </Collapse>
                    </Box>
                )}
            </Box>

            {/* View Chart Dialog */}
            <Dialog
                open={viewChartOpen}
                onClose={() => setViewChartOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(90deg, #FFC107 0%, #FF6F00 100%)' }}>
                    <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
                        📊 Rasi Chart View
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setViewChartOpen(false)}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#FFFBF5' }}>
                    {chartData ? (
                        <Box sx={{ width: '100%', maxWidth: '600px' }}>
                            <RasiChart data={chartData} />

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
                                            {getChartSummary().map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>{row.label}</TableCell>
                                                    <TableCell sx={{ color: '#000' }}>{row.sign}</TableCell>
                                                    <TableCell sx={{ color: '#000' }}>{row.lord}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            {/* Raw Data Tables */}
                            {chartData.moonNakshatra && renderRawDataTable("Moon Nakshatra Details", chartData.moonNakshatra)}



                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Chart for {matchDetails.date} at {matchDetails.time}
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <CircularProgress />
                    )}
                </DialogContent>
            </Dialog>
        </Paper>
    );
});

// Helper to get Star Lord (copied from predictionRules/adapter to avoid circular dep issues quickly)
const getNakshatraLordHelper = (starName) => {
    if (!starName) return null;
    const n = starName.toLowerCase();
    
    // Ketu: Ashwini, Magha, Mula
    if (['ashwini', 'aswini', 'magha', 'magam', 'makam', 'mula', 'moola', 'moolam'].some(s => n.includes(s))) return 'Ketu';
    
    // Venus: Bharani, Purva Phalguni, Purva Ashadha
    if (['bharani', 'purva phalguni', 'purvaphalguni', 'pooram', 'purva ashadha', 'purvashada', 'pooradam'].some(s => n.includes(s))) return 'Venus';
    
    // Sun: Krittika, Uttara Phalguni, Uttara Ashadha
    if (['krittika', 'karthigai', 'uttara phalguni', 'uttaraphalguni', 'uthiram', 'uttara ashadha', 'uttarashada', 'uthiradam'].some(s => n.includes(s))) return 'Sun';
    
    // Moon: Rohini, Hasta, Shravana
    if (['rohini', 'hasta', 'hastham', 'shravana', 'thiruvonam'].some(s => n.includes(s))) return 'Moon';
    
    // Mars: Mrigashira, Chitra, Dhanishta
    if (['mrigashira', 'mrigashirsha', 'mrigasirisa', 'mrigasirisha', 'mirugasirisha', 'mirugasirish', 'mrigasirisam', 'chitra', 'chithirai', 'dhanishta', 'avittam'].some(s => n.includes(s))) return 'Mars';
    
    // Rahu: Ardra, Swati, Shatabhisha
    if (['ardra', 'thiruvadhirai', 'swati', 'swathi', 'shatabhisha', 'sadhayam', 'sathayam'].some(s => n.includes(s))) return 'Rahu';
    
    // Jupiter: Punarvasu, Vishakha, Purva Bhadrapada
    if (['punarvasu', 'punarpusam', 'vishakha', 'visakam', 'purva bhadrapada', 'purvabhadra', 'poorattathi'].some(s => n.includes(s))) return 'Jupiter';
    
    // Saturn: Pushya, Anuradha, Uttara Bhadrapada
    if (['pushya', 'poosam', 'anuradha', 'anusham', 'uttara bhadrapada', 'uttarabhadra', 'uthirattathi'].some(s => n.includes(s))) return 'Saturn';
    
    // Mercury: Ashlesha, Jyeshtha, Revati
    if (['ashlesha', 'ayilyam', 'jyeshtha', 'kettai', 'revati'].some(s => n.includes(s))) return 'Mercury';
    
    return null;
};

export default MatchPredictionControl;
