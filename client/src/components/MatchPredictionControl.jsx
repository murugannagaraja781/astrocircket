import React, { useState } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert, Autocomplete } from '@mui/material';
import axios from 'axios';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import RasiChart, { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, planetFullTamilMap } from './RasiChart';

const MatchPredictionControl = ({ onPredictionComplete, onPredictionStart, token }) => {
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

            // Pass the derived Match Chart parent
            onPredictionComplete(res.data, matchDetails);

        } catch (err) {
            console.error("Match Chart Error", err);
            setError("Failed to generate Match Chart.");
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <Paper elevation={3} sx={{ p: 0, mb: 3, overflow: 'hidden' }}>
             {/* AppBar inside Control */}


            <Box sx={{ p: 2 }}>
                {/* Single Line Flex Layout for All Inputs & Buttons */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>

                    {/* Date */}
                    <TextField
                        label="Date"
                        type="date"
                        size="small"
                        value={matchDetails.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '130px' }}
                    />

                    {/* Time */}
                    <TextField
                        label="Time"
                        type="time"
                        size="small"
                        value={matchDetails.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '100px' }}
                    />

                    {/* Location */}
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
                                label="Location"
                                size="small"
                                placeholder="City"
                                sx={{ width: '180px' }}
                            />
                        )}
                        sx={{ width: '180px' }}
                    />

                    {/* Lat */}
                    <TextField
                        label="Lat"
                        type="number"
                        size="small"
                        value={matchDetails.lat}
                        onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '100px' }}
                    />

                    {/* Long */}
                    <TextField
                        label="Long"
                        type="number"
                        size="small"
                        value={matchDetails.long}
                        onChange={(e) => handleChange('long', parseFloat(e.target.value))}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '100px' }}
                    />

                    {/* Timezone */}
                    <TextField
                        label="TZ"
                        type="number"
                        size="small"
                        value={matchDetails.timezone}
                        onChange={(e) => handleChange('timezone', parseFloat(e.target.value))}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '70px' }}
                    />

                    {/* BUTTONS */}
                    <Button
                        variant="outlined"
                        onClick={handleViewChart}
                        disabled={viewChartLoading || loading}
                        sx={{
                            height: '40px',
                            color: '#059669',
                            borderColor: '#059669',
                            whiteSpace: 'nowrap',
                            minWidth: 'auto',
                            px: 2
                        }}
                    >
                        {viewChartLoading ? <CircularProgress size={20} /> : "Chart"}
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleRun}
                        disabled={loading || viewChartLoading}
                        sx={{
                            height: '40px',
                            bgcolor: '#059669',
                            '&:hover': { bgcolor: '#047857' },
                            whiteSpace: 'nowrap',
                            minWidth: 'auto',
                            px: 2
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Predict"}
                    </Button>

                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Box>

            {/* View Chart Dialog */}
            <Dialog
                open={viewChartOpen}
                onClose={() => setViewChartOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f0fdf4' }}>
                    <Typography variant="h6" component="div" sx={{ color: '#059669', fontWeight: 'bold' }}>
                        Rasi Chart View
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setViewChartOpen(false)}
                        sx={{ color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#fff' }}>
                    {chartData ? (
                        <Box sx={{ width: '100%', maxWidth: '600px' }}>
                             <RasiChart data={chartData} />

                             <Box sx={{ mt: 3 }}>
                                <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>விபரம்</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>இராசி/நட்சத்திரம்</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#059669' }}>அதிபதி</TableCell>
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
};

export default MatchPredictionControl;
