import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert, Autocomplete, Collapse } from '@mui/material';
import axios from 'axios';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import RasiChart, { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, planetFullTamilMap } from './RasiChart';

const MatchPredictionControl = forwardRef(({ onPredictionComplete, onPredictionStart, token }, ref) => {
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: '19:30',
        location: 'Mumbai, India', // Default
        lat: 19.0760,
        long: 72.8777,
        timezone: 5.5
    });
    const [loading, setLoading] = useState(false);
    const [viewChartLoading, setViewChartLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewChartOpen, setViewChartOpen] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [matchChartResult, setMatchChartResult] = useState(null); // Store result for display

    const handleChange = (field, value) => {
        setMatchDetails(prev => ({ ...prev, [field]: value }));
    };

    // Predefined City Data (Major Cricket Venues & Cities)
    const cityOptions = [
        { label: "Mumbai (மும்பை), India", lat: 19.0760, long: 72.8777, timezone: 5.5 },
        { label: "Chennai (சென்னை), India", lat: 13.0827, long: 80.2707, timezone: 5.5 }, // Corrected Chennai Long
        { label: "Bangalore (பெங்களூரு), India", lat: 12.9716, long: 77.5946, timezone: 5.5 },
        { label: "Delhi (டெல்லி), India", lat: 28.6139, long: 77.2090, timezone: 5.5 },
        { label: "Kolkata (கொல்கத்தா), India", lat: 22.5726, long: 88.3639, timezone: 5.5 },
        { label: "Hyderabad (ஹைதராபாத்), India", lat: 17.3850, long: 78.4867, timezone: 5.5 },
        { label: "Ahmedabad (அகமதாபாத்), India", lat: 23.0225, long: 72.5714, timezone: 5.5 },
        { label: "Pune (புனே), India", lat: 18.5204, long: 73.8567, timezone: 5.5 },
        { label: "London (லண்டன்), UK", lat: 51.5074, long: -0.1278, timezone: 0.0 },
        { label: "Melbourne (மெல்போர்ன்), Australia", lat: -37.8136, long: 144.9631, timezone: 10.0 },
        { label: "Sydney (சிட்னி), Australia", lat: -33.8688, long: 151.2093, timezone: 10.0 },
        { label: "Dubai (துபாய்), UAE", lat: 25.276987, long: 55.296249, timezone: 4.0 },
        { label: "Colombo (கொழும்பு), Sri Lanka", lat: 6.9271, long: 79.8612, timezone: 5.5 },
        { label: "Johannesburg (ஜோகன்னஸ்பர்க்), SA", lat: -26.2041, long: 28.0473, timezone: 2.0 },
        { label: "New York (நியூயார்க்), USA", lat: 40.7128, long: -74.0060, timezone: -5.0 }, // EST usually, careful with DST
    ];

    const handleCityChange = (event, newValue) => {
        if (newValue) {
            setMatchDetails(prev => ({
                ...prev,
                location: newValue.label,
                lat: newValue.lat,
                long: newValue.long,
                timezone: newValue.timezone
            }));
        }
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
                timezone: matchDetails.timezone
            };

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
                timezone: matchDetails.timezone
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
        summary.push({ label: "லக்னம்", sign: ascSign, lord: ascLord });

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

    return (
        <Paper elevation={0} sx={{ p: 0, mb: { xs: 1, sm: 3 }, overflow: 'hidden', borderRadius: { xs: '10px', sm: '16px' }, border: '1px solid rgba(0,0,0,0.08)' }}>

            {/* Form Container */}
            <Box sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: '#FFFBF5' }}>
                {/* Title Header - Clickable to Toggle */}
                <Box
                    onClick={() => setExpanded(!expanded)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: { xs: 0.5, sm: 2 },
                        cursor: 'pointer',
                        bgcolor: 'rgba(255, 111, 0, 0.05)',
                        p: 1,
                        borderRadius: '8px'
                    }}
                >
                    <Typography variant="caption" fontWeight="900" sx={{ color: '#FF6F00', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                        {expanded ? '🔽 Hide Match Details' : '▶️ Show Match Details'}
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.5, color: '#FF6F00' }}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                {/* Collapsible Input Grid */}
                <Collapse in={expanded}>
                    <Grid container spacing={{ xs: 0.5, sm: 2 }}>
                    {/* Date */}
                    <Grid item xs={6} sm={4} md={2}>
                        <TextField
                            label="Date"
                            type="date"
                            size="small"
                            fullWidth
                            value={matchDetails.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': { borderRadius: '12px', fontSize: { xs: '0.8rem', sm: '0.95rem' }, height: { xs: '36px', sm: 'auto' } },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '1rem' } }
                            }}
                        />
                    </Grid>

                    {/* Time */}
                    <Grid item xs={6} sm={4} md={2}>
                        <TextField
                            label="Time"
                            type="time"
                            size="small"
                            fullWidth
                            value={matchDetails.time}
                            onChange={(e) => handleChange('time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': { borderRadius: '12px', fontSize: { xs: '0.8rem', sm: '0.95rem' }, height: { xs: '36px', sm: 'auto' } },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '1rem' } }
                            }}
                        />
                    </Grid>

                    {/* Location - More Visible */}
                    <Grid item xs={12} sm={4} md={4}>
                        <Autocomplete
                            freeSolo
                            options={cityOptions}
                            getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                            value={matchDetails.location}
                            onChange={handleCityChange}
                            onInputChange={(event, newInputValue) => handleChange('location', newInputValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="📍 Location"
                                    placeholder="City..."
                                    size="small"
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            borderRadius: '12px',
                                            fontSize: { xs: '0.8rem', sm: '1rem' },
                                            fontWeight: 'bold',
                                            bgcolor: 'rgba(255, 193, 7, 0.08)',
                                            border: '2px solid #FFC107',
                                            height: { xs: '36px', sm: 'auto' },
                                            pt: { xs: 0, sm: 'auto' }
                                        },
                                        '& .MuiInputLabel-root': { fontWeight: 'bold', color: '#FF6F00', fontSize: { xs: '0.8rem', sm: '1rem' }, top: { xs: '-3px', sm: 0 } },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFC107' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FF6F00' }
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Lat */}
                    <Grid item xs={4} sm={4} md={1.5}>
                        <TextField
                            label="Lat"
                            type="number"
                            size="small"
                            fullWidth
                            value={matchDetails.lat}
                            onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 0.01 }}
                            sx={{
                                '& .MuiInputBase-root': { borderRadius: '12px', fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: '36px', sm: 'auto' } },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '1rem' } }
                            }}
                        />
                    </Grid>

                    {/* Long */}
                    <Grid item xs={4} sm={4} md={1.5}>
                        <TextField
                            label="Long"
                            type="number"
                            size="small"
                            fullWidth
                            value={matchDetails.long}
                            onChange={(e) => handleChange('long', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 0.01 }}
                            sx={{
                                '& .MuiInputBase-root': { borderRadius: '12px', fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: '36px', sm: 'auto' } },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '1rem' } }
                            }}
                        />
                    </Grid>

                    {/* Timezone */}
                    <Grid item xs={4} sm={4} md={1}>
                        <TextField
                            label="TZ"
                            type="number"
                            size="small"
                            fullWidth
                            value={matchDetails.timezone}
                            onChange={(e) => handleChange('timezone', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 0.5 }}
                            sx={{
                                '& .MuiInputBase-root': { borderRadius: '12px', fontSize: { xs: '0.75rem', sm: '0.9rem' }, height: { xs: '36px', sm: 'auto' } },
                                '& .MuiInputLabel-root': { fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '1rem' } }
                            }}
                        />
                    </Grid>
                    </Grid>
                </Collapse>

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
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '10px', border: '1px solid rgba(255, 111, 0, 0.2)' }}>
                                <Table size="small">
                                    <TableBody>
                                        {/* Ascendant Row */}
                                        <TableRow sx={{ bgcolor: 'rgba(255, 193, 7, 0.08)' }}>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', width: '35%', py: 0.8, fontSize: '0.75rem' }}>
                                                லக்னம் (Asc)
                                            </TableCell>
                                            <TableCell sx={{ color: '#212121', py: 0.8, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {matchChartResult.ascendant?.tamil || matchChartResult.ascendant?.english || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#616161', py: 0.8, fontSize: '0.75rem' }}>
                                                {matchChartResult.ascendant?.lordTamil || matchChartResult.ascendant?.lord || '-'}
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
                                                {matchChartResult.moonSign?.lordTamil || matchChartResult.moonSign?.lord || '-'}
                                            </TableCell>
                                        </TableRow>

                                        {/* Nakshatra Row */}
                                        <TableRow sx={{ bgcolor: 'rgba(255, 193, 7, 0.08)' }}>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00', py: 0.8, fontSize: '0.75rem' }}>
                                                நட்சத்திரம் (Star)
                                            </TableCell>
                                            <TableCell sx={{ color: '#212121', py: 0.8, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {matchChartResult.moonNakshatra?.tamil || matchChartResult.moonNakshatra?.name || matchChartResult.nakshatra?.name || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#616161', py: 0.8, fontSize: '0.75rem' }}>
                                                {matchChartResult.moonNakshatra?.lordTamil || matchChartResult.moonNakshatra?.lord || '-'}
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

export default MatchPredictionControl;
