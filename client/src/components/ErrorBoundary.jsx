import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.group('Component Error');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.groupEnd();
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: '500px', borderRadius: '16px', border: '1px solid #ffc107' }}>
                        <Typography variant="h5" color="error" gutterBottom fontWeight="bold">
                            Oops! Something went wrong.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            An error occurred in this component: {this.props.name || 'Unknown Component'}
                        </Typography>
                        <Typography variant="caption" component="pre" sx={{
                            p: 2,
                            bgcolor: '#f5f5f5',
                            borderRadius: '8px',
                            overflow: 'auto',
                            maxHeight: '150px',
                            textAlign: 'left',
                            display: 'block',
                            mb: 3,
                            border: '1px solid #ddd'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => window.location.reload()}
                            sx={{ bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}
                        >
                            Reload Page
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{ ml: 2, color: '#ff6f00', borderColor: '#ff6f00' }}
                            onClick={() => this.setState({ hasError: false })}
                        >
                            Try Again
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
