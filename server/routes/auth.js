
const express = require('express');
const router = express.Router();
const { register, login, googleLogin, saveFcmToken, getMe, getPendingUsers, approveUser, getAdminStats, getAllUsers, deleteUser, blockUser, incrementView, createUserByAdmin, updateUserRole, resetUserPasswordByAdmin } = require('../controllers/authController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Optional auth helper
const optionalAuth = (req, res, next) => {
    let token = req.header('x-auth-token') || (req.header('Authorization')?.startsWith('Bearer ') ? req.header('Authorization').substring(7) : null);
    if (token) {
        try {
            const jwtSecret = process.env.JWT_SECRET || 'astrocricket_secure_jwt_secret_2025';
            const decoded = require('jsonwebtoken').verify(token, jwtSecret);
            req.user = decoded.user;
        } catch (_) {}
    }
    next();
};

// @route   GET api/auth/me
// @desc    Get current user details from DB using token
// @access  Private
router.get('/me', auth, getMe);

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', login);

// @route   POST api/auth/google
// @desc    Google OAuth Login
// @access  Public
router.post('/google', googleLogin);

// @route   POST api/auth/save-fcm-token
// @desc    Save Device FCM Token for Push Notifications
// @access  Public (Optional User Auth)
router.post('/save-fcm-token', optionalAuth, saveFcmToken);

// @route   GET api/auth/pending
// @desc    Get pending users
// @access  Private (Admin)
router.get('/pending', auth, role(['superadmin']), getPendingUsers);

// @route   PUT api/auth/approve/:id
// @desc    Approve user
// @access  Private (Admin)
router.put('/approve/:id', auth, role(['superadmin']), approveUser);

// @route   GET api/auth/stats
// @desc    Get dashboard stats
// @access  Private (Admin)
router.get('/stats', getAdminStats);

// @route   GET api/auth/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', auth, role(['superadmin']), getAllUsers);

// @route   POST api/auth/create-user
// @desc    Create User/Client directly by Admin
// @access  Private (Admin)
router.post('/create-user', auth, role(['superadmin']), createUserByAdmin);

// @route   PUT api/auth/role/:id
// @desc    Update user role
// @access  Private (Admin)
router.put('/role/:id', auth, role(['superadmin']), updateUserRole);

// @route   PUT api/auth/reset-password/:id
// @desc    Reset user password by Admin
// @access  Private (Admin)
router.put('/reset-password/:id', auth, role(['superadmin']), resetUserPasswordByAdmin);

// @route   DELETE api/auth/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', auth, role(['superadmin']), deleteUser);

// @route   PUT api/auth/block/:id
// @desc    Block/Unblock user
// @access  Private (Admin)
router.put('/block/:id', auth, role(['superadmin']), blockUser);

// @route   POST api/auth/increment-view
// @desc    Increment dashboard views
// @access  Public
router.post('/increment-view', incrementView);

module.exports = router;

