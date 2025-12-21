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
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff8e7', border: '1px solid #ddd' }}>
            <Typography variant="h6" color="primary" display="flex" alignItems="center" gap={1} gutterBottom>
                <SportsCricketIcon /> Match Prediction Setup (போட்டி கணிப்பு அமைப்பு)
            </Typography>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                    <TextField
                        label="தேதி (Date)"
                        type="date"
                        fullWidth
                        size="small"
                        value={matchDetails.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        label="நேரம் (Time)"
                        type="time"
                        fullWidth
                        size="small"
                        value={matchDetails.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
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
                                label="இடம் (City)"
                                size="small"
                                fullWidth
                                helperText={`Lat: ${matchDetails.lat}, Long: ${matchDetails.long}`}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        label="நேர மண்டலம் (Timezone)"
                        type="number"
                        fullWidth
                        size="small"
                        value={matchDetails.timezone}
                        onChange={(e) => handleChange('timezone', parseFloat(e.target.value))}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        onClick={handleRun}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : "Predict"}
                    </Button>
                </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Paper>
    );
};

export default MatchPredictionControl;
