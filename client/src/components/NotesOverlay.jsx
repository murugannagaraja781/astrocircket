import React, { useState, useEffect, useRef } from 'react';
import {
    Paper,
    IconButton,
    Typography,
    Box,
    Tooltip,
    Divider,
    Autocomplete,
    TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { CRICKET_TEAMS } from '../utils/teams';

const NotesOverlay = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState('');
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [fontSize, setFontSize] = useState(14);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 500, height: 400 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState('');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const overlayRef = useRef(null);
    const textareaRef = useRef(null);

    // Load saved notes and preferences from localStorage
    useEffect(() => {
        const savedNotes = localStorage.getItem('adminNotes');
        const savedFontSize = localStorage.getItem('adminNotesFontSize');
        const savedPosition = localStorage.getItem('adminNotesPosition');
        const savedSize = localStorage.getItem('adminNotesSize');

        if (savedNotes) setNotes(savedNotes);
        if (savedFontSize) setFontSize(parseInt(savedFontSize));
        if (savedPosition) setPosition(JSON.parse(savedPosition));
        if (savedSize) setSize(JSON.parse(savedSize));
    }, []);

    // Auto-save notes to localStorage
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('adminNotes', notes);
        }, 500); // Debounce save by 500ms

        return () => clearTimeout(timeoutId);
    }, [notes]);

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem('adminNotesFontSize', fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        localStorage.setItem('adminNotesPosition', JSON.stringify(position));
    }, [position]);

    useEffect(() => {
        localStorage.setItem('adminNotesSize', JSON.stringify(size));
    }, [size]);

    // Handle dragging
    const handleMouseDown = (e) => {
        // Allow dragging from anywhere except interactive elements and resize handles
        if (!e.target.closest('input, textarea, button, [role="button"], .resize-handle')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }

        if (isResizing) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            let newSize = { ...size };
            let newPosition = { ...position };

            if (resizeDirection.includes('e')) {
                newSize.width = Math.max(300, size.width + deltaX);
            }
            if (resizeDirection.includes('s')) {
                newSize.height = Math.max(200, size.height + deltaY);
            }
            if (resizeDirection.includes('w')) {
                const newWidth = Math.max(300, size.width - deltaX);
                if (newWidth > 300) {
                    newPosition.x = position.x + deltaX;
                    newSize.width = newWidth;
                }
            }
            if (resizeDirection.includes('n')) {
                const newHeight = Math.max(200, size.height - deltaY);
                if (newHeight > 200) {
                    newPosition.y = position.y + deltaY;
                    newSize.height = newHeight;
                }
            }

            setSize(newSize);
            setPosition(newPosition);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, position, size, resizeDirection]);

    // Handle resizing
    const handleResizeStart = (direction) => (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(24, prev + 2));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(10, prev - 2));
    };

    if (!isOpen) return null;



    return (
        <Paper
            ref={overlayRef}
            elevation={8}
            onMouseDown={handleMouseDown}
            sx={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(to bottom, #fef9e7 0%, #fdeaa3 100%)',
                border: '2px solid #d4af37',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                cursor: isDragging ? 'grabbing' : 'default',
                userSelect: isDragging ? 'none' : 'auto',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `repeating-linear-gradient(
                        transparent,
                        transparent 31px,
                        #e8d5a8 31px,
                        #e8d5a8 32px
                    )`,
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: 0.3
                }
            }}
        >
            {/* Resize Handles */}
            {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(direction => (
                <Box
                    key={direction}
                    className="resize-handle"
                    onMouseDown={handleResizeStart(direction)}
                    sx={{
                        position: 'absolute',
                        ...(direction.includes('n') && { top: 0, height: '8px' }),
                        ...(direction.includes('s') && { bottom: 0, height: '8px' }),
                        ...(direction.includes('e') && { right: 0, width: '8px' }),
                        ...(direction.includes('w') && { left: 0, width: '8px' }),
                        ...(direction === 'n' && { left: '8px', right: '8px', cursor: 'ns-resize' }),
                        ...(direction === 's' && { left: '8px', right: '8px', cursor: 'ns-resize' }),
                        ...(direction === 'e' && { top: '8px', bottom: '8px', cursor: 'ew-resize' }),
                        ...(direction === 'w' && { top: '8px', bottom: '8px', cursor: 'ew-resize' }),
                        ...(direction === 'ne' && { cursor: 'nesw-resize' }),
                        ...(direction === 'nw' && { cursor: 'nwse-resize' }),
                        ...(direction === 'se' && { cursor: 'nwse-resize' }),
                        ...(direction === 'sw' && { cursor: 'nesw-resize' }),
                        zIndex: 10,
                        '&:hover': {
                            backgroundColor: 'rgba(212, 175, 55, 0.2)'
                        }
                    }}
                />
            ))}

            {/* Header */}
            <Box
                className="drag-handle"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'linear-gradient(to right, #d4af37, #f4d03f)',
                    borderBottom: '2px solid #c49c2e',
                    cursor: 'grab',
                    '&:active': {
                        cursor: 'grabbing'
                    },
                    zIndex: 2,
                    position: 'relative'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DragIndicatorIcon sx={{ color: '#8b6914', fontSize: '20px' }} />
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 700,
                            color: '#5d4a1f',
                            fontFamily: '"Courier New", monospace',
                            fontSize: '16px'
                        }}
                    >
                        📝 Admin Notes
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Decrease Font Size">
                        <IconButton
                            size="small"
                            onClick={decreaseFontSize}
                            sx={{
                                color: '#5d4a1f',
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.5)' }
                            }}
                        >
                            <RemoveIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={`Font Size: ${fontSize}px`}>
                        <Typography
                            sx={{
                                minWidth: '35px',
                                textAlign: 'center',
                                lineHeight: '32px',
                                fontWeight: 600,
                                color: '#5d4a1f',
                                fontSize: '13px'
                            }}
                        >
                            {fontSize}px
                        </Typography>
                    </Tooltip>

                    <Tooltip title="Increase Font Size">
                        <IconButton
                            size="small"
                            onClick={increaseFontSize}
                            sx={{
                                color: '#5d4a1f',
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.5)' }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Close">
                        <IconButton
                            size="small"
                            onClick={onClose}
                            sx={{
                                color: '#5d4a1f',
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.2)' }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Team Selection */}
            <Box sx={{ px: 3, pt: 2, display: 'flex', gap: 2 }}>
                <Autocomplete
                    disablePortal
                    freeSolo
                    options={CRICKET_TEAMS}
                    sx={{ flex: 1 }}
                    renderInput={(params) => <TextField {...params} label="TEAM A" variant="standard" size="small" />}
                />
                <Autocomplete
                    disablePortal
                    freeSolo
                    options={CRICKET_TEAMS}
                    sx={{ flex: 1 }}
                    renderInput={(params) => <TextField {...params} label="TEAM B" variant="standard" size="small" />}
                />
            </Box>

            {/* Text Area */}
            <Box
                sx={{
                    flex: 1,
                    padding: '16px 24px 16px 60px',
                    position: 'relative',
                    zIndex: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Left margin line (like a real notepad) */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '48px',
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        backgroundColor: '#e8aca9',
                        opacity: 0.5,
                        zIndex: 1
                    }}
                />

                <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Start typing your notes here..."
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontFamily: '"Courier New", "Consolas", monospace',
                        fontSize: `${fontSize}px`,
                        lineHeight: '32px',
                        color: '#2c3e50',
                        resize: 'none',
                        padding: 0,
                        margin: 0,
                        position: 'relative',
                        zIndex: 2
                    }}
                />
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    padding: '6px 12px',
                    background: 'linear-gradient(to right, #d4af37, #f4d03f)',
                    borderTop: '2px solid #c49c2e',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 2,
                    position: 'relative'
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: '#5d4a1f',
                        fontWeight: 500,
                        fontSize: '11px'
                    }}
                >
                    {notes.length} characters
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#5d4a1f',
                        fontStyle: 'italic',
                        fontSize: '10px'
                    }}
                >
                    Auto-saved ✓
                </Typography>
            </Box>
        </Paper>
    );
};

export default NotesOverlay;
