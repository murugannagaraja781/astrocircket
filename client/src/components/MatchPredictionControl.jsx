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
            onPredictionComplete(res.data);

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
        if (!chartData) {
            console.log("No chartData");
            return [];
        }
        console.log("ChartData in Summary:", chartData);

        const housesData = chartData.houses || chartData;
        // Filter to ensure we only have valid house objects (they should have signNumber)
        const houses = Object.values(housesData).filter(h => h && typeof h === 'object' && h.signNumber);
        console.log("Filtered Houses:", houses);

        const nakshatraData = chartData.moonNakshatra || {};
        console.log("Nakshatra Data:", nakshatraData);

        const summary = [];

        // Helper to get planets array
        const getPlanets = (h) => {
            const raw = h.planets || h.Planets;
            return Array.isArray(raw) ? raw : [];
        };

        // Helper to check if planet exists in array (string or object)
        const hasPlanet = (planets, names) => {
            return planets.some(p => {
                const pName = (typeof p === 'object' && p !== null) ? (p.name || p.englishName || p.id) : p;
                return names.includes(pName);
            });
        };

        // 1. Lagna
        const lagnaHouse = houses.find(h => hasPlanet(getPlanets(h), ['Asc', 'Lagna', 'Ascendant']));
        if (lagnaHouse) {
            const signName = lagnaHouse.signTamil || tamilSigns[lagnaHouse.signNumber];
            const lordName = lagnaHouse.lord || signLords[lagnaHouse.signNumber];
            const lordTamil = signLordsTamil[lordName] || lordName;
            summary.push({ label: "லக்னம்", sign: signName, lord: lordTamil });
        } else {
            summary.push({ label: "லக்னம்", sign: "Not Found", lord: "-" });
        }

        // 2. Moon
        const moonHouse = houses.find(h => hasPlanet(getPlanets(h), ['Moon', 'Chandra']));
        if (moonHouse) {
            const signName = moonHouse.signTamil || tamilSigns[moonHouse.signNumber];
            const lordName = moonHouse.lord || signLords[moonHouse.signNumber];
            const lordTamil = signLordsTamil[lordName] || lordName;
            summary.push({ label: "சந்திரன்", sign: signName, lord: lordTamil });
        } else {
             summary.push({ label: "சந்திரன்", sign: "Not Found", lord: "-" });
        }

        // 3. Nakshatra
        let nakshatraName = nakshatraData.name;
        let nakshatraLord = nakshatraData.lord;

        // Fallback: Try to find Nakshatra from the Moon planet object itself
        if (!nakshatraName && houses) {
            for (const h of houses) {
                const planets = getPlanets(h);
                const moon = planets.find(p => (typeof p === 'object' && p !== null) &&
                    (p.name === 'Moon' || p.englishName === 'Moon' || p.id === 'Moon' || p.name === 'Chandra'));

                if (moon) {
                    if (moon.nakshatra) {
                         // It could be an object { name: '...', ... } or string
                         nakshatraName = (typeof moon.nakshatra === 'object') ? moon.nakshatra.name : moon.nakshatra;
                         nakshatraLord = (typeof moon.nakshatra === 'object') ? moon.nakshatra.lord : moon.nakshatraLord;
                    }
                    if (nakshatraName) break;
                }
            }
        }

        if (nakshatraName) {
             const lordName = nakshatraLord || "Unknown"; // default text if missing
             const lordTamil = planetFullTamilMap[lordName] || lordName || "";
             const nakshatraTamil = nakshatraTamilMap[nakshatraName] || nakshatraName;
             summary.push({ label: "நட்சத்திரம்", sign: nakshatraTamil, lord: lordTamil });
        } else {
             // Debug why Nakshatra is missing
             console.log("Nakshatra missing. Root Data:", nakshatraData);
             summary.push({ label: "நட்சத்திரம்", sign: "Not Found", lord: "-" });
        }

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
             <Box sx={{
                bgcolor: '#059669',
                backgroundImage: 'linear-gradient(to right, #059669, #10B981)',
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
             }}>
                <SportsCricketIcon />
                <Typography variant="h6" fontWeight="900" component="div">Match Prediction Setup</Typography>
                <Box sx={{ flexGrow: 1 }} />
                {matchDetails.time && (
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Prediction Time: {matchDetails.time}
                    </Typography>
                )}
             </Box>

            <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            label="Date"
                            type="date"
                            value={matchDetails.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            label="Time"
                            type="time"
                            value={matchDetails.time}
                            onChange={(e) => handleChange('time', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                            freeSolo
                            options={cityOptions}
                            getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                            value={matchDetails.location}
                            onChange={handleCityChange}
                            onInputChange={(event, newInputValue) => {
                                handleChange('location', newInputValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Location (City)"
                                    fullWidth
                                    helperText="Select from list for auto-coords"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': { borderColor: '#059669' },
                                            color: '#0b8f39', // Input text color
                                            fontWeight: 'bold'
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#059669' }
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Latitude"
                            type="number"
                            fullWidth
                            value={matchDetails.lat}
                            onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Longitude"
                            type="number"
                            fullWidth
                            value={matchDetails.long}
                            onChange={(e) => handleChange('long', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Timezone (e.g., 5.5 for IST)"
                            type="number"
                            fullWidth
                            value={matchDetails.timezone}
                            onChange={(e) => handleChange('timezone', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                         <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            onClick={handleViewChart}
                            disabled={viewChartLoading || loading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                color: '#059669',
                                borderColor: '#059669',
                                '&:hover': { bgcolor: '#f0fdf4', borderColor: '#047857' },
                                borderRadius: '12px',
                                fontWeight: 'bold'
                            }}
                        >
                            {viewChartLoading ? <CircularProgress size={24} color="inherit" /> : "View Rasi Chart"}
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handleRun}
                            disabled={loading || viewChartLoading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                bgcolor: '#059669',
                                '&:hover': { bgcolor: '#047857' },
                                borderRadius: '12px',
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Predict Match"}
                        </Button>
                    </Grid>
                </Grid>
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
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{row.label}</TableCell>
                                                    <TableCell>{row.sign}</TableCell>
                                                    <TableCell>{row.lord}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                             </Box>

                             {/* Raw Data Tables */}
                             {chartData.moonNakshatra && renderRawDataTable("Moon Nakshatra Details", chartData.moonNakshatra)}
                             {(chartData.houses && chartData.houses["1"]) && renderRawDataTable("House 1 Details", chartData.houses["1"])}


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
