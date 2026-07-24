
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import React from 'react';

// Mock Axios
vi.mock('axios');

// Mock specific components
vi.mock('../components/RasiChart', () => ({
    default: () => <div data-testid="rasi-chart">Rasi Chart</div>
}));

// Mock simple mocks for non-critical components
vi.mock('../components/PlanetaryTable', () => ({ default: () => <div /> }));
vi.mock('../components/NotesOverlay', () => ({ default: () => <div /> }));

// Helper to render component
const renderComponent = () => {
    return render(
        <AuthContext.Provider value={{ token: 'fake-token', user: { name: 'AdminUser', role: 'admin' }, logout: vi.fn() }}>
            <AdminDashboard />
        </AuthContext.Provider>
    );
};

describe('AdminDashboard Team Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        axios.get.mockResolvedValue({ data: [] }); // User/Groups/Players
    });

    it('should show Autocomplete for "Create Team" dialog', async () => {
        // Mock navigate to Groups Tab
        // Since we can't easily switch tabs in unit test without full integration,
        // we can utilize the "Quick Actions" if they exist, or simulate Tab click.
        renderComponent();

        // Admin Dashboard has a Sidebar with "Groups".
        // Drawer is visible on desktop (> sm).
        // Let's find "Groups" in the menu and click it.
        const groupsMenu = screen.getByText('Groups');
        fireEvent.click(groupsMenu);

        // Now we should be in GroupsManager view.
        // Look for "Create Team" button.
        const createBtn = await screen.findByText('Create Team');
        expect(createBtn).toBeInTheDocument();
        fireEvent.click(createBtn);

        // Dialog should open.
        // Look for "Create New Group" title.
        expect(await screen.findByText('Create New Group')).toBeInTheDocument();

        // Check for Autocomplete Input
        // The Autocomplete renders a Combobox.
        const autocompleteInput = screen.getByRole('combobox', { name: /Group\/Team Name/i });
        expect(autocompleteInput).toBeInTheDocument();

        // Simulate typing a team name
        fireEvent.change(autocompleteInput, { target: { value: 'Chennai' } });

        // Wait for suggestions? Autocomplete usually filters locally since options are static.
        // Verify value updates
        expect(autocompleteInput.value).toBe('Chennai');
    });

    it('should show Autocomplete in "Add to Team" dialog when players are selected', async () => {
        // Mock Groups and Players
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/groups')) return Promise.resolve({ data: [{ _id: 'g1', name: 'Existing Group', players: [] }] });
            if (url.includes('/api/players')) return Promise.resolve({
                data: {
                    players: [{ _id: 'p1', name: 'Test Player', id: 'P001' }],
                    totalPlayers: 1
                }
            });
            return Promise.resolve({ data: [] });
        });

        renderComponent();

        // Navigate to Players
        fireEvent.click(screen.getByText('Players'));

        // Wait for players to load
        await waitFor(() => expect(screen.getByText('Test Player')).toBeInTheDocument());

        // Select player (checkbox)
        // Find row checkbox.
        const checkboxes = screen.getAllByRole('checkbox');
        // Index 0 might be "Select All" if it exists, or just the first row.
        // In AdminDashboard typically row checkboxes exist.
        // Assuming the first checkbox is for the player row (or verify via structure)
        if (checkboxes.length > 0) {
            fireEvent.click(checkboxes[0]);
        }

        // Click "Add to Team" button (it appears when items selected)
        const addBtn = await screen.findByText(/Add to Team/i);
        fireEvent.click(addBtn);

        // Dialog "Add to Team"
        expect(await screen.findByText('Add to Team')).toBeInTheDocument();

        // Verify "Existing Group" button is present
        expect(screen.getByText('Existing Group')).toBeInTheDocument();

        // Verify Autocomplete "Select/Type Team Name" is present
        const teamInput = screen.getByRole('combobox', { name: /Select\/Type Team Name/i });
        expect(teamInput).toBeInTheDocument();
    });
});
