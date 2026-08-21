const path = require('path');
const fs = require('fs');
const { createBackup, listBackups, restoreBackup, deleteBackup, BACKUP_DIR } = require('../utils/backupHelper');

/**
 * Get all backup files list
 */
const getBackupsList = async (req, res) => {
    try {
        const backups = listBackups();
        res.json(backups);
    } catch (err) {
        console.error('[Backup Controller] Error listing backups:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve backups list', error: err.message });
    }
};

/**
 * Trigger a manual database backup
 */
const triggerManualBackup = async (req, res) => {
    try {
        const result = await createBackup('manual');
        res.json({
            msg: 'Backup created successfully',
            filename: result.filename,
            count: result.count
        });
    } catch (err) {
        console.error('[Backup Controller] Error triggering manual backup:', err.message);
        res.status(500).json({ msg: 'Failed to create backup', error: err.message });
    }
};

/**
 * Restore database from a specific backup file
 */
const restoreFromBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ msg: 'Filename parameter is required' });
        }

        const result = await restoreBackup(filename);
        res.json({
            msg: `Database successfully restored from backup file: ${filename}`,
            count: result.count
        });
    } catch (err) {
        console.error(`[Backup Controller] Error restoring database from ${req.params.filename}:`, err.message);
        res.status(500).json({ msg: 'Failed to restore database from backup', error: err.message });
    }
};

/**
 * Delete a specific backup file
 */
const deleteBackupFile = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ msg: 'Filename parameter is required' });
        }

        deleteBackup(filename);
        res.json({ msg: `Backup file ${filename} deleted successfully` });
    } catch (err) {
        console.error(`[Backup Controller] Error deleting backup file ${req.params.filename}:`, err.message);
        res.status(500).json({ msg: 'Failed to delete backup file', error: err.message });
    }
};

/**
 * Download a backup file
 */
const downloadBackupFile = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ msg: 'Filename parameter is required' });
        }

        // Clean filename to prevent path traversal vulnerability (security best practice)
        const cleanFilename = path.basename(filename);
        const filePath = path.join(BACKUP_DIR, cleanFilename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'Backup file not found' });
        }

        res.download(filePath, cleanFilename, (err) => {
            if (err) {
                console.error('[Backup Controller] Error downloading file:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ msg: 'Error downloading backup file' });
                }
            }
        });
    } catch (err) {
        console.error(`[Backup Controller] Error in download endpoint for ${req.params.filename}:`, err.message);
        res.status(500).json({ msg: 'Failed to download backup file', error: err.message });
    }
};

module.exports = {
    getBackupsList,
    triggerManualBackup,
    restoreFromBackup,
    deleteBackupFile,
    downloadBackupFile
};
