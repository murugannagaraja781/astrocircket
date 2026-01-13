
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import React from 'react';

vi.mock('axios');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <a>{children}</a>
}));

describe('Login Page', () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <AuthContext.Provider value={{ login: mockLogin }}>
                <Login />
            </AuthContext.Provider>
        );
    };

    it('renders login form', () => {
        renderComponent();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByText(/Play \(Login\)/i)).toBeInTheDocument();
    });

    it('displays error from context', () => {
        const contextValue = { login: mockLogin, error: 'Invalid Credentials' };
        render(
             <AuthContext.Provider value={contextValue}>
                <Login />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Invalid Credentials/i)).toBeInTheDocument();
    });

    it('calls login on submit', async () => {
        // Mock success
        mockLogin.mockResolvedValue(); // login returns promise

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByText(/Play \(Login\)/i));

        await waitFor(() => {
             expect(mockLogin).toHaveBeenCalledWith({ username: 'user@test.com', password: 'password' });
        });
    });
});
