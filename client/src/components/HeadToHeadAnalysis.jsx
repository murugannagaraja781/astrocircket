import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Chip,
    Avatar,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlashOnIcon from '@mui/icons-material/FlashOn';

import { runPrediction } from '../utils/predictionAdapter';
import { getActiveLagnaSlot, formatTimeOffset, isBatEligible, isBowlEligible } from '../utils/timelineEngine';
import { tamilSigns, signLords, signLordsTamil, nakshatraTamilMap, getSignId, getNakshatraLordHelper } from './RasiChart';

// VisionPro Theme Colors
const themeColors = {
    primary: '#FF6F00',
    primaryGradient: 'linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%)',
    strikerGreen: '#059669',
    strikerBg: '#ECFDF5',
    strikerBorder: '#A7F3D0',
    nonStrikerBlue: '#2563EB',
    nonStrikerBg: '#EFF6FF',
    nonStrikerBorder: '#BFDBFE',
    bowlerPurple: '#7C3AED',
    bowlerBg: '#F5F3FF',
    bowlerBorder: '#DDD6FE',
    cardBorder: 'rgba(0,0,0,0.08)'
};

const HeadToHeadAnalysis = ({
    teamAPlayers = [],
    teamBPlayers = [],
    teamAName = 'Team A',
    teamBName = 'Team B',
    matchChart = null,
    timelineData = null,
    batFirstTeam = 'teamA',
    matchStartTime = '19:30'
}) => {
    // Determine batting & bowling teams based on toss/innings
    const isTeamABatting = batFirstTeam === 'teamA';
    const battingTeamPlayers = isTeamABatting ? teamAPlayers : teamBPlayers;
    const bowlingTeamPlayers = isTeamABatting ? teamBPlayers : teamAPlayers;
    const battingTeamName = isTeamABatting ? teamAName : teamBName;
    const bowlingTeamName = isTeamABatting ? teamBName : teamAName;

    // Filter eligible players
    const eligibleBatsmen = useMemo(() => {
        return battingTeamPlayers.filter(p => isBatEligible(p.role));
    }, [battingTeamPlayers]);

    const eligibleBowlers = useMemo(() => {
        return bowlingTeamPlayers.filter(p => isBowlEligible(p.role));
    }, [bowlingTeamPlayers]);

    // Selection States
    const [strikerId, setStrikerId] = useState('');
    const [nonStrikerId, setNonStrikerId] = useState('');
    const [bowlerId, setBowlerId] = useState('');

    // Set Default Selections on mount / team change
    useEffect(() => {
        if (eligibleBatsmen.length > 0) {
            setStrikerId(eligibleBatsmen[0]?.id || '');
            if (eligibleBatsmen.length > 1) {
                setNonStrikerId(eligibleBatsmen[1]?.id || '');
            } else {
                setNonStrikerId(eligibleBatsmen[0]?.id || '');
            }
        }
        if (eligibleBowlers.length > 0) {
            setBowlerId(eligibleBowlers[0]?.id || '');
        }
    }, [eligibleBatsmen, eligibleBowlers]);

    // Timeline Offset in minutes (0 to 240 mins)
    const [timeOffsetMinutes, setTimeOffsetMinutes] = useState(0);

    // Swap Striker and Non-Striker
    const handleSwapBatsmen = () => {
        const temp = strikerId;
        setStrikerId(nonStrikerId);
        setNonStrikerId(temp);
    };

    // Get Active Transit for the selected timeline minute
    const activeTransitSlot = useMemo(() => {
        if (!matchChart) return null;
        const root = matchChart.data || matchChart;
        const timeline = root.lagnaTimeline || [];
        return getActiveLagnaSlot(timeline, timeOffsetMinutes);
    }, [matchChart, timeOffsetMinutes]);

    // Create transit chart for real-time slot evaluation
    const slotTransitChart = useMemo(() => {
        if (!matchChart || !activeTransitSlot) return null;
        const root = matchChart.data || matchChart;
        return {
            ...root,
            ascendant: {
                sign: { name: activeTransitSlot.lagna, lord: activeTransitSlot.lord },
                nakshatra: { name: activeTransitSlot.nakshatra, lord: activeTransitSlot.nakshatraLord }
            },
            ascendantSign: activeTransitSlot.lagna,
            ascendantLord: activeTransitSlot.lord,
            battingLagnaSign: activeTransitSlot.lagna,
            battingLagnaLord: activeTransitSlot.lord,
            bowlingLagnaSign: activeTransitSlot.lagna,
            bowlingLagnaLord: activeTransitSlot.lord,
            moonNakshatra: { name: activeTransitSlot.nakshatra, lord: activeTransitSlot.nakshatraLord },
            moonNakshatraLord: activeTransitSlot.nakshatraLord,
            planets: root.planets || {}
        };
    }, [matchChart, activeTransitSlot]);

    // Find Selected Player Objects
    const striker = useMemo(() => battingTeamPlayers.find(p => p.id === strikerId), [battingTeamPlayers, strikerId]);
    const nonStriker = useMemo(() => battingTeamPlayers.find(p => p.id === nonStrikerId), [battingTeamPlayers, nonStrikerId]);
    const bowler = useMemo(() => bowlingTeamPlayers.find(p => p.id === bowlerId), [bowlingTeamPlayers, bowlerId]);

    // Compute Live Predictions for the 3 players at this exact slot
    const strikerPred = useMemo(() => {
        if (!striker || !slotTransitChart) return null;
        return runPrediction(striker.birthChart || striker, slotTransitChart, "BAT");
    }, [striker, slotTransitChart]);

    const nonStrikerPred = useMemo(() => {
        if (!nonStriker || !slotTransitChart) return null;
        return runPrediction(nonStriker.birthChart || nonStriker, slotTransitChart, "BAT");
    }, [nonStriker, slotTransitChart]);

    const bowlerPred = useMemo(() => {
        if (!bowler || !slotTransitChart) return null;
        return runPrediction(bowler.birthChart || bowler, slotTransitChart, "BOWL");
    }, [bowler, slotTransitChart]);

    // Helper to get player Rasi & Nakshatra in Tamil
    const getPlayerAstroDetails = (player) => {
        if (!player) return { rasi: '-', rasiLord: '-', nak: '-', nakLord: '-' };
        const chart = player.birthChart?.data || player.birthChart || player;
        const moonObj = chart.moonSign || chart.planets?.Moon || {};
        const sId = getSignId(moonObj.name || moonObj.sign || moonObj.signTamil || moonObj.longitude);
        const rasi = moonObj.tamil || moonObj.signTamil || (sId ? tamilSigns[sId] : '-');
        const rasiLord = moonObj.lordTamil || (sId ? signLordsTamil[signLords[sId]] : '-');

        const nakObj = chart.nakshatra || chart.moonNakshatra || chart.planets?.Moon?.nakshatra || {};
        const nakName = typeof nakObj === 'string' ? nakObj : (nakObj.name || nakObj.tamil || chart.planets?.Moon?.nakshatraTamil || '');
        const nak = nakshatraTamilMap[nakName] || nakName || '-';
        const nakLord = nakObj.lordTamil || (nakName ? signLordsTamil[getNakshatraLordHelper(nakName)] : '-');

        return { rasi, rasiLord, nak, nakLord };
    };

    const strikerAstro = getPlayerAstroDetails(striker);
    const nonStrikerAstro = getPlayerAstroDetails(nonStriker);
    const bowlerAstro = getPlayerAstroDetails(bowler);

    // Scores
    const strikerScore = strikerPred?.score ?? 0;
    const nonStrikerScore = nonStrikerPred?.score ?? 0;
    const bowlerScore = bowlerPred?.score ?? 0;

    // Head-to-Head Verdict & Tactical Advice
    const getMatchupVerdict = (batScore, bowlScore, batName, bowlName) => {
        const diff = batScore - bowlScore;
        if (diff >= 4) {
            return {
                title: '🟢 ஸ்ட்ரைக்கர் ஆதிக்கம் (Striker High Advantage)',
                color: '#059669',
                bg: '#ECFDF5',
                border: '#A7F3D0',
                desc: `${batName || 'பேட்ஸ்மேனுக்கு'} சாதகமான கிரக நிலை! பவுண்டரிகள் அடிக்க மற்றும் அதிக ரன் குவிக்க நல்ல வாய்ப்பு உள்ளது.`,
                tip: 'அதிரடி ஆட்டம் (Aggressive Batting Recommended)'
            };
        } else if (diff <= -4) {
            return {
                title: '🔴 விக்கெட் ஆபத்து (High Dismissal Risk)',
                color: '#DC2626',
                bg: '#FEF2F2',
                border: '#FECACA',
                desc: `${bowlName || 'பவுலருக்கு'} உச்ச புள்ளிகள்! ${batName || 'பேட்ஸ்மேன்'} கவனமாக விளையாட வேண்டும், விக்கெட் விழும் வாய்ப்பு அதிகம்!`,
                tip: 'தற்காப்பு ஆட்டம் & ஸ்ட்ரைக் ரொட்டேஷன் (Caution Required)'
            };
        } else {
            return {
                title: '🟡 சமபல போட்டி (Even Contest / 50-50)',
                color: '#D97706',
                bg: '#FFFBEB',
                border: '#FDE68A',
                desc: `இருவருக்கும் சமமான கிரக பலம். டாட் பால்கள் மற்றும் ஸ்ட்ரைக் ரொட்டேஷன் எதிர்பார்க்கலாம்.`,
                tip: 'சமபல மோதல் (Balanced Contest)'
            };
        }
    };

    const strikerVerdict = getMatchupVerdict(strikerScore, bowlerScore, striker?.name, bowler?.name);
    const nonStrikerVerdict = getMatchupVerdict(nonStrikerScore, bowlerScore, nonStriker?.name, bowler?.name);

    // Power Share percentages for visual bar
    const calculatePowerShare = (score1, score2) => {
        const s1 = Math.max(0, score1 + 10);
        const s2 = Math.max(0, score2 + 10);
        const total = s1 + s2;
        if (total === 0) return { p1: 50, p2: 50 };
        return {
            p1: Math.round((s1 / total) * 100),
            p2: Math.round((s2 / total) * 100)
        };
    };

    const strikerPower = calculatePowerShare(strikerScore, bowlerScore);

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#FAFBFD', minHeight: '100%' }}>
            {/* Header: Title & Time Controller */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#FF6F00', width: 44, height: 44 }}>
                            <FlashOnIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1E293B', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                ⚔️ Head to Head (2 பேட்ஸ்மேன் vs 1 பவுலர்)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {battingTeamName} (Batting) vs {bowlingTeamName} (Bowling) | நேரடி மோதல் பகுப்பாய்வு
                            </Typography>
                        </Box>
                    </Box>

                    {/* Quick Phase Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            size="small"
                            variant={timeOffsetMinutes === 0 ? "contained" : "outlined"}
                            onClick={() => setTimeOffsetMinutes(0)}
                            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', bgcolor: timeOffsetMinutes === 0 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 0 ? '#fff' : '#FF6F00' }}
                        >
                            ⚡ ஓவர் 1 (0m)
                        </Button>
                        <Button
                            size="small"
                            variant={timeOffsetMinutes === 25 ? "contained" : "outlined"}
                            onClick={() => setTimeOffsetMinutes(25)}
                            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', bgcolor: timeOffsetMinutes === 25 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 25 ? '#fff' : '#FF6F00' }}
                        >
                            🛡️ பவர்பிளே ஓவர் 6 (25m)
                        </Button>
                        <Button
                            size="small"
                            variant={timeOffsetMinutes === 60 ? "contained" : "outlined"}
                            onClick={() => setTimeOffsetMinutes(60)}
                            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', bgcolor: timeOffsetMinutes === 60 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 60 ? '#fff' : '#FF6F00' }}
                        >
                            🎯 மிடில் ஓவர் 14 (60m)
                        </Button>
                        <Button
                            size="small"
                            variant={timeOffsetMinutes === 85 ? "contained" : "outlined"}
                            onClick={() => setTimeOffsetMinutes(85)}
                            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', bgcolor: timeOffsetMinutes === 85 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 85 ? '#fff' : '#FF6F00' }}
                        >
                            🔥 டெத் ஓவர் 19 (85m)
                        </Button>
                    </Box>
                </Box>

                {/* Timeline Slider & Active Transit Slot */}
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ color: '#FF6F00', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight="700" color="#1E293B">
                                மேட்ச் நேரம்: {formatTimeOffset(matchStartTime, timeOffsetMinutes)} ({timeOffsetMinutes} நிமிடம்)
                            </Typography>
                        </Box>
                        {activeTransitSlot && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`லக்னம்: ${activeTransitSlot.lagna} (${signLordsTamil[activeTransitSlot.lord] || activeTransitSlot.lord})`}
                                    size="small"
                                    sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 'bold', fontSize: '0.72rem' }}
                                />
                                <Chip
                                    label={`நட்சத்திரம்: ${nakshatraTamilMap[activeTransitSlot.nakshatra] || activeTransitSlot.nakshatra} (${signLordsTamil[activeTransitSlot.nakshatraLord] || activeTransitSlot.nakshatraLord})`}
                                    size="small"
                                    sx={{ bgcolor: '#E0E7FF', color: '#3730A3', fontWeight: 'bold', fontSize: '0.72rem' }}
                                />
                            </Box>
                        )}
                    </Box>
                    <Slider
                        value={timeOffsetMinutes}
                        min={0}
                        max={120}
                        step={5}
                        onChange={(e, val) => setTimeOffsetMinutes(val)}
                        sx={{
                            color: '#FF6F00',
                            '& .MuiSlider-thumb': {
                                width: 16,
                                height: 16,
                                bgcolor: '#FF6F00',
                                '&:hover, &.Mui-focusVisible': {
                                    boxShadow: '0 0 0 8px rgba(255, 111, 0, 0.16)'
                                }
                            },
                            '& .MuiSlider-rail': { bgcolor: '#CBD5E1' }
                        }}
                    />
                </Box>
            </Paper>

            {/* 3-Card Player Selector: Striker + Non-Striker + Bowler */}
            <Grid container spacing={2}>
                {/* 1. Striker Batsman */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: themeColors.strikerBg,
                            border: `2px solid ${themeColors.strikerBorder}`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SportsCricketIcon sx={{ color: themeColors.strikerGreen }} />
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.strikerGreen }}>
                                    🏏 ஸ்ட்ரைக்கர் (Striker)
                                </Typography>
                            </Box>
                            <Chip
                                label={`புள்ளிகள்: B:${strikerScore}`}
                                size="small"
                                sx={{
                                    bgcolor: strikerScore >= 2 ? '#059669' : strikerScore >= 1 ? '#10B981' : '#6B7280',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>

                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: '8px' }}>
                            <InputLabel>ஸ்ட்ரைக்கரைத் தேர்ந்தெடு</InputLabel>
                            <Select
                                value={strikerId}
                                label="ஸ்ட்ரைக்கரைத் தேர்ந்தெடு"
                                onChange={(e) => setStrikerId(e.target.value)}
                            >
                                {eligibleBatsmen.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name} ({p.role || 'BAT'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {striker && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, p: 1.2, bgcolor: 'white', borderRadius: '10px', border: '1px solid #D1FAE5' }}>
                                <Typography variant="body2" fontWeight="bold" color="#1E293B">
                                    {striker.name}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#4B5563' }}>ராசி: <b>{strikerAstro.rasi}</b></span>
                                    <span style={{ color: '#047857', fontWeight: 'bold' }}>அதிபதி: {strikerAstro.rasiLord}</span>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#4B5563' }}>நட்சத்திரம்: <b>{strikerAstro.nak}</b></span>
                                    <span style={{ color: '#1D4ED8', fontWeight: 'bold' }}>அதிபதி: {strikerAstro.nakLord}</span>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* 2. Non-Striker Batsman */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: themeColors.nonStrikerBg,
                            border: `2px solid ${themeColors.nonStrikerBorder}`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            position: 'relative'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.nonStrikerBlue }}>
                                    🏃 நான்-ஸ்ட்ரைக்கர் (Non-Striker)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title="Swap Striker & Non-Striker">
                                    <IconButton
                                        size="small"
                                        onClick={handleSwapBatsmen}
                                        sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', '&:hover': { bgcolor: '#BFDBFE' } }}
                                    >
                                        <SwapHorizIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Chip
                                    label={`புள்ளிகள்: B:${nonStrikerScore}`}
                                    size="small"
                                    sx={{
                                        bgcolor: nonStrikerScore >= 2 ? '#2563EB' : nonStrikerScore >= 1 ? '#3B82F6' : '#6B7280',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </Box>
                        </Box>

                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: '8px' }}>
                            <InputLabel>நான்-ஸ்ட்ரைக்கரைத் தேர்ந்தெடு</InputLabel>
                            <Select
                                value={nonStrikerId}
                                label="நான்-ஸ்ட்ரைக்கரைத் தேர்ந்தெடு"
                                onChange={(e) => setNonStrikerId(e.target.value)}
                            >
                                {eligibleBatsmen.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name} ({p.role || 'BAT'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {nonStriker && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, p: 1.2, bgcolor: 'white', borderRadius: '10px', border: '1px solid #DBEAFE' }}>
                                <Typography variant="body2" fontWeight="bold" color="#1E293B">
                                    {nonStriker.name}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#4B5563' }}>ராசி: <b>{nonStrikerAstro.rasi}</b></span>
                                    <span style={{ color: '#047857', fontWeight: 'bold' }}>அதிபதி: {nonStrikerAstro.rasiLord}</span>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#4B5563' }}>நட்சத்திரம்: <b>{nonStrikerAstro.nak}</b></span>
                                    <span style={{ color: '#1D4ED8', fontWeight: 'bold' }}>அதிபதி: {nonStrikerAstro.nakLord}</span>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* 3. Bowler */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: themeColors.bowlerBg,
                            border: `2px solid ${themeColors.bowlerBorder}`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: themeColors.bowlerPurple }}>
                                    🥎 பந்துவீச்சாளர் (Active Bowler)
                                </Typography>
                            </Box>
                            <Chip
                                label={`புள்ளிகள்: Bo:${bowlerScore}`}
                                size="small"
                                sx={{
                                    bgcolor: bowlerScore >= 2 ? '#7C3AED' : bowlerScore >= 1 ? '#8B5CF6' : '#6B7280',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>

                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: '8px' }}>
                            <InputLabel>பவுலரைத் தேர்ந்தெடு</InputLabel>
                            <Select
                                value={bowlerId}
                                label="பவுலரைத் தேர்ந்தெடு"
                                onChange={(e) => setBowlerId(e.target.value)}
                            >
                                {eligibleBowlers.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name} ({p.role || 'BOWL'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {bowler && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, p: 1.2, bgcolor: 'white', borderRadius: '10px', border: '1px solid #EDE9FE' }}>
                                <Typography variant="body2" fontWeight="bold" color="#1E293B">
                                    {bowler.name}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#4B5563' }}>ராசி: <b>{bowlerAstro.rasi}</b></span>
                                    <span style={{ color: '#047857', fontWeight: 'bold' }}>அதிபதி: {bowlerAstro.rasiLord}</span>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                    <span style={{ color: '#4B5563' }}>நட்சத்திரம்: <b>{bowlerAstro.nak}</b></span>
                                    <span style={{ color: '#1D4ED8', fontWeight: 'bold' }}>அதிபதி: {bowlerAstro.nakLord}</span>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Direct Clash Analysis: Striker vs Bowler */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1E293B', mb: 2 }}>
                    🔥 நேரடி மோதல் பகுப்பாய்வு: {striker?.name || 'ஸ்ட்ரைக்கர்'} vs {bowler?.name || 'பவுலர்'}
                </Typography>

                {/* Comparative Power Bar */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight="700" sx={{ color: themeColors.strikerGreen }}>
                            🏏 {striker?.name || 'ஸ்ட்ரைக்கர்'}: {strikerPower.p1}% பேட்டிங் பலம் (B:{strikerScore})
                        </Typography>
                        <Typography variant="body2" fontWeight="700" sx={{ color: themeColors.bowlerPurple }}>
                            🥎 {bowler?.name || 'பவுலர்'}: {strikerPower.p2}% பவுலிங் பலம் (Bo:{bowlerScore})
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 12, bgcolor: '#EDE9FE', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                        <Box sx={{ width: `${strikerPower.p1}%`, bgcolor: '#10B981', transition: 'width 0.4s ease' }} />
                        <Box sx={{ width: `${strikerPower.p2}%`, bgcolor: '#8B5CF6', transition: 'width 0.4s ease' }} />
                    </Box>
                </Box>

                {/* Verdict Card */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: strikerVerdict.bg, border: `1.5px solid ${strikerVerdict.border}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: strikerVerdict.color }}>
                            {strikerVerdict.title}
                        </Typography>
                        <Chip label={strikerVerdict.tip} size="small" sx={{ bgcolor: strikerVerdict.color, color: 'white', fontWeight: 'bold', fontSize: '0.72rem' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.85rem' }}>
                        {strikerVerdict.desc}
                    </Typography>
                </Box>
            </Paper>

            {/* Non-Striker & Rotation Analysis */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff', height: '100%' }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1E293B', mb: 1 }}>
                            🔄 ஸ்ட்ரைக் சுழற்சி (Non-Striker on Strike): {nonStriker?.name} vs {bowler?.name}
                        </Typography>
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: nonStrikerVerdict.bg, border: `1px solid ${nonStrikerVerdict.border}` }}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: nonStrikerVerdict.color, display: 'block', mb: 0.5 }}>
                                {nonStrikerVerdict.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#4B5563', fontSize: '0.8rem' }}>
                                {nonStrikerVerdict.desc}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff', height: '100%' }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1E293B', mb: 1 }}>
                            📋 ஜோதிடப் பொருத்தம் (Astrological Synergy Summary)
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, fontSize: '0.8rem' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.8, bgcolor: '#F8FAFC', borderRadius: '6px' }}>
                                <span>ஸ்ட்ரைக்கர் ராசி அதிபதி:</span>
                                <strong style={{ color: '#047857' }}>{strikerAstro.rasiLord}</strong>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.8, bgcolor: '#F8FAFC', borderRadius: '6px' }}>
                                <span>நான்-ஸ்ட்ரைக்கர் ராசி அதிபதி:</span>
                                <strong style={{ color: '#1D4ED8' }}>{nonStrikerAstro.rasiLord}</strong>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.8, bgcolor: '#F8FAFC', borderRadius: '6px' }}>
                                <span>பவுலர் ராசி அதிபதி:</span>
                                <strong style={{ color: '#7C3AED' }}>{bowlerAstro.rasiLord}</strong>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HeadToHeadAnalysis;
