import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import MyPredictions from './pages/MyPredictions';
import TestChart from './pages/TestChart';
import { AuthProvider } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Private Route logic can be handled here or inside components,
// strictly creating a wrapper is cleaner.
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

const PrivateRoute = ({ children, roles }) => {
    const { isAuthenticated, loading, user } = useContext(AuthContext);

    if (loading) return <LoadingSpinner />;

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" />; // Redirect if unauthorized for this role
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App font-sans text-gray-900 bg-green-50 min-h-screen">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route
                            path="/admin-dashboard"
                            element={
                                <PrivateRoute roles={['superadmin']}>
                                    <AdminDashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute roles={['user', 'superadmin']}>
                                    <UserDashboard />
                                </PrivateRoute>
                            }
                        />

                        {/* Save Prediction Route */}
                        <Route
                            path="/my-predictions"
                            element={
                                <PrivateRoute roles={['user', 'superadmin']}>
                                    <MyPredictions />
                                </PrivateRoute>
                            }
                        />

                        {/* Default Redirect */}
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/test-chart" element={<TestChart />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
