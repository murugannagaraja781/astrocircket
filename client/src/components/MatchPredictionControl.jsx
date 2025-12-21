import React, { useState } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert } from '@mui/material';
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

    // Simple manual coordinate lookup for demo (should be Google Maps API in prod)
    const handleLocationBlur = () => {
        const loc = matchDetails.location.toLowerCase();
        if (loc.includes('mumbai')) handleChange('lat', 19.0760);
        else if (loc.includes('chennai')) handleChange('lat', 13.0827);
        else if (loc.includes('bangalore')) handleChange('lat', 12.9716);
        else if (loc.includes('delhi')) handleChange('lat', 28.6139);
        else if (loc.includes('kolkata')) handleChange('lat', 22.5726);
        else if (loc.includes('london')) { handleChange('lat', 51.5074); handleChange('long', -0.1278); handleChange('timezone', 0); }
        else if (loc.includes('melbourne')) { handleChange('lat', -37.8136); handleChange('long', 144.9631); handleChange('timezone', 10); }
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
                <SportsCricketIcon /> Match Prediction Setup
            </Typography>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                    <TextField
                        label="Match Date"
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
                        label="Time"
                        type="time"
                        fullWidth
                        size="small"
                        value={matchDetails.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField
                        label="Location (City)"
                        fullWidth
                        size="small"
                        value={matchDetails.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        onBlur={handleLocationBlur}
                        helperText={`Lat: ${matchDetails.lat}, Long: ${matchDetails.long}`}
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        label="Timezone"
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
