const express = require('express');
const router = express.Router();
const { register, login, getPendingUsers, approveUser } = require('../controllers/authController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/register', register);
router.post('/login', login);
router.get('/pending', auth, role(['superadmin']), getPendingUsers);
router.put('/approve/:id', auth, role(['superadmin']), approveUser);

module.exports = router;
