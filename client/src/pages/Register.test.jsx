
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Register from './Register';
import AuthContext from '../context/AuthContext';
import React from 'react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <a>{children}</a>
}));

describe('Register Page', () => {
    const mockRegister = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <AuthContext.Provider value={{ register: mockRegister, error: null }}>
                <Register />
            </AuthContext.Provider>
        );
    };

    it('renders register form', () => {
        renderComponent();
        expect(screen.getByText(/Join the Squad/i)).toBeInTheDocument();
        expect(screen.getByText(/Submit Application/i, { selector: 'button' })).toBeInTheDocument();
    });

    it('displays error from context', () => {
        render(
             <AuthContext.Provider value={{ register: mockRegister, error: 'Registration Failed' }}>
                <Register />
            </AuthContext.Provider>
        );
         expect(screen.getByText(/Registration Failed/i)).toBeInTheDocument();
    });
});
