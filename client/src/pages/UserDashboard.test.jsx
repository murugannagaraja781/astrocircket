
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import UserDashboard from './UserDashboard';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import React from 'react';

// Mock Axios
vi.mock('axios');

// Mock specific components if they are too complex or irrelevant,
// but here we want to test the Dialog opening found in UserDashboard.
// But MatchPredictionControl makes real network calls which are mocked via axios.

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    Link: ({ children }) => <a>{children}</a>
}));

// Mock child components that might cause issues
vi.mock('../components/RuleApplyingDialog', () => ({
    default: ({ open }) => open ? <div data-testid="rule-applying-dialog">Rule Dialog</div> : null
}));

vi.mock('../components/MatchPredictionControl', async () => {
    const React = await vi.importActual('react');
    return {
        default: React.forwardRef((props, ref) => {
            React.useImperativeHandle(ref, () => ({
                 runPrediction: () => {
                     // Simulate async prediction
                     setTimeout(() => {
                         props.onPredictionComplete(
                             { nakshatra: { name: 'Ashwini', tamil: 'அசுவினி' }, planetPositions: { Moon: 'Aries' } },
                             { date: '2026-01-13', time: '19:30', location: 'Mumbai, India', lat: 19.076, long: 72.8777, timezone: 5.5 }
                         );
                     }, 100);
                 }
            }));
            // Use createElement to avoid JSX transpilation issues in mock factory if any
            return React.createElement('div', { 'data-testid': 'match-prediction-control' },
                React.createElement('button', { onClick: () => {
                     setTimeout(() => {
                         props.onPredictionComplete(
                             { nakshatra: { name: 'Ashwini', tamil: 'அசுவினி' }, planetPositions: { Moon: 'Aries' } },
                             { date: '2026-01-13', time: '19:30', location: 'Mumbai, India', lat: 19.076, long: 72.8777, timezone: 5.5 }
                         );
                     }, 100);
                } }, '🏏 Predict')
            );
        })
    };
});

describe('UserDashboard Prediction Flow', () => {
    const mockToken = 'fake-token';
    const mockGroups = [
        {
            _id: 'team1',
            name: 'CSK',
            players: [
                {
                    id: 'p1', name: 'Dhoni',
                    birthChart: { data: { planets: { Moon: "Taurus" } } } // Partial data
                }
            ]
        },
        {
            _id: 'team2',
            name: 'MI',
            players: [
                {
                    id: 'p2', name: 'Rohit',
                    birthChart: { data: { planets: { Moon: "Taurus" } } }
                }
            ]
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default API responses
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/players')) return Promise.resolve({ data: { players: [], totalPlayers: 0 } });
            if (url.includes('/api/groups')) return Promise.resolve({ data: mockGroups });
            return Promise.resolve({ data: {} });
        });
        axios.post.mockImplementation((url) => {
            if (url.includes('/api/auth/increment-view')) return Promise.resolve({});
            if (url.includes('/api/charts/birth-chart')) {
                // Return a mock Match Chart
                return Promise.resolve({
                     data: {
                         nakshatra: { name: 'Ashwini', tamil: 'அசுவினி' },
                         planetPositions: { Moon: 'Aries' }
                     }
                });
            }
            return Promise.resolve({ data: {} });
        });
    });

    const renderComponent = () => {
        return render(
            <AuthContext.Provider value={{ token: mockToken, user: { name: 'TestUser' }, logout: vi.fn() }}>
                <UserDashboard />
            </AuthContext.Provider>
        );
    };

    it('should open RuleApplyingDialog after prediction', async () => {
        renderComponent();

        // 1. Wait for teams to load
        await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/groups'), expect.any(Object)));

        // 2. Open Prediction Wizard
        const wizardBtn = await screen.findByText(/Prediction Wizard/i);
        fireEvent.click(wizardBtn);

        // 3. User selects Team A and Team B in the Dialog
        // The Dialog should be open.
        // We need to find the Select inputs.
        // Since they are Select components, we might need to find by Label.

        // Wait for Dialog to appear involving "Select Teams to Start"
        const dialogTitle = await screen.findByText(/Select Teams to Start/i);
        expect(dialogTitle).toBeInTheDocument();

        // Select Team A (using Material UI Select is tricky in tests, simplified approach: find input by label)
        // Actually, we can just set the state if we could, but we can't.
        // We have to simulate user interaction.
        // MUI Select: Click the element with role 'combobox' or find label "TEAM A"

        // Finding the input via Label Text might target the hidden input or the div.
        // Let's try to find the Combobox by Label.

        // Note: In the code, InputLabel is "TEAM A".
        // On Mobile/Fullscreen Team Selection:
        // Inputs are fullWidth.

        // Let's assume we are in Mobile View logic (default jsdom size).
        // The "MOBILE: FULL SCREEN TEAM SELECTION" block is visible.

        // Find Select for Team A.
        // MUI Select acts as a button with aria-haspopup="listbox" usually, or a combobox.
        // The Label is "TEAM A".
        // Let's rely on finding the Label element and assuming it's near the Select.
        // Or find by role 'combobox' if available.
        // Note: MUI Select v5 usually exposes a `combobox` role on the trigger div if native=false.

        // Let's try finding the element by Text "TEAM A" (the label) and then clicking the sibling/parent.
        // Actually, we can just look for the text "TEAM A" which is the label.
        const teamALabels = await screen.findAllByText(/^TEAM A$/);
        const teamALabel = teamALabels[0]; // Mobile view one

        // In MUI, clicking the label usually focuses the input, but we want to open the dropdown.
        // We should click the Select component.
        // Let's try to find the `combobox` within the generic area.

        // Simpler approach: Use `getAllByRole('combobox')`.
        // There should be 2 comboboxes (Team A and Team B) in the mobile view.
        const comboboxes = screen.getAllByRole('combobox');
        // Note: MUI Select might use role="button" instead of combobox sometimes.
        // Let's check the HTML output in failure again... no, let's just try generic mouseDown on the generic Select wrapper.

        // Better: Use `fireEvent.mouseDown(teamALabel.nextSibling.querySelector('[role="combobox"]'))`? No.

        // Let's try `getByRole('combobox', { name: /TEAM A/i })`.
        // If that fails, we fallback to finding all comboboxes.

        // In the failing output, I see generic divs.

        // Let's try finding by testid if we could add one, but we can't modify source easily just for test without verifying.
        // Let's try finding the Select by its value or label prop.

        // Current Code:
        // <InputLabel>TEAM A</InputLabel> <Select label="TEAM A" ...>

        // Use combobox role.
        // Note: MUI Select might use role="button" or "combobox".
        // If "combobox" is not found, try "button".
        let teamASelect;
        try {
            const comboboxes = screen.getAllByRole('combobox');
            teamASelect = comboboxes[0];
        } catch (e) {
            // Fallback for MUI Select if it uses button role (which it does sometimes)
            // But usually getAllByRole('button') returns too many things.
            // Let's rely on class or structure if needed, or better, finding by text "TEAM A" and finding the sibling.
             const label = await screen.findByText(/^TEAM A$/);
             // The Select is usually a sibling of the label in Authorization form controls.
             // In <FormControl>, they are siblings.
             // The Select's trigger is a div.
             // Let's try to click the sibling.
             const container = label.parentElement;
             const trigger = container.querySelector('[role="combobox"]') || container.querySelector('[role="button"]');
             teamASelect = trigger;
        }

        fireEvent.mouseDown(teamASelect);

        const optionA = await screen.findByText('CSK');
        fireEvent.click(optionA);

        let teamBSelect;
        const comboboxesB = screen.getAllByRole('combobox');
        if (comboboxesB.length > 0) teamBSelect = comboboxesB[1];
        else {
             const labels = await screen.findAllByText(/^TEAM B$/);
             const label = labels[0];
             const container = label.parentElement;
             teamBSelect = container.querySelector('[role="combobox"]') || container.querySelector('[role="button"]');
        }

        fireEvent.mouseDown(teamBSelect);

        const optionB = await screen.findByText('MI');
        fireEvent.click(optionB);

        // Now both teams selected.
        // The "Select Teams to Start" view should disappear.
        // The "Match Prediction Setup" AppBar should be visible.

        // Click "Predict" button (it's in the AppBar MatchPredictionControl)
        const predictBtn = await screen.findByText('🏏 Predict');
        fireEvent.click(predictBtn);

        // Wait for API call


        // Now check if RuleApplyingDialog appears.
        // It has text: "Applying Astrological Prediction Rules"
        // And "கணிப்பு விதிகள் சரிபார்க்கப்படுகிறது..."

        await waitFor(() => {
            expect(screen.getByText(/Applying Astrological Prediction Rules/i)).toBeInTheDocument();
        });
    });
});
