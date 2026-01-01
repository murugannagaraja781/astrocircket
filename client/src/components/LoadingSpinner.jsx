import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
    return (
        <div className="loading-container">
            <div className="logo-wrapper">
                <img
                    src="/logo.png"
                    alt="S&B Entertainment"
                    className="loading-logo"
                />
                <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
