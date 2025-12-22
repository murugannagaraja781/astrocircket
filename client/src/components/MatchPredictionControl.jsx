import React, { useState } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert, Autocomplete } from '@mui/material';
import axios from 'axios';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';

const MatchPredictionControl = ({ onPredictionComplete, token }) => {
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: '19:30',
        location: 'Mumbai, India', // Default
        lat: 19.0760,
        long: 72.8777,
        timezone: 5.5
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    return (
        <Paper elevation={3} sx={{ p: 0, mb: 3, overflow: 'hidden' }}>
             {/* AppBar inside Control */}
             <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SportsCricketIcon />
                <Typography variant="h6">Match Prediction Setup</Typography>
                <Box sx={{ flexGrow: 1 }} />
                {matchDetails.time && (
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Prediction Time: {matchDetails.time}
                    </Typography>
                )}
             </Box>

             <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Date"
                            type="date"
                            value={matchDetails.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Time"
                            type="time"
                            value={matchDetails.time}
                            onChange={(e) => handleChange('time', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
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
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Latitude"
                            type="number"
                            fullWidth
                            value={matchDetails.lat}
                            onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Longitude"
                            type="number"
                            fullWidth
                            value={matchDetails.long}
                            onChange={(e) => handleChange('long', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Timezone (e.g., 5.5 for IST)"
                            type="number"
                            fullWidth
                            value={matchDetails.timezone}
                            onChange={(e) => handleChange('timezone', parseFloat(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                     <Grid item xs={12}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handleRun}
                            disabled={loading}
                            sx={{ mt: 1, py: 1.5, fontSize: '1.1rem' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : `Predict for ${matchDetails.date} @ ${matchDetails.time}`}
                        </Button>
                    </Grid>
                </Grid>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Box>
        </Paper>
    );
};

export default MatchPredictionControl;
