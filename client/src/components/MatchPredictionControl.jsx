import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert, Autocomplete, Collapse, Fab, Tooltip } from '@mui/material';
import axios from 'axios';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControlLabel, Checkbox } from '@mui/material';
import { Country, State, City } from 'country-state-city';
import ct from 'countries-and-timezones';
import RasiChart, { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, planetFullTamilMap, getSignId, getNakshatraLordHelper as getNakLordFromRasiChart } from './RasiChart';

const MatchPredictionControl = forwardRef(({ onPredictionComplete, onPredictionStart, token, rightSlot, layout = 'default' }, ref) => {
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: '19:30', // Venue Local Time (sent to calculation backend)
        istTime: '19:30', // Indian Standard Time (IST)
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
    const [lagnaModalOpen, setLagnaModalOpen] = useState(false);
    const [lagnaLoading, setLagnaLoading] = useState(false);

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

    const convertIstToLocal = (ist, tz) => {
        if (!ist) return '';
        const [h, m] = ist.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return ist;
        const targetTz = typeof tz === 'number' ? tz : parseFloat(tz) || 5.5;
        const diffMin = (targetTz - 5.5) * 60;
        let totalMin = Math.round(h * 60 + m + diffMin);
        totalMin = ((totalMin % 1440) + 1440) % 1440;
        const lh = Math.floor(totalMin / 60);
        const lm = totalMin % 60;
        return `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}`;
    };

    const convertLocalToIst = (local, tz) => {
        if (!local) return '';
        const [h, m] = local.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return local;
        const targetTz = typeof tz === 'number' ? tz : parseFloat(tz) || 5.5;
        const diffMin = (5.5 - targetTz) * 60;
        let totalMin = Math.round(h * 60 + m + diffMin);
        totalMin = ((totalMin % 1440) + 1440) % 1440;
        const ih = Math.floor(totalMin / 60);
        const im = totalMin % 60;
        return `${String(ih).padStart(2, '0')}:${String(im).padStart(2, '0')}`;
    };

    const formatToIST = (isoString) => {
        if (!isoString) return '-';
        try {
            const utcDate = new Date(isoString);
            if (isNaN(utcDate.getTime())) return '-';
            const istMs = utcDate.getTime() + (5.5 * 3600000);
            const d = new Date(istMs);
            const hours = d.getUTCHours().toString().padStart(2, '0');
            const minutes = d.getUTCMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            return '-';
        }
    };

    const handleTimeChange = (type, val) => {
        if (type === 'ist') {
            const newLocal = convertIstToLocal(val, matchDetails.timezone);
            setMatchDetails(prev => ({ ...prev, istTime: val, time: newLocal }));
        } else {
            const newIst = convertLocalToIst(val, matchDetails.timezone);
            setMatchDetails(prev => ({ ...prev, time: val, istTime: newIst }));
        }
    };

    const handleChange = (field, value) => {
        setMatchDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationSearch = (event, newInputValue) => {
        if (!newInputValue || newInputValue.trim().length < 2) {
            setLocationOptions([]);
            return;
        }

        setLocationLoading(true);
        setTimeout(() => {
            const q = newInputValue.trim().toLowerCase();
            const all = City.getAllCities();
            const r1 = []; // Prefix match in India (IN)
            const r2 = []; // Prefix match elsewhere
            const r3 = []; // Substring match in India (IN)
            const r4 = []; // Substring match elsewhere

            for (let i = 0; i < all.length; i++) {
                const c = all[i];
                const nl = c.name.toLowerCase();
                if (!nl.includes(q)) continue;

                const isPrefix = nl.startsWith(q);
                const isIndia = c.countryCode === 'IN';

                if (isPrefix && isIndia) r1.push(c);
                else if (isPrefix) r2.push(c);
                else if (isIndia) r3.push(c);
                else r4.push(c);

                if (r1.length >= 30) break;
            }

            setLocationOptions([...r1, ...r2, ...r3, ...r4].slice(0, 50));
            setLocationLoading(false);
        }, 120);
    };

    const handleLocationSelect = (event, val) => {
        if (val) {
            const country = Country.getCountryByCode(val.countryCode);
            const state = State.getStateByCodeAndCountry(val.stateCode, val.countryCode);
            const locationName = `${val.name}, ${state?.name || val.stateCode}, ${country?.name || val.countryCode}`;
            const lat = parseFloat(val.latitude);
            const long = parseFloat(val.longitude);
            let tz = 5.5;

            if (val.countryCode === 'IN') {
                tz = 5.5;
            } else {
                try {
                    const timezones = ct.getTimezonesForCountry(val.countryCode);
                    if (timezones && timezones.length === 1) {
                        tz = timezones[0].utcOffset / 60;
                    } else if (timezones && timezones.length > 1) {
                        let bestTz = timezones[0];
                        let minDiff = 999;
                        timezones.forEach(t => {
                            const tzNominalLong = (t.utcOffset / 60) * 15;
                            const diff = Math.abs(tzNominalLong - long);
                            if (diff < minDiff) {
                                minDiff = diff;
                                bestTz = t;
                            }
                        });
                        tz = bestTz.utcOffset / 60;
                    } else {
                        tz = calculateTimezone(long);
                    }
                } catch (e) {
                    tz = calculateTimezone(long);
                }
            }

            const currentIst = matchDetails.istTime || convertLocalToIst(matchDetails.time, matchDetails.timezone) || '19:30';
            const newLocalTime = convertIstToLocal(currentIst, tz);

            setMatchDetails(prev => ({
                ...prev,
                location: locationName,
                lat,
                long,
                timezone: tz,
                istTime: currentIst,
                time: newLocalTime
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
            const baseUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:5001');
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

            const baseUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:5001');
            const res = await axios.post(`${baseUrl}/api/charts/birth-chart`, payload, {
                headers: { 'x-auth-token': token }
            });

            setChartData(res.data);
            if (!matchChartResult) {
                setMatchChartResult(res.data);
            }
            setViewChartOpen(true);

        } catch (err) {
            console.error("View Chart Error", err);
            setError("Failed to fetch Rasi Chart.");
        } finally {
            setViewChartLoading(false);
        }
    };

    const handleOpenLagnaModal = async () => {
        const activeData = matchChartResult || chartData;
        if (activeData?.lagnaTimeline && activeData.lagnaTimeline.length > 0) {
            setLagnaModalOpen(true);
            return;
        }

        setLagnaLoading(true);
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

            const baseUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:5001');
            const res = await axios.post(`${baseUrl}/api/charts/birth-chart`, payload, {
                headers: { 'x-auth-token': token }
            });

            setChartData(res.data);
            setMatchChartResult(res.data);
            setLagnaModalOpen(true);
        } catch (err) {
            console.error("Fetch Lagna Transit Error", err);
            setError("Failed to fetch Lagna Transit.");
        } finally {
            setLagnaLoading(false);
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

    const formatLagnaTime = (isoString, fallbackTime = null) => {
        if (fallbackTime && typeof fallbackTime === 'string') return fallbackTime;
        if (!isoString) return '-';
        try {
            const utcDate = new Date(isoString);
            if (isNaN(utcDate.getTime())) return isoString;
            const tz = typeof matchDetails.timezone === 'number' ? matchDetails.timezone : (parseFloat(matchDetails.timezone) || 5.5);
            const localMs = utcDate.getTime() + (tz * 3600000);
            const d = new Date(localMs);
            const hours = d.getUTCHours();
            const minutes = d.getUTCMinutes().toString().padStart(2, '0');
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        } catch (e) {
            console.error("Time format error", e);
            return isoString.split('T')[1]?.slice(0, 5) || isoString;
        }
    };

    const renderLagnaTransitContent = (data) => {
        if (!data) return null;
        const ascSign = data.ascendant?.tamil || data.ascendant?.english || '-';
        const ascSignId = getSignId(data.ascendant);
        const ascLordRaw = data.ascendant?.lordTamil || data.ascendant?.lord || (ascSignId ? signLords[ascSignId] : null);
        const ascLord = signLordsTamil[ascLordRaw] || planetFullTamilMap[ascLordRaw] || ascLordRaw || '-';

        const ascNakName = data.ascendant?.nakshatra?.tamil || nakshatraTamilMap[data.ascendant?.nakshatra?.name] || data.ascendant?.nakshatra?.name || '-';
        const ascNakLord = planetFullTamilMap[getNakshatraLordHelper(data.ascendant?.nakshatra?.name)] || getNakshatraLordHelper(data.ascendant?.nakshatra?.name) || '-';

        const moonSign = data.moonSign?.tamil || data.moonSign?.english || '-';
        const moonLordRaw = data.moonSign?.lordTamil || data.moonSign?.lord || (getSignId(data.moonSign) ? signLords[getSignId(data.moonSign)] : null);
        const moonLord = signLordsTamil[moonLordRaw] || planetFullTamilMap[moonLordRaw] || moonLordRaw || '-';

        const nakObj = data.moonNakshatra || data.nakshatra || {};
        const nakTamil = nakObj.tamil || nakshatraTamilMap[nakObj.name] || nakObj.name || '-';
        const nakLordRaw = nakObj.lordTamil || nakObj.lord || getNakshatraLordHelper(nakObj.name || nakObj.tamil);
        const nakLord = signLordsTamil[nakLordRaw] || planetFullTamilMap[nakLordRaw] || nakLordRaw || '-';
        const pada = nakObj.pada || '-';

        const timeline = data.lagnaTimeline || [];

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 4 Summary Highlight Cards */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 1.2
                }}>
                    <Paper elevation={0} sx={{ p: 1.2, bgcolor: 'rgba(255, 193, 7, 0.12)', border: '1px solid #FFE082', borderRadius: '10px' }}>
                        <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 'bold', display: 'block', fontSize: '0.72rem' }}>🟡 லக்னம் (Ascendant)</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: '900', color: '#212121', my: 0.3, fontSize: '0.95rem' }}>
                            {ascSign}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#555', display: 'block', fontSize: '0.7rem' }}>
                            {ascNakName} • அதிபதி: <b style={{ color: '#E65100' }}>{ascLord}</b>
                        </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1.2, bgcolor: 'rgba(25, 118, 210, 0.08)', border: '1px solid #90CAF9', borderRadius: '10px' }}>
                        <Typography variant="caption" sx={{ color: '#1565C0', fontWeight: 'bold', display: 'block', fontSize: '0.72rem' }}>🔵 ராசி (சந்திரன்)</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: '900', color: '#212121', my: 0.3, fontSize: '0.95rem' }}>
                            {moonSign}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#555', display: 'block', fontSize: '0.7rem' }}>
                            அதிபதி: <b style={{ color: '#1565C0' }}>{moonLord}</b>
                        </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1.2, bgcolor: 'rgba(123, 31, 162, 0.08)', border: '1px solid #CE93D8', borderRadius: '10px' }}>
                        <Typography variant="caption" sx={{ color: '#7B1FA2', fontWeight: 'bold', display: 'block', fontSize: '0.72rem' }}>🟣 நட்சத்திரம்</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: '900', color: '#212121', my: 0.3, fontSize: '0.95rem' }}>
                            {nakTamil}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#555', display: 'block', fontSize: '0.7rem' }}>
                            அதிபதி: <b style={{ color: '#7B1FA2' }}>{nakLord}</b>
                        </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1.2, bgcolor: 'rgba(46, 125, 50, 0.08)', border: '1px solid #A5D6A7', borderRadius: '10px' }}>
                        <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 'bold', display: 'block', fontSize: '0.72rem' }}>🔢 பாதம்</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: '900', color: '#212121', my: 0.3, fontSize: '0.95rem' }}>
                            {pada}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#555', display: 'block', fontSize: '0.7rem' }}>
                            நட்சத்திர பாதம்
                        </Typography>
                    </Paper>
                </Box>

                {/* Lagna Transit Timeline Table */}
                {timeline.length > 0 && (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid rgba(255, 111, 0, 0.25)', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'rgba(255, 193, 7, 0.18)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>
                                        தொடக்கம் {matchDetails.timezone !== 5.5 ? '(LOCAL / IST)' : '(LOCAL)'}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>
                                        முடிவு {matchDetails.timezone !== 5.5 ? '(LOCAL / IST)' : '(LOCAL)'}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>லக்னம்</TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>நட்சத்திரம்</TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>அதிபதி</TableCell>
                                    <TableCell sx={{ fontWeight: '900', color: '#E65100', fontSize: '0.75rem', px: 1 }}>கால அளவு</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(() => {
                                    let lagnaCount = 0;
                                    let nakCount = 0;
                                    let prevLagna = null;
                                    let prevNak = null;
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
                                        const nakSlotTamil = slot.nakshatraTamil || nakshatraTamilMap[slot.nakshatra] || slot.nakshatra || '-';
                                        const nakLordTamil = planetFullTamilMap[slot.nakshatraLord] || slot.nakshatraLord || '-';

                                        const startMs = new Date(slot.start).getTime();
                                        const endMs = new Date(slot.end).getTime();
                                        const diffMs = endMs - startMs;
                                        const diffMin = Math.floor(diffMs / 60000);
                                        const durationHrs = Math.floor(diffMin / 60);
                                        const durationMins = diffMin % 60;
                                        const durationStr = durationHrs > 0 ? `${durationHrs}h ${durationMins}m` : `${durationMins}m`;

                                        const lagnaColors = ['#FF6F00', '#1565C0', '#2E7D32', '#6A1B9A', '#C62828'];
                                        const lColor = lagnaColors[(parseInt(slot.lagnaLabel.slice(1)) - 1) % lagnaColors.length];

                                        return (
                                            <TableRow key={index} sx={{
                                                bgcolor: slot.isMain ? 'rgba(255, 193, 7, 0.1)' : (index % 2 === 0 ? '#fff' : 'rgba(250, 250, 250, 0.8)'),
                                                '&:hover': { bgcolor: 'rgba(255, 238, 204, 0.3)' }
                                            }}>
                                                <TableCell sx={{ fontSize: '0.72rem', px: 1, whiteSpace: 'nowrap' }}>
                                                    <Box sx={{ display: 'flex', gap: 0.4 }}>
                                                        <Box sx={{
                                                            bgcolor: lColor, color: '#fff', px: 0.6, py: 0.15,
                                                            borderRadius: '4px', fontSize: '0.62rem', fontWeight: 'bold',
                                                            lineHeight: 1.3, minWidth: '22px', textAlign: 'center'
                                                        }}>{slot.lagnaLabel}</Box>
                                                        <Box sx={{
                                                            bgcolor: '#00897B', color: '#fff', px: 0.6, py: 0.15,
                                                            borderRadius: '4px', fontSize: '0.62rem', fontWeight: 'bold',
                                                            lineHeight: 1.3, minWidth: '22px', textAlign: 'center'
                                                        }}>{slot.nakLabel}</Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', px: 1, whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                                                        <span>{slot.startTime || formatLagnaTime(slot.start)}</span>
                                                        {matchDetails.timezone !== 5.5 && (
                                                            <Typography component="span" sx={{ fontSize: '0.65rem', color: '#E65100', bgcolor: 'rgba(255, 111, 0, 0.1)', px: 0.5, py: 0.1, borderRadius: '4px', fontWeight: 'bold', width: 'fit-content' }}>
                                                                🇮🇳 {formatToIST(slot.start)} IST
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', px: 1, whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                                                        <span>{slot.endTime || formatLagnaTime(slot.end)}</span>
                                                        {matchDetails.timezone !== 5.5 && (
                                                            <Typography component="span" sx={{ fontSize: '0.65rem', color: '#E65100', bgcolor: 'rgba(255, 111, 0, 0.1)', px: 0.5, py: 0.1, borderRadius: '4px', fontWeight: 'bold', width: 'fit-content' }}>
                                                                🇮🇳 {formatToIST(slot.end)} IST
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', px: 1, fontWeight: slot.isMain ? 'bold' : 'normal' }}>
                                                    {lagnaTamil} {slot.isMain ? '⭐' : ''}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', px: 1 }}>{nakSlotTamil}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', px: 1 }}>
                                                    {lordTamil} / {nakLordTamil}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', px: 1, color: '#666' }}>{durationStr}</TableCell>
                                            </TableRow>
                                        );
                                    });
                                })()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        );
    };

    const isSidebar = layout === 'sidebar';

    const matchFormBox = (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.2, sm: 1.5 },
                bgcolor: '#FFFBF5',
                borderRadius: '14px',
                border: '1px solid rgba(255, 111, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            {/* Title Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                    bgcolor: 'rgba(255, 111, 0, 0.08)',
                    p: 0.8,
                    px: 1.2,
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 111, 0, 0.15)'
                }}
            >
                <Typography variant="subtitle2" fontWeight="900" sx={{ color: '#FF6F00', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.85rem' }}>
                    📅 Match Schedule & Venue
                </Typography>
                <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 'bold', bgcolor: 'white', px: 1, py: 0.3, borderRadius: '6px', border: '1px solid #FFCC80', fontSize: '0.72rem' }}>
                    {matchDetails.date} @ {matchDetails.istTime || convertLocalToIst(matchDetails.time, matchDetails.timezone)} IST {matchDetails.timezone !== 5.5 ? `• ${matchDetails.time} Local` : ''}
                </Typography>
            </Box>

            {/* Row 1 & 2: Match Date, Time, Venue */}
            {isSidebar ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Row 1: Match Date (Full Width) */}
                    <TextField
                        label="Match Date"
                        type="date"
                        size="small"
                        fullWidth
                        value={matchDetails.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#E65100', fontSize: '0.75rem' } }}
                        InputProps={{
                            sx: {
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                bgcolor: '#fff',
                                height: 38,
                                fontSize: '0.82rem',
                                border: '1px solid #FFCC80'
                            }
                        }}
                    />

                    {/* Row 2: Match Time (IST) & Venue Local Time side-by-side in 2 equal columns */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField
                            label="Match Time (IST 🇮🇳)"
                            type="time"
                            size="small"
                            fullWidth
                            value={matchDetails.istTime || convertLocalToIst(matchDetails.time, matchDetails.timezone)}
                            onChange={(e) => handleTimeChange('ist', e.target.value)}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#E65100', fontSize: '0.75rem' } }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    bgcolor: '#FFF8E1',
                                    height: 38,
                                    fontSize: '0.82rem',
                                    border: '1px solid #FFB300'
                                }
                            }}
                        />
                        <TextField
                            label={`Venue Local 📍 (${matchDetails.timezone >= 0 ? '+' + matchDetails.timezone : matchDetails.timezone} TZ)`}
                            type="time"
                            size="small"
                            fullWidth
                            value={matchDetails.time}
                            onChange={(e) => handleTimeChange('local', e.target.value)}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#1565C0', fontSize: '0.75rem' } }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    bgcolor: '#E3F2FD',
                                    height: 38,
                                    fontSize: '0.82rem',
                                    border: '1px solid #90CAF9'
                                }
                            }}
                        />
                    </Box>

                    {/* Row 2: Search Venue (City) - 100% Full Width */}
                    <Box sx={{ width: '100%' }}>
                        <Autocomplete
                            fullWidth
                            sx={{ width: '100%' }}
                            options={locationOptions}
                            loading={locationLoading}
                            getOptionLabel={(option) => {
                                if (!option) return '';
                                if (typeof option === 'string') return option;
                                const country = Country.getCountryByCode(option.countryCode);
                                const state = State.getStateByCodeAndCountry(option.stateCode, option.countryCode);
                                return `${option.name}, ${state?.name || option.stateCode}, ${country?.name || option.countryCode}`;
                            }}
                            onInputChange={handleLocationSearch}
                            onChange={handleLocationSelect}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search Venue (City)"
                                    size="small"
                                    fullWidth
                                    placeholder="Search venue (e.g. Coimbatore, Chennai, Mumbai...)"
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#E65100', fontSize: '0.75rem' } }}
                                    InputProps={{
                                        ...params.InputProps,
                                        sx: {
                                            borderRadius: '10px',
                                            bgcolor: '#fff',
                                            height: 38,
                                            fontSize: '0.82rem',
                                            border: '1px solid #FFCC80',
                                            width: '100%'
                                        },
                                        endAdornment: (
                                            <React.Fragment>
                                                {locationLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => {
                                const country = Country.getCountryByCode(option.countryCode);
                                const state = State.getStateByCodeAndCountry(option.stateCode, option.countryCode);
                                const isIndia = option.countryCode === 'IN';
                                return (
                                    <li {...props} key={`${option.name}-${option.latitude}-${option.longitude}`}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">{option.name}</Typography>
                                                <Typography variant="caption" sx={{
                                                    bgcolor: isIndia ? '#E8F5E9' : '#EDE7F6',
                                                    color: isIndia ? '#2E7D32' : '#512DA8',
                                                    px: 0.8, py: 0.2, borderRadius: '4px', fontWeight: 'bold'
                                                }}>
                                                    {isIndia ? '🇮🇳 India (+5.5)' : option.countryCode}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="textSecondary">
                                                {state?.name || option.stateCode}, {country?.name || option.countryCode} (Lat: {parseFloat(option.latitude).toFixed(2)}, Long: {parseFloat(option.longitude).toFixed(2)})
                                            </Typography>
                                        </Box>
                                    </li>
                                );
                            }}
                        />
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Row 1: Date & Time (IST + Local if venue is abroad) */}
                    <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            label="Match Date"
                            type="date"
                            size="small"
                            value={matchDetails.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#E65100', fontSize: '0.75rem' } }}
                            sx={{ width: { xs: '100%', sm: 175 } }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    bgcolor: '#fff',
                                    height: 38,
                                    fontSize: '0.82rem',
                                    border: '1px solid #FFCC80'
                                }
                            }}
                        />

                        {/* Match Time (IST) */}
                        <TextField
                            label={matchDetails.timezone === 5.5 ? "Match Time (IST)" : "Match Time (IST 🇮🇳)"}
                            type="time"
                            size="small"
                            value={matchDetails.istTime || convertLocalToIst(matchDetails.time, matchDetails.timezone)}
                            onChange={(e) => handleTimeChange('ist', e.target.value)}
                            InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#E65100', fontSize: '0.75rem' } }}
                            sx={{ width: { xs: '100%', sm: 165 } }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    bgcolor: matchDetails.timezone === 5.5 ? '#fff' : '#FFF8E1',
                                    height: 38,
                                    fontSize: '0.82rem',
                                    border: matchDetails.timezone === 5.5 ? '1px solid #FFCC80' : '1px solid #FFB300'
                                }
                            }}
                        />

                        {/* If abroad: Venue Local Time */}
                        {matchDetails.timezone !== 5.5 && (
                            <React.Fragment>
                                <TextField
                                    label={`Venue Time (Local TZ ${matchDetails.timezone >= 0 ? '+' + matchDetails.timezone : matchDetails.timezone})`}
                                    type="time"
                                    size="small"
                                    value={matchDetails.time}
                                    onChange={(e) => handleTimeChange('local', e.target.value)}
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#1565C0', fontSize: '0.75rem' } }}
                                    sx={{ width: { xs: '100%', sm: 195 } }}
                                    InputProps={{
                                        sx: {
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            bgcolor: '#E3F2FD',
                                            height: 38,
                                            fontSize: '0.82rem',
                                            border: '1px solid #90CAF9'
                                        }
                                    }}
                                />
                                <Box sx={{
                                    bgcolor: 'rgba(21, 101, 192, 0.08)',
                                    color: '#0D47A1',
                                    px: 1, py: 0.5,
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 'bold',
                                    border: '1px solid rgba(21, 101, 192, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}>
                                    🔄 {matchDetails.timezone - 5.5 >= 0 ? `+${(matchDetails.timezone - 5.5).toFixed(1)}h ahead of IST` : `${(matchDetails.timezone - 5.5).toFixed(1)}h behind IST`}
                                </Box>
                            </React.Fragment>
                        )}
                    </Box>

                    {/* Row 2: Search Venue (City) - 100% Full Width (Tripled Size!) */}
                    <Box sx={{ width: '100%' }}>
                        <Autocomplete
                            fullWidth
                            sx={{ width: '100%' }}
                            options={locationOptions}
                            loading={locationLoading}
                            getOptionLabel={(option) => {
                                if (!option) return '';
                                if (typeof option === 'string') return option;
                                const country = Country.getCountryByCode(option.countryCode);
                                const state = State.getStateByCodeAndCountry(option.stateCode, option.countryCode);
                                return `${option.name}, ${state?.name || option.stateCode}, ${country?.name || option.countryCode}`;
                            }}
                            onInputChange={handleLocationSearch}
                            onChange={handleLocationSelect}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search Venue (City)"
                                    size="small"
                                    fullWidth
                                    placeholder="Search venue city (e.g. Coimbatore, Chennai, Mumbai, London...)"
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 'bold', color: '#E65100', fontSize: '0.75rem' } }}
                                    InputProps={{
                                        ...params.InputProps,
                                        sx: {
                                            borderRadius: '10px',
                                            bgcolor: '#fff',
                                            height: 38,
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            border: '1px solid #FFCC80',
                                            width: '100%'
                                        },
                                        endAdornment: (
                                            <React.Fragment>
                                                {locationLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => {
                                const country = Country.getCountryByCode(option.countryCode);
                                const state = State.getStateByCodeAndCountry(option.stateCode, option.countryCode);
                                const isIndia = option.countryCode === 'IN';
                                return (
                                    <li {...props} key={`${option.name}-${option.latitude}-${option.longitude}`}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    bgcolor: isIndia ? '#E8F5E9' : '#EDE7F6',
                                                    color: isIndia ? '#2E7D32' : '#512DA8',
                                                    px: 0.8, py: 0.2, borderRadius: '4px', fontWeight: 'bold'
                                                }}>
                                                    {isIndia ? '🇮🇳 India (+5.5)' : option.countryCode}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="textSecondary">
                                                {state?.name || option.stateCode}, {country?.name || option.countryCode} (Lat: {parseFloat(option.latitude).toFixed(2)}, Long: {parseFloat(option.longitude).toFixed(2)})
                                            </Typography>
                                        </Box>
                                    </li>
                                );
                            }}
                        />
                    </Box>
                </Box>
            )}

            {/* Row 2: Lat/Long/TZ/Ayanamsa (Strict Single Line) */}
            {isSidebar ? (
                <Box sx={{ mt: 1 }}>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: '1.15fr 1.15fr 0.8fr 1.35fr',
                        gap: 0.6,
                        alignItems: 'center'
                    }}>
                        <TextField
                            label="Lat"
                            value={matchDetails.lat}
                            size="small"
                            disabled
                            fullWidth
                            InputProps={{ style: { fontSize: '0.72rem', height: 32, padding: '0 6px' } }}
                            InputLabelProps={{ shrink: true, style: { fontSize: '0.68rem', fontWeight: 'bold' } }}
                        />
                        <TextField
                            label="Long"
                            value={matchDetails.long}
                            size="small"
                            disabled
                            fullWidth
                            InputProps={{ style: { fontSize: '0.72rem', height: 32, padding: '0 6px' } }}
                            InputLabelProps={{ shrink: true, style: { fontSize: '0.68rem', fontWeight: 'bold' } }}
                        />
                        <TextField
                            label="TZ"
                            value={matchDetails.timezone}
                            size="small"
                            disabled
                            fullWidth
                            InputProps={{ style: { fontSize: '0.72rem', height: 32, padding: '0 4px', textAlign: 'center' } }}
                            InputLabelProps={{ shrink: true, style: { fontSize: '0.68rem', fontWeight: 'bold' } }}
                        />
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
                            fullWidth
                            InputProps={{ style: { fontSize: '0.72rem', height: 32, padding: '0 4px' } }}
                            InputLabelProps={{ shrink: true, style: { fontSize: '0.68rem', fontWeight: 'bold' } }}
                        >
                            <option value="Lahiri">Lahiri</option>
                            <option value="KP">KP</option>
                            <option value="KP Straight">KP Straight</option>
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1.2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleViewChart}
                            disabled={viewChartLoading || loading}
                            size="small"
                            fullWidth
                            sx={{
                                height: 34,
                                fontSize: '0.78rem',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                color: '#FF6F00',
                                borderColor: 'rgba(255, 111, 0, 0.4)',
                                bgcolor: 'rgba(255, 111, 0, 0.04)',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255, 111, 0, 0.1)', borderColor: '#FF6F00' }
                            }}
                        >
                            {viewChartLoading ? <CircularProgress size={14} /> : "📊 View Chart"}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleRun}
                            disabled={loading || viewChartLoading}
                            size="small"
                            fullWidth
                            sx={{
                                height: 34,
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #FF9800 0%, #FF6F00 100%)',
                                color: '#fff',
                                textTransform: 'none',
                                boxShadow: '0 2px 8px rgba(255, 111, 0, 0.35)',
                                '&:hover': { background: 'linear-gradient(135deg, #F57C00 0%, #E65100 100%)' }
                            }}
                        >
                            {loading ? <CircularProgress size={14} color="inherit" /> : "🚀 Predict Match"}
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <TextField label="Lat" value={matchDetails.lat} size="small" disabled sx={{ width: 64 }} InputProps={{ style: { fontSize: '0.7rem', height: 32 } }} InputLabelProps={{ shrink: true, style: { fontSize: '0.65rem' } }} />
                        <TextField label="Long" value={matchDetails.long} size="small" disabled sx={{ width: 64 }} InputProps={{ style: { fontSize: '0.7rem', height: 32 } }} InputLabelProps={{ shrink: true, style: { fontSize: '0.65rem' } }} />
                        <TextField label="TZ" value={matchDetails.timezone} size="small" disabled sx={{ width: 44 }} InputProps={{ style: { fontSize: '0.7rem', height: 32 } }} InputLabelProps={{ shrink: true, style: { fontSize: '0.65rem' } }} />
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
                            sx={{ width: 92 }}
                            InputProps={{ style: { fontSize: '0.7rem', height: 32 } }}
                            InputLabelProps={{ shrink: true, style: { fontSize: '0.65rem' } }}
                        >
                            <option value="Lahiri">Lahiri</option>
                            <option value="KP">KP</option>
                            <option value="KP Straight">KP Straight</option>
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        <Button
                            variant="outlined"
                            onClick={handleViewChart}
                            disabled={viewChartLoading || loading}
                            size="small"
                            sx={{
                                height: 32,
                                px: 1.5,
                                fontSize: '0.78rem',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                color: '#FFB300',
                                borderColor: '#FFB300',
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255, 179, 0, 0.08)', borderColor: '#FFA000' }
                            }}
                        >
                            {viewChartLoading ? <CircularProgress size={14} /> : "📊 Chart"}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleRun}
                            disabled={loading || viewChartLoading}
                            size="small"
                            sx={{
                                height: 32,
                                px: 2,
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                bgcolor: '#FF6F00',
                                color: '#fff',
                                textTransform: 'none',
                                boxShadow: '0 2px 8px rgba(255, 111, 0, 0.35)',
                                '&:hover': { bgcolor: '#E65100' }
                            }}
                        >
                            {loading ? <CircularProgress size={14} color="inherit" /> : "🏏 Predict"}
                        </Button>
                    </Box>
                </Box>
            )}
        </Paper>
    );

    if (isSidebar) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {matchFormBox}
                {rightSlot}
                {error && <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>}
                {matchChartResult && (
                    <Box sx={{ mt: 1 }}>
                        <Box
                            onClick={() => setChartExpanded(!chartExpanded)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 1,
                                cursor: 'pointer',
                                bgcolor: 'rgba(255, 111, 0, 0.08)',
                                p: 1,
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 111, 0, 0.2)'
                            }}
                        >
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#FF6F00', fontSize: '0.8rem' }}>
                                📊 போட்டி ராசி விவரம்
                            </Typography>
                            <IconButton size="small" sx={{ p: 0.2, color: '#FF6F00' }}>
                                {chartExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                        </Box>
                        <Collapse in={chartExpanded}>
                            {(() => {
                                const ascSign = matchChartResult.ascendant?.tamil || matchChartResult.ascendant?.english || '-';
                                const ascSignId = getSignId(matchChartResult.ascendant);
                                const ascLordRaw = matchChartResult.ascendant?.lordTamil || matchChartResult.ascendant?.lord || (ascSignId ? signLords[ascSignId] : null);
                                const ascLord = signLordsTamil[ascLordRaw] || planetFullTamilMap[ascLordRaw] || ascLordRaw || '-';

                                const moonSign = matchChartResult.moonSign?.tamil || matchChartResult.moonSign?.english || '-';
                                const moonSignId = getSignId(matchChartResult.moonSign);
                                const moonLordRaw = matchChartResult.moonSign?.lordTamil || matchChartResult.moonSign?.lord || (moonSignId ? signLords[moonSignId] : null);
                                const moonLord = signLordsTamil[moonLordRaw] || planetFullTamilMap[moonLordRaw] || moonLordRaw || '-';

                                const nakObj = matchChartResult.moonNakshatra || matchChartResult.nakshatra || {};
                                const nakTamil = nakObj.tamil || nakshatraTamilMap[nakObj.name] || nakObj.name || '-';
                                const nakLordRaw = nakObj.lordTamil || nakObj.lord || getNakshatraLordHelper(nakObj.name || nakObj.tamil);
                                const nakLord = signLordsTamil[nakLordRaw] || planetFullTamilMap[nakLordRaw] || nakLordRaw || '-';

                                return (
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 0.6,
                                        mt: 0.5
                                    }}>
                                        <Paper elevation={0} sx={{ p: 0.6, textAlign: 'center', bgcolor: 'rgba(255, 193, 7, 0.12)', border: '1px solid #FFE082', borderRadius: '8px' }}>
                                            <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 'bold', display: 'block', fontSize: '0.65rem', lineHeight: 1.2 }}>🟡 லக்னம்</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: '900', color: '#212121', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', my: 0.2 }}>
                                                {ascSign}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 'bold', display: 'block', fontSize: '0.68rem', bgcolor: 'rgba(255, 193, 7, 0.25)', borderRadius: '4px', py: 0.1, px: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`அதிபதி: ${ascLord}`}>
                                                {ascLord}
                                            </Typography>
                                        </Paper>
                                        <Paper elevation={0} sx={{ p: 0.6, textAlign: 'center', bgcolor: 'rgba(25, 118, 210, 0.08)', border: '1px solid #90CAF9', borderRadius: '8px' }}>
                                            <Typography variant="caption" sx={{ color: '#1565C0', fontWeight: 'bold', display: 'block', fontSize: '0.65rem', lineHeight: 1.2 }}>🔵 ராசி</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: '900', color: '#212121', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', my: 0.2 }}>
                                                {moonSign}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 'bold', display: 'block', fontSize: '0.68rem', bgcolor: 'rgba(25, 118, 210, 0.12)', borderRadius: '4px', py: 0.1, px: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`அதிபதி: ${moonLord}`}>
                                                {moonLord}
                                            </Typography>
                                        </Paper>
                                        <Paper elevation={0} sx={{ p: 0.6, textAlign: 'center', bgcolor: 'rgba(123, 31, 162, 0.08)', border: '1px solid #CE93D8', borderRadius: '8px' }}>
                                            <Typography variant="caption" sx={{ color: '#7B1FA2', fontWeight: 'bold', display: 'block', fontSize: '0.65rem', lineHeight: 1.2 }}>🟣 நட்சத்திரம்</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: '900', color: '#212121', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', my: 0.2 }}>
                                                {nakTamil}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#6B21A8', fontWeight: 'bold', display: 'block', fontSize: '0.68rem', bgcolor: 'rgba(123, 31, 162, 0.12)', borderRadius: '4px', py: 0.1, px: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`அதிபதி: ${nakLord}`}>
                                                {nakLord}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                );
                            })()}
                            {/* Button to open full Lagna Timeline Modal */}
                            <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                onClick={handleOpenLagnaModal}
                                startIcon={<span>🪐</span>}
                                sx={{
                                    mt: 1.2,
                                    bgcolor: '#FF6F00',
                                    '&:hover': { bgcolor: '#E65100' },
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    boxShadow: '0 2px 8px rgba(255, 111, 0, 0.3)'
                                }}
                            >
                                🪐 முழு லக்ன அட்டவணை (View Lagna Timeline)
                            </Button>
                        </Collapse>
                    </Box>
                )}

                {/* View Chart Modal Dialog */}
                <Dialog
                    open={viewChartOpen}
                    onClose={() => setViewChartOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '16px' } }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FFFBF5', borderBottom: '1px solid #FFE0B2' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#FF6F00' }}>
                            📊 Match Astrological Chart Details
                        </Typography>
                        <IconButton onClick={() => setViewChartOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 2, bgcolor: '#FFFDF9' }}>
                        {chartData ? (
                            <Box sx={{ mt: 1 }}>
                                <RasiChart chartData={chartData} />
                                <Box sx={{ mt: 2 }}>
                                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #FFCC80', borderRadius: '10px' }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: 'rgba(255, 111, 0, 0.1)' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00' }}>அம்சம் (Factor)</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00' }}>ராசி / நட்சத்திரம்</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#FF6F00' }}>அதிபதி (Lord)</TableCell>
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
                                {chartData.moonNakshatra && renderRawDataTable("Moon Nakshatra Details", chartData.moonNakshatra)}
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Chart for {matchDetails.date} at {matchDetails.time} | {matchDetails.location}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Floating Action Button for Lagna Transit (Always available in sidebar) */}
                <Tooltip title="போட்டி ராசி & லக்ன ட்ரான்சிஸ்ட் அட்டவணையைத் திறக்க அழுத்தவும் (View Lagna Transit Timeline)" arrow placement="left">
                    <Fab
                        variant="extended"
                        onClick={handleOpenLagnaModal}
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            zIndex: 1350,
                            background: 'linear-gradient(135deg, #FF6F00 0%, #E65100 100%)',
                            color: '#fff',
                            fontWeight: '900',
                            fontSize: '0.82rem',
                            boxShadow: '0 6px 20px rgba(230, 81, 0, 0.45)',
                            textTransform: 'none',
                            gap: 0.8,
                            px: 2,
                            py: 0.8,
                            border: '2px solid rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(6px)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #E65100 0%, #D84315 100%)',
                                boxShadow: '0 8px 26px rgba(216, 67, 21, 0.6)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.25s ease'
                        }}
                    >
                        {lagnaLoading ? (
                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                        ) : (
                            <span style={{ fontSize: '1.2rem' }}>🪐</span>
                        )}
                        <span>போட்டி ராசி & லக்ன ட்ரான்சிஸ்ட்</span>
                    </Fab>
                </Tooltip>

                {/* Lagna Transit Modal Dialog */}
                <Dialog
                    open={lagnaModalOpen}
                    onClose={() => setLagnaModalOpen(false)}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
                            bgcolor: '#FFFDF9'
                        }
                    }}
                >
                    <DialogTitle
                        component="div"
                        sx={{
                            m: 0,
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #1A1F38 0%, #2A3358 100%)',
                            color: 'white',
                            borderBottom: '3px solid #FF6F00'
                        }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>🪐</span> போட்டி ராசி & லக்ன ட்ரான்சிஸ்ட் அட்டவணை
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#FFE082', fontSize: '0.78rem' }}>
                                📅 {matchDetails.date} • 🇮🇳 {matchDetails.istTime || convertLocalToIst(matchDetails.time, matchDetails.timezone)} IST 
                                {matchDetails.timezone !== 5.5 ? ` | 📍 ${matchDetails.time} Local (TZ ${matchDetails.timezone >= 0 ? '+' + matchDetails.timezone : matchDetails.timezone})` : ''} 
                                {matchDetails.location ? ` • 📍 ${matchDetails.location}` : ''}
                            </Typography>
                        </Box>
                        <IconButton
                            aria-label="close"
                            onClick={() => setLagnaModalOpen(false)}
                            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: '#FFFDF9' }}>
                        {(matchChartResult || chartData) ? (
                            renderLagnaTransitContent(matchChartResult || chartData)
                        ) : (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <CircularProgress sx={{ color: '#FF6F00' }} />
                                <Typography sx={{ mt: 1, color: '#666' }}>லக்ன ட்ரான்சிஸ்ட் விபரம் ஏற்றப்படுகிறது...</Typography>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        );
    }

    return (
        <>
            <Paper elevation={0} sx={{ p: 0, mb: { xs: 1, sm: 2 }, overflow: 'hidden', borderRadius: { xs: '10px', sm: '14px' }, border: 'none', bgcolor: 'transparent' }}>
                {/* When rightSlot is provided, display side-by-side in 2 columns */}
                {rightSlot ? (
                    <Grid container spacing={1.5} alignItems="stretch">
                        <Grid item xs={12} md={7} lg={7.5}>
                            {matchFormBox}
                        </Grid>
                        <Grid item xs={12} md={5} lg={4.5}>
                            {rightSlot}
                        </Grid>
                    </Grid>
                ) : (
                    matchFormBox
                )}

                {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px' }}>{error}</Alert>}

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
                                📊 போட்டி ராசி விவரம்
                            </Typography>
                            <IconButton size="small" sx={{ p: 0.5, color: '#FF6F00' }}>
                                {chartExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={chartExpanded}>
                            {renderLagnaTransitContent(matchChartResult)}
                        </Collapse>
                    </Box>
                )}

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

            {/* Floating Action Button for Lagna Transit */}
            <Tooltip title="போட்டி ராசி & லக்ன ட்ரான்சிஸ்ட் அட்டவணையைத் திறக்க அழுத்தவும் (View Lagna Transit Timeline)" arrow placement="left">
                <Fab
                    variant="extended"
                    onClick={handleOpenLagnaModal}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1350,
                        background: 'linear-gradient(135deg, #FF6F00 0%, #E65100 100%)',
                        color: '#fff',
                        fontWeight: '900',
                        fontSize: '0.82rem',
                        boxShadow: '0 6px 20px rgba(230, 81, 0, 0.45)',
                        textTransform: 'none',
                        gap: 0.8,
                        px: 2,
                        py: 0.8,
                        border: '2px solid rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(6px)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #E65100 0%, #D84315 100%)',
                            boxShadow: '0 8px 26px rgba(216, 67, 21, 0.6)',
                            transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.25s ease'
                    }}
                >
                    {lagnaLoading ? (
                        <CircularProgress size={18} sx={{ color: '#fff' }} />
                    ) : (
                        <span style={{ fontSize: '1.2rem' }}>🪐</span>
                    )}
                    <span>போட்டி ராசி & லக்ன ட்ரான்சிஸ்ட்</span>
                </Fab>
            </Tooltip>

            {/* Lagna Transit Modal Dialog */}
            <Dialog
                open={lagnaModalOpen}
                onClose={() => setLagnaModalOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
                        bgcolor: '#FFFDF9'
                    }
                }}
            >
                <DialogTitle
                    component="div"
                    sx={{
                        m: 0,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #1A1F38 0%, #2A3358 100%)',
                        color: 'white',
                        borderBottom: '3px solid #FF6F00'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>🪐</span> போட்டி ராசி & லக்ன ட்ரான்சிஸ்ட் அட்டவணை
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#FFE082', fontSize: '0.78rem' }}>
                            📅 {matchDetails.date} • 🇮🇳 {matchDetails.istTime || convertLocalToIst(matchDetails.time, matchDetails.timezone)} IST 
                            {matchDetails.timezone !== 5.5 ? ` | 📍 ${matchDetails.time} Local (TZ ${matchDetails.timezone >= 0 ? '+' + matchDetails.timezone : matchDetails.timezone})` : ''} 
                            {matchDetails.location ? ` • 📍 ${matchDetails.location}` : ''}
                        </Typography>
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={() => setLagnaModalOpen(false)}
                        sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: '#FFFDF9' }}>
                    {(matchChartResult || chartData) ? (
                        renderLagnaTransitContent(matchChartResult || chartData)
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CircularProgress sx={{ color: '#FF6F00' }} />
                            <Typography sx={{ mt: 1, color: '#666' }}>லக்ன ட்ரான்சிஸ்ட் விபரம் ஏற்றப்படுகிறது...</Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
});

// Helper to get Star Lord (copied from predictionRules/adapter to avoid circular dep issues quickly)
const getNakshatraLordHelper = (starName) => {
    if (!starName) return null;
    try {
        const fromRasi = getNakLordFromRasiChart(starName);
        if (fromRasi && fromRasi !== '-') return fromRasi;
    } catch (e) {
        // fallback
    }
    const n = String(starName).toLowerCase();
    
    // Ketu: Ashwini, Magha, Mula
    if (['ashwini', 'aswini', 'magha', 'magam', 'makam', 'mula', 'moola', 'moolam', 'அசுவினி', 'அஸ்வினி', 'மகம்', 'மூலம்'].some(s => n.includes(s))) return 'Ketu';
    
    // Venus: Bharani, Purva Phalguni, Purva Ashadha
    if (['bharani', 'purva phalguni', 'purvaphalguni', 'pooram', 'purva ashadha', 'purvashada', 'pooradam', 'பரணி', 'பூரம்', 'பூராடம்'].some(s => n.includes(s))) return 'Venus';
    
    // Sun: Krittika, Uttara Phalguni, Uttara Ashadha
    if (['krittika', 'karthigai', 'uttara phalguni', 'uttaraphalguni', 'uthiram', 'uttara ashadha', 'uttarashada', 'uthiradam', 'கார்த்திகை', 'உத்திரம்', 'உத்திராடம்'].some(s => n.includes(s))) return 'Sun';
    
    // Moon: Rohini, Hasta, Shravana
    if (['rohini', 'hasta', 'hastham', 'shravana', 'thiruvonam', 'ரோகிணி', 'ஹஸ்தம்', 'அஸ்தம்', 'திருவோணம்'].some(s => n.includes(s))) return 'Moon';
    
    // Mars: Mrigashira, Chitra, Dhanishta
    if (['mrigashira', 'mrigashirsha', 'mrigasirisa', 'mrigasirisha', 'mirugasirisha', 'mirugasirish', 'mrigasirisam', 'chitra', 'chithirai', 'dhanishta', 'avittam', 'மிருகசீரிஷம்', 'மிருகசீரிடம்', 'சித்திரை', 'அவிட்டம்'].some(s => n.includes(s))) return 'Mars';
    
    // Rahu: Ardra, Swati, Shatabhisha
    if (['ardra', 'thiruvadhirai', 'swati', 'swathi', 'shatabhisha', 'sadhayam', 'sathayam', 'திருவாதிரை', 'சுவாதி', 'சதயம்'].some(s => n.includes(s))) return 'Rahu';
    
    // Jupiter: Punarvasu, Vishakha, Purva Bhadrapada
    if (['punarvasu', 'punarpusam', 'vishakha', 'visakam', 'purva bhadrapada', 'purvabhadra', 'poorattathi', 'புனர்பூசம்', 'விசாகம்', 'பூரட்டாதி'].some(s => n.includes(s))) return 'Jupiter';
    
    // Saturn: Pushya, Anuradha, Uttara Bhadrapada
    if (['pushya', 'poosam', 'anuradha', 'anusham', 'uttara bhadrapada', 'uttarabhadra', 'uthirattathi', 'பூசம்', 'அனுஷம்', 'உத்திரட்டாதி'].some(s => n.includes(s))) return 'Saturn';
    
    // Mercury: Ashlesha, Jyeshtha, Revati
    if (['ashlesha', 'ayilyam', 'jyeshtha', 'kettai', 'revati', 'ஆயில்யம்', 'கேட்டை', 'ரேவதி'].some(s => n.includes(s))) return 'Mercury';
    
    return null;
};

export default MatchPredictionControl;
