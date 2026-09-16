import React, { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
    Tooltip,
    Switch,
    FormControlLabel
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { runPrediction } from '../utils/predictionAdapter';
import { getActiveLagnaSlot, formatTimeOffset, isBatEligible, isBowlEligible } from '../utils/timelineEngine';
import {
    setStriker,
    setNonStriker,
    setBowler,
    swapBatsmen,
    setDualBatsmanMode,
    setTimeOffsetMinutes
} from '../redux/slices/h2hSlice';

const themeColors = {
    primary: '#FF6F00',
    primaryGradient: 'linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%)',
    strikerGreen: '#059669',
    strikerBg: '#F0FDF4',
    strikerBorder: '#86EFAC',
    nonStrikerBlue: '#2563EB',
    nonStrikerBg: '#EFF6FF',
    nonStrikerBorder: '#93C5FD',
    bowlerPurple: '#7C3AED',
    bowlerBg: '#F5F3FF',
    bowlerBorder: '#C4B5FD',
    cardBorder: 'rgba(0,0,0,0.08)'
};

const ClientHeadToHead = ({
    teamAPlayers = [],
    teamBPlayers = [],
    teamAName = 'Team A',
    teamBName = 'Team B',
    matchChart = null,
    batFirstTeam = 'teamA',
    matchStartTime = '19:30',
    matchDate = '',
    venueName = ''
}) => {
    const dispatch = useDispatch();

    const h2hState = useSelector((state) => state.h2h || {});
    const {
        strikerId = '',
        nonStrikerId = '',
        bowlerId = '',
        isDualBatsmanMode = true,
        timeOffsetMinutes = 0
    } = h2hState;

    // Determine batting & bowling teams
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

    // Set Default Selections
    useEffect(() => {
        if (eligibleBatsmen.length > 0 && !strikerId) {
            dispatch(setStriker(eligibleBatsmen[0]?.id || eligibleBatsmen[0]?._id || ''));
            if (eligibleBatsmen.length > 1) {
                dispatch(setNonStriker(eligibleBatsmen[1]?.id || eligibleBatsmen[1]?._id || ''));
            } else {
                dispatch(setNonStriker(eligibleBatsmen[0]?.id || eligibleBatsmen[0]?._id || ''));
            }
        }
        if (eligibleBowlers.length > 0 && !bowlerId) {
            dispatch(setBowler(eligibleBowlers[0]?.id || eligibleBowlers[0]?._id || ''));
        }
    }, [eligibleBatsmen, eligibleBowlers, strikerId, bowlerId, dispatch]);

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
    const striker = useMemo(() => {
        return battingTeamPlayers.find(p => (p.id || p._id) === strikerId);
    }, [battingTeamPlayers, strikerId]);

    const nonStriker = useMemo(() => {
        return battingTeamPlayers.find(p => (p.id || p._id) === nonStrikerId);
    }, [battingTeamPlayers, nonStrikerId]);

    const bowler = useMemo(() => {
        return bowlingTeamPlayers.find(p => (p.id || p._id) === bowlerId);
    }, [bowlingTeamPlayers, bowlerId]);

    // Compute Live Predictions
    const strikerPred = useMemo(() => {
        if (!striker || !slotTransitChart) return null;
        const chartData = striker.birthChart?.data || striker.birthChart || striker;
        return runPrediction({ ...chartData, role: striker.role }, slotTransitChart, "BAT");
    }, [striker, slotTransitChart]);

    const nonStrikerPred = useMemo(() => {
        if (!nonStriker || !slotTransitChart) return null;
        const chartData = nonStriker.birthChart?.data || nonStriker.birthChart || nonStriker;
        return runPrediction({ ...chartData, role: nonStriker.role }, slotTransitChart, "BAT");
    }, [nonStriker, slotTransitChart]);

    const bowlerPred = useMemo(() => {
        if (!bowler || !slotTransitChart) return null;
        const chartData = bowler.birthChart?.data || bowler.birthChart || bowler;
        return runPrediction({ ...chartData, role: bowler.role }, slotTransitChart, "BOWL");
    }, [bowler, slotTransitChart]);

    const strikerScore = strikerPred?.score ?? 0;
    const nonStrikerScore = nonStrikerPred?.score ?? 0;
    const bowlerScore = bowlerPred?.score ?? 0;

    // Client Verdict logic (Pure cricket performance, no astro rules revealed)
    const getClientMatchupVerdict = (batScore, bowlScore, batName, bowlName) => {
        const diff = batScore - bowlScore;
        if (diff >= 4) {
            return {
                status: 'BATSMAN_DOMINANCE',
                title: '🟢 பேட்ஸ்மேன் அதிரடி ஆதிக்கம் (Striker High Advantage)',
                color: '#059669',
                bg: '#ECFDF5',
                border: '#A7F3D0',
                badgeText: 'பவுண்டரி வாய்ப்பு அதிகம் (Boundary Alert)',
                icon: <WhatshotIcon sx={{ color: '#059669', fontSize: 24 }} />,
                headline: `${batName || 'பேட்ஸ்மேன்'} சிறந்த ஃபார்மில் ஆதிக்கம் செலுத்துவார்!`,
                details: `${batName || 'பேட்ஸ்மேனுக்கு'} அதிக ரன் குவிக்க மற்றும் பெரிய ஷாட்கள் ஆட மிகச் சிறந்த தருணம். பவுலரின் ஓவரை எளிதாக ஆக்ரோஷமாக எதிர்கொள்வார்.`,
                actionableTip: 'அதிரடி பேட்டிங் பரிந்துரைக்கப்படுகிறது (Aggressive Play)'
            };
        } else if (diff <= -4) {
            return {
                status: 'BOWLER_DOMINANCE',
                title: '🔴 விக்கெட் ஆபத்து (High Dismissal Risk)',
                color: '#DC2626',
                bg: '#FEF2F2',
                border: '#FECACA',
                badgeText: 'விக்கெட் வாய்ப்பு அதிகம் (Wicket Alert)',
                icon: <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 24 }} />,
                headline: `${bowlName || 'பவுலர்'} விக்கெட் வீழ்த்த அதிக வாய்ப்பு!`,
                details: `${bowlName || 'பவுலர்'} இந்த ஓவரில் மிக வலுவான தாக்கத்தை ஏற்படுத்துவார். ${batName || 'பேட்ஸ்மேன்'} தற்காப்புடன் விளையாடி ஸ்ட்ரைக் ரொட்டேட் செய்ய வேண்டும்.`,
                actionableTip: 'தற்காப்பு ஆட்டம் & விக்கெட் பாதுகாப்பு (Defensive / Caution)'
            };
        } else {
            return {
                status: 'EVEN_CONTEST',
                title: '🟡 சமபல மோதல் (Balanced Contest / 50-50)',
                color: '#D97706',
                bg: '#FFFBEB',
                border: '#FDE68A',
                badgeText: 'சமபல போட்டி (Even Battle)',
                icon: <ShieldIcon sx={{ color: '#D97706', fontSize: 24 }} />,
                headline: `இருவருக்கும் சமமான பலம் - திட்டமிட்ட ஆட்டம் தேவை!`,
                details: `இருவருக்கும் இடையே சமமான போட்டி நிலவும். சிங்கிள்கள், டபுள்கள் மற்றும் ஸ்ட்ரைக் சுழற்சி மூலம் ரன் சேர்க்க ஏற்ற நேரம்.`,
                actionableTip: 'ஸ்ட்ரைக் ரொட்டேஷன் & விழிப்புணர்வு (Rotate Strike)'
            };
        }
    };

    const strikerVerdict = getClientMatchupVerdict(strikerScore, bowlerScore, striker?.name, bowler?.name);
    const nonStrikerVerdict = getClientMatchupVerdict(nonStrikerScore, bowlerScore, nonStriker?.name, bowler?.name);

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
        <Box sx={{ p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2.5, bgcolor: '#F8FAFC', minHeight: '100%' }}>
            {/* Header: Title, Mode Switcher & Time Controller */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '18px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#FF6F00', width: 46, height: 46, boxShadow: '0 4px 12px rgba(255,111,0,0.3)' }}>
                            <FlashOnIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#0F172A', fontSize: { xs: '1.1rem', sm: '1.35rem' }, letterSpacing: '-0.3px' }}>
                                ⚔️ Head-to-Head மேட்ச்அப் கணிப்பு
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                {battingTeamName} (பேட்டிங்) vs {bowlingTeamName} (பவுலிங்) {venueName ? `| 📍 ${venueName}` : ''} {matchDate ? `| 📅 ${matchDate}` : ''}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Mode Toggle & Phase Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isDualBatsmanMode}
                                    onChange={(e) => dispatch(setDualBatsmanMode(e.target.checked))}
                                    color="warning"
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="caption" fontWeight="700" color="#334155">
                                    {isDualBatsmanMode ? "2 பேட்ஸ்மேன் மோட்" : "1 பேட்ஸ்மேன் மோட்"}
                                </Typography>
                            }
                        />

                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            <Button
                                size="small"
                                variant={timeOffsetMinutes === 0 ? "contained" : "outlined"}
                                onClick={() => dispatch(setTimeOffsetMinutes(0))}
                                sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, bgcolor: timeOffsetMinutes === 0 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 0 ? '#fff' : '#FF6F00' }}
                            >
                                ⚡ ஓவர் 1 (0m)
                            </Button>
                            <Button
                                size="small"
                                variant={timeOffsetMinutes === 25 ? "contained" : "outlined"}
                                onClick={() => dispatch(setTimeOffsetMinutes(25))}
                                sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, bgcolor: timeOffsetMinutes === 25 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 25 ? '#fff' : '#FF6F00' }}
                            >
                                🛡️ பவர்பிளே 6 (25m)
                            </Button>
                            <Button
                                size="small"
                                variant={timeOffsetMinutes === 60 ? "contained" : "outlined"}
                                onClick={() => dispatch(setTimeOffsetMinutes(60))}
                                sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, bgcolor: timeOffsetMinutes === 60 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 60 ? '#fff' : '#FF6F00' }}
                            >
                                🎯 மிடில் 14 (60m)
                            </Button>
                            <Button
                                size="small"
                                variant={timeOffsetMinutes === 85 ? "contained" : "outlined"}
                                onClick={() => dispatch(setTimeOffsetMinutes(85))}
                                sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, bgcolor: timeOffsetMinutes === 85 ? '#FF6F00' : 'transparent', borderColor: '#FF6F00', color: timeOffsetMinutes === 85 ? '#fff' : '#FF6F00' }}
                            >
                                🔥 டெத் 19 (85m)
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Match Time Slider */}
                <Box sx={{ p: 1.8, bgcolor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ color: '#FF6F00', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight="700" color="#1E293B">
                                ஆட்டத்தின் நேரம்: {formatTimeOffset(matchStartTime, timeOffsetMinutes)} (நிமிடம்: {timeOffsetMinutes})
                            </Typography>
                        </Box>
                        <Chip
                            label={`கட்டம்: ${timeOffsetMinutes <= 25 ? 'பவர்பிளே (Powerplay)' : timeOffsetMinutes <= 70 ? 'மிடில் ஓவர்கள் (Middle Overs)' : 'டெத் ஓவர்கள் (Death Overs)'}`}
                            size="small"
                            sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 'bold', fontSize: '0.75rem' }}
                        />
                    </Box>
                    <Slider
                        value={timeOffsetMinutes}
                        min={0}
                        max={120}
                        step={5}
                        onChange={(e, val) => dispatch(setTimeOffsetMinutes(val))}
                        sx={{
                            color: '#FF6F00',
                            height: 6,
                            '& .MuiSlider-thumb': {
                                width: 18,
                                height: 18,
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

            {/* Players Selection Cards (Striker, Non-Striker, Bowler) */}
            <Grid container spacing={2}>
                {/* 1. Striker Batsman */}
                <Grid size={{ xs: 12, md: isDualBatsmanMode ? 4 : 6 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.2,
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
                                <Typography variant="subtitle2" fontWeight="800" sx={{ color: themeColors.strikerGreen, fontSize: '0.95rem' }}>
                                    🏏 ஸ்ட்ரைக்கர் (Striker)
                                </Typography>
                            </Box>
                            <Chip
                                label={`பேட்டிங் தரம்: ${strikerScore >= 2 ? 'உச்சம் ⭐' : strikerScore >= 0 ? 'நன்று 👍' : 'சராசரி'}`}
                                size="small"
                                sx={{
                                    bgcolor: strikerScore >= 2 ? '#059669' : strikerScore >= 0 ? '#10B981' : '#6B7280',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.72rem'
                                }}
                            />
                        </Box>

                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: '10px' }}>
                            <InputLabel>ஸ்ட்ரைக்கரைத் தேர்ந்தெடு</InputLabel>
                            <Select
                                value={strikerId}
                                label="ஸ்ட்ரைக்கரைத் தேர்ந்தெடு"
                                onChange={(e) => dispatch(setStriker(e.target.value))}
                            >
                                {eligibleBatsmen.map((p) => {
                                    const pId = p.id || p._id;
                                    return (
                                        <MenuItem key={pId} value={pId}>
                                            {p.name} ({p.role || 'BAT'})
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        {striker && (
                            <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: '12px', border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="800" color="#1E293B">
                                        {striker.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {striker.role || 'Top Order Batsman'}
                                    </Typography>
                                </Box>
                                <Chip
                                    label="ஆட்டத்தில் உள்ளவர்"
                                    size="small"
                                    sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 'bold', fontSize: '0.7rem' }}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* 2. Non-Striker Batsman (Shown if dual mode) */}
                {isDualBatsmanMode && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.2,
                                borderRadius: '16px',
                                bgcolor: themeColors.nonStrikerBg,
                                border: `2px solid ${themeColors.nonStrikerBorder}`,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: themeColors.nonStrikerBlue, fontSize: '0.95rem' }}>
                                        🏃 நான்-ஸ்ட்ரைக்கர் (Non-Striker)
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="ஸ்ட்ரைக்கர் & நான்-ஸ்ட்ரைக்கர் மாற்றவும்">
                                        <IconButton
                                            size="small"
                                            onClick={() => dispatch(swapBatsmen())}
                                            sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', '&:hover': { bgcolor: '#BFDBFE' } }}
                                        >
                                            <SwapHorizIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Chip
                                        label={`நிலை: ${nonStrikerScore >= 2 ? 'உச்சம் ⭐' : nonStrikerScore >= 0 ? 'நன்று 👍' : 'சராசரி'}`}
                                        size="small"
                                        sx={{
                                            bgcolor: nonStrikerScore >= 2 ? '#2563EB' : nonStrikerScore >= 0 ? '#3B82F6' : '#6B7280',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.72rem'
                                        }}
                                    />
                                </Box>
                            </Box>

                            <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: '10px' }}>
                                <InputLabel>நான்-ஸ்ட்ரைக்கரைத் தேர்ந்தெடு</InputLabel>
                                <Select
                                    value={nonStrikerId}
                                    label="நான்-ஸ்ட்ரைக்கரைத் தேர்ந்தெடு"
                                    onChange={(e) => dispatch(setNonStriker(e.target.value))}
                                >
                                    {eligibleBatsmen.map((p) => {
                                        const pId = p.id || p._id;
                                        return (
                                            <MenuItem key={pId} value={pId}>
                                                {p.name} ({p.role || 'BAT'})
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>

                            {nonStriker && (
                                <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: '12px', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="800" color="#1E293B">
                                            {nonStriker.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {nonStriker.role || 'Partner Batsman'}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="துணை பேட்ஸ்மேன்"
                                        size="small"
                                        sx={{ bgcolor: '#E0E7FF', color: '#3730A3', fontWeight: 'bold', fontSize: '0.7rem' }}
                                    />
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* 3. Bowler */}
                <Grid size={{ xs: 12, md: isDualBatsmanMode ? 4 : 6 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.2,
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
                                <SportsBaseballIcon sx={{ color: themeColors.bowlerPurple }} />
                                <Typography variant="subtitle2" fontWeight="800" sx={{ color: themeColors.bowlerPurple, fontSize: '0.95rem' }}>
                                    🥎 பந்துவீச்சாளர் (Active Bowler)
                                </Typography>
                            </Box>
                            <Chip
                                label={`பவுலிங் தரம்: ${bowlerScore >= 2 ? 'ஆபத்து 🔥' : bowlerScore >= 0 ? 'நன்று 👍' : 'சராசரி'}`}
                                size="small"
                                sx={{
                                    bgcolor: bowlerScore >= 2 ? '#7C3AED' : bowlerScore >= 0 ? '#8B5CF6' : '#6B7280',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.72rem'
                                }}
                            />
                        </Box>

                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: '10px' }}>
                            <InputLabel>பவுலரைத் தேர்ந்தெடு</InputLabel>
                            <Select
                                value={bowlerId}
                                label="பவுலரைத் தேர்ந்தெடு"
                                onChange={(e) => dispatch(setBowler(e.target.value))}
                            >
                                {eligibleBowlers.map((p) => {
                                    const pId = p.id || p._id;
                                    return (
                                        <MenuItem key={pId} value={pId}>
                                            {p.name} ({p.role || 'BOWL'})
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        {bowler && (
                            <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: '12px', border: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="800" color="#1E293B">
                                        {bowler.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {bowler.role || 'Specialist Bowler'}
                                    </Typography>
                                </Box>
                                <Chip
                                    label="பந்துவீச்சாளர்"
                                    size="small"
                                    sx={{ bgcolor: '#F3E8FF', color: '#6B21A8', fontWeight: 'bold', fontSize: '0.7rem' }}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Direct Clash Analysis: Striker vs Bowler (Main Verdict) */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '18px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#0F172A', fontSize: '1.1rem' }}>
                        🔥 நேரடி மோதல் பலப்பரீட்சை: {striker?.name || 'ஸ்ட்ரைக்கர்'} vs {bowler?.name || 'பவுலர்'}
                    </Typography>
                    <Chip
                        label={strikerVerdict.badgeText}
                        sx={{ bgcolor: strikerVerdict.bg, color: strikerVerdict.color, border: `1px solid ${strikerVerdict.border}`, fontWeight: 'bold' }}
                    />
                </Box>

                {/* Comparative Power Bar */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                        <Typography variant="body2" fontWeight="800" sx={{ color: themeColors.strikerGreen, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            🏏 {striker?.name || 'ஸ்ட்ரைக்கர்'}: <strong>{strikerPower.p1}% பேட்டிங் பலம்</strong>
                        </Typography>
                        <Typography variant="body2" fontWeight="800" sx={{ color: themeColors.bowlerPurple, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            🥎 {bowler?.name || 'பவுலர்'}: <strong>{strikerPower.p2}% பவுலிங் பலம்</strong>
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 16, bgcolor: '#EDE9FE', borderRadius: '8px', overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ width: `${strikerPower.p1}%`, bgcolor: '#10B981', transition: 'width 0.5s ease', backgroundImage: 'linear-gradient(90deg, #059669, #10B981)' }} />
                        <Box sx={{ width: `${strikerPower.p2}%`, bgcolor: '#8B5CF6', transition: 'width 0.5s ease', backgroundImage: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }} />
                    </Box>
                </Box>

                {/* Actionable Verdict Card */}
                <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: strikerVerdict.bg, border: `1.5px solid ${strikerVerdict.border}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            {strikerVerdict.icon}
                            <Typography variant="subtitle1" fontWeight="800" sx={{ color: strikerVerdict.color }}>
                                {strikerVerdict.headline}
                            </Typography>
                        </Box>
                        <Chip
                            label={strikerVerdict.actionableTip}
                            size="small"
                            sx={{ bgcolor: strikerVerdict.color, color: 'white', fontWeight: '800', fontSize: '0.75rem', px: 0.5 }}
                        />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {strikerVerdict.details}
                    </Typography>
                </Box>
            </Paper>

            {/* Non-Striker Rotation & Key Highlights */}
            {isDualBatsmanMode && nonStriker && (
                <Grid container spacing={2}>
                    {/* Non-Striker on Strike Scenario */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#1E293B', fontSize: '0.95rem' }}>
                                    🔄 ஸ்ட்ரைக் சுழற்சி கணிப்பு: {nonStriker?.name} vs {bowler?.name}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: nonStrikerVerdict.bg, border: `1px solid ${nonStrikerVerdict.border}` }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                                    {nonStrikerVerdict.icon}
                                    <Typography variant="subtitle2" fontWeight="800" sx={{ color: nonStrikerVerdict.color }}>
                                        {nonStrikerVerdict.headline}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    {nonStrikerVerdict.details}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Quick Tactical Summary */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${themeColors.cardBorder}`, bgcolor: '#ffffff', height: '100%' }}>
                            <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#1E293B', mb: 1.5, fontSize: '0.95rem' }}>
                                📋 மேட்ச்அப் முக்கிய பரிந்துரைகள் (Match Highlights)
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1.2, bgcolor: '#F8FAFC', borderRadius: '10px' }}>
                                    <CheckCircleOutlineIcon sx={{ color: '#059669', fontSize: 20 }} />
                                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.82rem' }}>
                                        <strong>{striker?.name || 'ஸ்ட்ரைக்கர்'}:</strong> {strikerPower.p1 > 50 ? 'பவுண்டரிகள் அடிக்க சாதகமான நிலை' : 'விழிப்புணர்வுடன் ஸ்ட்ரைக் ரொட்டேட் செய்யவும்'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1.2, bgcolor: '#F8FAFC', borderRadius: '10px' }}>
                                    <TrendingUpIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.82rem' }}>
                                        <strong>{nonStriker?.name || 'நான்-ஸ்ட்ரைக்கர்'}:</strong> ஸ்ட்ரைக் எடுக்கும் போது உள்ள பலம் {nonStrikerScore >= 0 ? 'சாதகமாக உள்ளது' : 'கவனமாக ஆட வேண்டும்'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1.2, bgcolor: '#F8FAFC', borderRadius: '10px' }}>
                                    <SportsBaseballIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.82rem' }}>
                                        <strong>{bowler?.name || 'பவுலர்'}:</strong> {strikerPower.p2 > 50 ? 'டாட் பால்கள் மற்றும் விக்கெட் வாய்ப்பு அதிகம்' : 'ரன் கட்டுப்படுத்துவதில் சவால் இருக்கும்'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default ClientHeadToHead;
