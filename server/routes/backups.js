const express = require('express');
const router = express.Router();
const { getBackupsList, triggerManualBackup, restoreFromBackup, deleteBackupFile, downloadBackupFile } = require('../controllers/backupController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Protect all routes under this router so only superadmins can access them
router.use(auth);
router.use(role(['superadmin']));

// @route   GET api/backups
// @desc    Get list of all backups
// @access  Private (Super Admin)
router.get('/', getBackupsList);

// @route   POST api/backups/create
// @desc    Create a new backup manually
// @access  Private (Super Admin)
router.post('/create', triggerManualBackup);

// @route   POST api/backups/restore/:filename
// @desc    Restore database from a backup file
// @access  Private (Super Admin)
router.post('/restore/:filename', restoreFromBackup);

// @route   DELETE api/backups/:filename
// @desc    Delete a backup file
// @access  Private (Super Admin)
router.delete('/:filename', deleteBackupFile);

// @route   GET api/backups/download/:filename
// @desc    Download a backup file
// @access  Private (Super Admin)
router.get('/download/:filename', downloadBackupFile);

module.exports = router;
