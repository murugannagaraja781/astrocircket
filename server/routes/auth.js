
const express = require('express');
const router = express.Router();
const { register, login, getPendingUsers, approveUser, getAdminStats } = require('../controllers/authController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', login);

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

module.exports = router;

