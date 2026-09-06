import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, Chip, Tooltip, IconButton, Button, ButtonGroup } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

/**
 * Generate smooth SVG cubic Bezier path for given points
 */
const generateSmoothPath = (points, width, height, minVal, maxVal, padding = 30) => {
    if (!points || points.length === 0) return { path: '', areaPath: '', coords: [] };

    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;
    const range = (maxVal - minVal) || 1;

    const zeroY = height - padding - ((0 - minVal) / range) * effectiveHeight;

    const coords = points.map((pt, idx) => {
        const x = padding + (idx / (points.length - 1)) * effectiveWidth;
        const y = height - padding - ((pt.momentum - minVal) / range) * effectiveHeight;
        return { x, y, pt };
    });

    if (coords.length === 1) {
        return {
            path: `M ${coords[0].x} ${coords[0].y}`,
            areaPath: '',
            zeroY,
            coords
        };
    }

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i === 0 ? i : i - 1];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const areaPath = `${path} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;

    return { path, areaPath, zeroY, coords };
};

const MatchMomentumChart = ({
    timelineData,
    teamAName = 'Team A',
    teamBName = 'Team B',
    onTossToggle,
    batFirstTeam = 'teamA'
}) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [viewPhase, setViewPhase] = useState('ALL'); // 'ALL', 'INN1', 'INN2'

    const timePoints = useMemo(() => {
        if (!timelineData || !timelineData.timePoints) return [];
        if (viewPhase === 'INN1') return timelineData.timePoints.filter(p => p.inning === 1);
        if (viewPhase === 'INN2') return timelineData.timePoints.filter(p => p.inning === 2);
        return timelineData.timePoints;
    }, [timelineData, viewPhase]);

    // Dimensions
    const svgWidth = 900;
    const svgHeight = 320;
    const padding = 45;

    const { minVal, maxVal } = useMemo(() => {
        if (!timePoints.length) return { minVal: -10, maxVal: 10 };
        const vals = timePoints.map(p => p.momentum);
        let min = Math.min(...vals, -5);
        let max = Math.max(...vals, 5);
        // Add headroom
        min = Math.floor(min - 2);
        max = Math.ceil(max + 2);
        return { minVal: min, maxVal: max };
    }, [timePoints]);

    const { path, areaPath, zeroY, coords } = useMemo(() => {
        return generateSmoothPath(timePoints, svgWidth, svgHeight, minVal, maxVal, padding);
    }, [timePoints, minVal, maxVal]);

    if (!timelineData || !timelineData.timePoints || timelineData.timePoints.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <SportsCricketIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" fontWeight="bold">
                    Momentum Waveform requires Match Prediction calculation
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Click "Predict" to generate the 4-hour dynamic astrology timeline chart.
                </Typography>
            </Paper>
        );
    }

    const { innings1, innings2, matchVerdict } = timelineData;
    const isTeamABat1st = batFirstTeam === 'teamA';
    const inn1BatName = isTeamABat1st ? teamAName : teamBName;
    const inn1BowlName = isTeamABat1st ? teamBName : teamAName;
    const inn2BatName = isTeamABat1st ? teamBName : teamAName;
    const inn2BowlName = isTeamABat1st ? teamAName : teamBName;

    // Innings 1 & 2 midpoint X
    const inn1Points = coords.filter(c => c.pt.inning === 1);
    const inn2Points = coords.filter(c => c.pt.inning === 2);
    const breakPoint = inn2Points[0] || null;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2.5 },
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Ambient background glow */}
            <Box sx={{
                position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />
            <Box sx={{
                position: 'absolute', bottom: -50, left: -50, width: 200, height: 200,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            {/* Header: Title & Toss Control & Phase Switcher */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 1.5,
                mb: 2,
                pb: 1.5,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <TrendingUpIcon sx={{ color: '#10B981', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#F8FAFC', fontSize: { xs: '1rem', sm: '1.15rem' }, display: 'flex', alignItems: 'center', gap: 1 }}>
                            🏏 T20 Trading-Style Match Momentum Wave
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            4-Hour Dynamic Vedic Astrology Timeline (Innings 1 vs Innings 2)
                        </Typography>
                    </Box>
                </Box>

                {/* Toss / Bat First & Phase Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
                    {onTossToggle && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={onTossToggle}
                            startIcon={<SwapHorizIcon sx={{ color: '#F59E0B' }} />}
                            sx={{
                                color: '#F8FAFC',
                                borderColor: 'rgba(245, 158, 11, 0.4)',
                                bgcolor: 'rgba(245, 158, 11, 0.08)',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                borderRadius: '12px',
                                px: 1.5,
                                '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.18)', borderColor: '#F59E0B' }
                            }}
                        >
                            Bat 1st: <strong style={{ color: '#F59E0B', marginLeft: '4px' }}>{isTeamABat1st ? teamAName : teamBName}</strong>
                        </Button>
                    )}

                    <ButtonGroup size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
                        <Button
                            variant={viewPhase === 'ALL' ? 'contained' : 'text'}
                            onClick={() => setViewPhase('ALL')}
                            sx={{
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                bgcolor: viewPhase === 'ALL' ? '#3B82F6' : 'transparent',
                                color: '#F8FAFC'
                            }}
                        >
                            All 4 Hours
                        </Button>
                        <Button
                            variant={viewPhase === 'INN1' ? 'contained' : 'text'}
                            onClick={() => setViewPhase('INN1')}
                            sx={{
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                bgcolor: viewPhase === 'INN1' ? '#10B981' : 'transparent',
                                color: '#F8FAFC'
                            }}
                        >
                            1st Innings
                        </Button>
                        <Button
                            variant={viewPhase === 'INN2' ? 'contained' : 'text'}
                            onClick={() => setViewPhase('INN2')}
                            sx={{
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                bgcolor: viewPhase === 'INN2' ? '#EC4899' : 'transparent',
                                color: '#F8FAFC'
                            }}
                        >
                            2nd Innings
                        </Button>
                    </ButtonGroup>
                </Box>
            </Box>

            {/* Innings 1 vs Innings 2 KPI Cards */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
                mb: 2.5
            }}>
                {/* 1st Innings Card */}
                <Paper sx={{
                    p: 1.5,
                    borderRadius: '14px',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>1️⃣ 1st Innings</span> • {innings1.timeRange}
                        </Typography>
                        <Chip
                            label={innings1.domination >= 0 ? `+${innings1.domination} Bat Domination` : `${innings1.domination} Bowl Pressure`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                bgcolor: innings1.domination >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                color: innings1.domination >= 0 ? '#34D399' : '#FB7185',
                                border: '1px solid',
                                borderColor: innings1.domination >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: '8px' }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>Batting</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#38BDF8' }}>
                                🏏 {inn1BatName} ({innings1.batTotal} pts)
                            </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#64748B' }}>VS</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>Bowling</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#F43F5E' }}>
                                🎯 {inn1BowlName} ({innings1.bowlTotal} pts)
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* 2nd Innings Card */}
                <Paper sx={{
                    p: 1.5,
                    borderRadius: '14px',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#EC4899', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>2️⃣ 2nd Innings</span> • {innings2.timeRange}
                        </Typography>
                        <Chip
                            label={innings2.domination >= 0 ? `+${innings2.domination} Bat Domination` : `${innings2.domination} Bowl Pressure`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                bgcolor: innings2.domination >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                color: innings2.domination >= 0 ? '#34D399' : '#FB7185',
                                border: '1px solid',
                                borderColor: innings2.domination >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: '8px' }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>Batting</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#38BDF8' }}>
                                🏏 {inn2BatName} ({innings2.batTotal} pts)
                            </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#64748B' }}>VS</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>Bowling</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#F43F5E' }}>
                                🎯 {inn2BowlName} ({innings2.bowlTotal} pts)
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* SVG TRADING WAVEFORM CHART CONTAINER */}
            <Box sx={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    style={{ width: '100%', height: 'auto', minWidth: '600px', overflow: 'visible' }}
                >
                    <defs>
                        {/* Positive Batting Gradient */}
                        <linearGradient id="battingWaveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Negative Bowling Gradient */}
                        <linearGradient id="bowlingWaveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.0" />
                            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.45" />
                        </linearGradient>

                        {/* Line Stroke Glow Filter */}
                        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.8" />
                        </filter>
                    </defs>

                    {/* Chart Background grid */}
                    <line x1={padding} y1={zeroY} x2={svgWidth - padding} y2={zeroY} stroke="#475569" strokeDasharray="4 4" strokeWidth="1.5" />

                    {/* Innings Break Divider (at 120 mins) */}
                    {breakPoint && viewPhase === 'ALL' && (
                        <g>
                            <line
                                x1={breakPoint.x}
                                y1={padding}
                                x2={breakPoint.x}
                                y2={svgHeight - padding}
                                stroke="#F59E0B"
                                strokeDasharray="6 4"
                                strokeWidth="2"
                                opacity="0.7"
                            />
                            <rect
                                x={breakPoint.x - 55}
                                y={padding - 18}
                                width="110"
                                height="20"
                                rx="10"
                                fill="#0F172A"
                                stroke="#F59E0B"
                                strokeWidth="1"
                            />
                            <text
                                x={breakPoint.x}
                                y={padding - 4}
                                fill="#F59E0B"
                                fontSize="10"
                                fontWeight="bold"
                                textAnchor="middle"
                            >
                                ⏸️ Innings Break
                            </text>
                        </g>
                    )}

                    {/* Upper Zone & Lower Zone labels */}
                    <text x={padding + 5} y={padding + 15} fill="#10B981" fontSize="11" fontWeight="bold" opacity="0.8">
                        ▲ Batting Surge (High Runs Zone)
                    </text>
                    <text x={padding + 5} y={svgHeight - padding - 8} fill="#F43F5E" fontSize="11" fontWeight="bold" opacity="0.8">
                        ▼ Bowling Danger (Wickets Zone)
                    </text>

                    {/* Area Wave Filled */}
                    <path d={areaPath} fill="url(#battingWaveGradient)" />

                    {/* Main Wave Spline Curve */}
                    <path
                        d={path}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        filter="url(#glowEffect)"
                    />

                    {/* Vertical Crosshair Line on Active/Hovered Point */}
                    {hoveredPoint && (
                        <g pointerEvents="none">
                            <line
                                x1={coords.find(c => c.pt.index === hoveredPoint.index)?.x || 0}
                                y1={padding}
                                x2={coords.find(c => c.pt.index === hoveredPoint.index)?.x || 0}
                                y2={svgHeight - padding}
                                stroke="#38BDF8"
                                strokeDasharray="3 3"
                                strokeWidth="1.5"
                                opacity="0.8"
                            />
                        </g>
                    )}

                    {/* Data Points along curve */}
                    {coords.map((c, idx) => {
                        const isHovered = hoveredPoint?.index === c.pt.index;
                        const isPositive = c.pt.momentum >= 0;
                        const nodeColor = isPositive ? '#10B981' : '#F43F5E';

                        return (
                            <g key={idx} pointerEvents="none">
                                {/* Glowing halo on hover */}
                                {isHovered && (
                                    <circle
                                        cx={c.x}
                                        cy={c.y}
                                        r="12"
                                        fill={nodeColor}
                                        opacity="0.4"
                                    />
                                )}

                                {/* Main point circle */}
                                <circle
                                    cx={c.x}
                                    cy={c.y}
                                    r={isHovered ? 6.5 : 4}
                                    fill={nodeColor}
                                    stroke="#FFFFFF"
                                    strokeWidth={isHovered ? 2.5 : 1.5}
                                />

                                {/* Time label below X axis */}
                                {idx % 2 === 0 && (
                                    <text
                                        x={c.x}
                                        y={svgHeight - padding + 22}
                                        fill="#94A3B8"
                                        fontSize="10"
                                        fontWeight="500"
                                        textAnchor="middle"
                                    >
                                        {c.pt.time}
                                    </text>
                                )}

                                {/* Over / Phase tags below time */}
                                {idx % 4 === 0 && (
                                    <text
                                        x={c.x}
                                        y={svgHeight - padding + 36}
                                        fill="#64748B"
                                        fontSize="9"
                                        textAnchor="middle"
                                    >
                                        {c.pt.overLabel}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Full SVG Smooth Tracking Transparent Overlay */}
                    <rect
                        x={0}
                        y={0}
                        width={svgWidth}
                        height={svgHeight}
                        fill="transparent"
                        style={{ cursor: 'crosshair' }}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                            if (coords.length > 0) {
                                let closest = coords[0];
                                let minDiff = Math.abs(coords[0].x - mouseX);
                                for (let i = 1; i < coords.length; i++) {
                                    const diff = Math.abs(coords[i].x - mouseX);
                                    if (diff < minDiff) {
                                        minDiff = diff;
                                        closest = coords[i];
                                    }
                                }
                                if (closest && closest.pt) {
                                    setHoveredPoint(closest.pt);
                                }
                            }
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                    />
                </svg>
            </Box>

            {/* Hover Detailed Info Card - Fixed Height Reserved Slot to Prevent Any Layout Shift */}
            <Box sx={{ minHeight: '80px', mt: 1.5, display: 'flex', alignItems: 'center' }}>
                {hoveredPoint ? (
                    <Paper
                        elevation={4}
                        sx={{
                            width: '100%',
                            p: 1.5,
                            borderRadius: '14px',
                            bgcolor: 'rgba(30, 41, 59, 0.95)',
                            border: '1px solid #38BDF8',
                            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 1.5,
                            pointerEvents: 'none'
                        }}
                    >
                        {/* Left: Time, Phase, Lagna */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                px: 1.5, py: 0.8, borderRadius: '10px',
                                bgcolor: hoveredPoint.momentum >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                border: '1px solid',
                                borderColor: hoveredPoint.momentum >= 0 ? '#10B981' : '#F43F5E',
                                textAlign: 'center',
                                minWidth: '68px'
                            }}>
                                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.65rem' }}>MOMENTUM</Typography>
                                <Typography variant="subtitle2" fontWeight="900" sx={{ color: hoveredPoint.momentum >= 0 ? '#34D399' : '#FB7185' }}>
                                    {hoveredPoint.momentum >= 0 ? `+${hoveredPoint.momentum}` : hoveredPoint.momentum}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight="bold" sx={{ color: '#F8FAFC' }}>
                                    ⏰ {hoveredPoint.time} • Innings {hoveredPoint.inning} ({hoveredPoint.overLabel})
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#38BDF8', display: 'block' }}>
                                    🏠 லக்னம்: {hoveredPoint.lagna} | ⭐ நட்சத்திரம்: {hoveredPoint.nakshatraTamil || hoveredPoint.nakshatra} (N{hoveredPoint.nSeq})
                                </Typography>
                            </Box>
                        </Box>

                        {/* Right: Favoured Players */}
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {hoveredPoint.topBatsman && (
                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 0.8, borderRadius: '8px', borderLeft: '3px solid #10B981' }}>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.65rem' }}>TOP BATSMAN SURGE</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#34D399' }}>
                                        🔥 {hoveredPoint.topBatsman.name} (B:{hoveredPoint.topBatsman.score})
                                    </Typography>
                                </Box>
                            )}
                            {hoveredPoint.topBowler && (
                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 0.8, borderRadius: '8px', borderLeft: '3px solid #F43F5E' }}>
                                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.65rem' }}>TOP BOWLING THREAT</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#FB7185' }}>
                                        ⚡ {hoveredPoint.topBowler.name} (Bo:{hoveredPoint.topBowler.score})
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                ) : (
                    <Box sx={{
                        width: '100%',
                        py: 1.2,
                        px: 2,
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        textAlign: 'center'
                    }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            💡 <span>மவுஸை வேவ்ஃபார்ம் மீது நகர்த்தி (Hover), குறிப்பிட்ட நேரத்திற்கான லக்னம், நட்சத்திரம் மற்றும் டாப் வீரர்கள் விவரங்களைப் பார்க்கலாம்.</span>
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Bottom Match Prediction Summary */}
            <Box sx={{
                mt: 1.5, pt: 1.5,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1
            }}>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    🏆 <strong>Predicted Winner:</strong> <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>{matchVerdict.predictedWinner === 'Team A' ? teamAName : teamBName}</span> ({matchVerdict.confidence} probability)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                    * Dynamic Lagna shifts and astrological sub-periods dictate key moments.
                </Typography>
            </Box>
        </Paper>
    );
};

export default MatchMomentumChart;
