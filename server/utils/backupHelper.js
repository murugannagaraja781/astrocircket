const fs = require('fs');
const path = require('path');
const Player = require('../models/Player');

const BACKUP_DIR = path.join(__dirname, '../backups');
const CLIENT_PLAYER_JSON = path.join(__dirname, '../../client/src/data/player.json');
const MAX_BACKUPS = 15;

// Ensure backups directory exists
const ensureBackupDir = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
};

/**
 * Clean player objects for client sync
 */
const cleanForClient = (players) => {
    return players.map(p => {
        const { __v, _id, ...rest } = p;
        return rest;
    });
};

/**
 * Rotate older backups to keep disk space usage clean
 */
const rotateBackups = () => {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('players_backup_') && f.endsWith('.json'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => a.time - b.time); // Oldest first

    if (files.length > MAX_BACKUPS) {
        const toDeleteCount = files.length - MAX_BACKUPS;
        console.log(`[Backup System] Found ${files.length} backups. Deleting ${toDeleteCount} oldest backups.`);
        for (let i = 0; i < toDeleteCount; i++) {
            try {
                fs.unlinkSync(path.join(BACKUP_DIR, files[i].name));
                console.log(`[Backup System] Deleted old backup file: ${files[i].name}`);
            } catch (err) {
                console.error(`[Backup System] Failed to delete backup file ${files[i].name}:`, err.message);
            }
        }
    }
};

/**
 * Create a new backup file
 * @param {string} trigger - e.g., 'manual', 'auto_add', 'auto_delete'
 */
const createBackup = async (trigger = 'manual') => {
    try {
        ensureBackupDir();

        // 1. Fetch players from MongoDB
        const players = await Player.find({}).lean();
        console.log(`[Backup System] Creating backup. Total players: ${players.length}`);

        // 2. Format timestamp for filename: YYYY-MM-DD_HH-mm-ss
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

        const filename = `players_backup_${timestamp}_${trigger}.json`;
        const filePath = path.join(BACKUP_DIR, filename);

        // 3. Write complete DB dump backup
        fs.writeFileSync(filePath, JSON.stringify(players, null, 2), 'utf-8');
        console.log(`[Backup System] Backup file created: ${filename}`);

        // 4. Update the primary client-side JSON data source (cleaned of MongoDB _id and __v)
        const clientDataDir = path.dirname(CLIENT_PLAYER_JSON);
        if (fs.existsSync(clientDataDir)) {
            const cleanedPlayers = cleanForClient(players);
            fs.writeFileSync(CLIENT_PLAYER_JSON, JSON.stringify(cleanedPlayers, null, 2), 'utf-8');
            console.log(`[Backup System] Synced client data source at: ${CLIENT_PLAYER_JSON}`);
        } else {
            console.warn(`[Backup System] Client data directory not found, skipping client/src/data/player.json update`);
        }

        // 5. Clean up old backups if limit exceeded
        rotateBackups();

        return { success: true, filename, count: players.length };
    } catch (err) {
        console.error('[Backup System] Error creating backup:', err.message);
        throw err;
    }
};

/**
 * List all available backups
 */
const listBackups = () => {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('players_backup_') && f.endsWith('.json'))
        .map(f => {
            const filePath = path.join(BACKUP_DIR, f);
            const stats = fs.statSync(filePath);
            
            // Extract trigger name from format: players_backup_YYYY-MM-DD_HH-mm-ss_<trigger>.json
            // We split by '_' and grab everything after the timestamp
            let trigger = 'unknown';
            const nameWithoutExt = f.replace('.json', '');
            const parts = nameWithoutExt.split('_');
            if (parts.length >= 5) {
                // parts are: ['players', 'backup', 'YYYY-MM-DD', 'HH-mm-ss', 'trigger_name']
                trigger = parts.slice(4).join('_');
            }

            return {
                filename: f,
                sizeBytes: stats.size,
                createdAt: stats.mtime,
                trigger
            };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first

    return files;
};

/**
 * Restore database from a backup file
 * @param {string} filename 
 */
const restoreBackup = async (filename) => {
    try {
        ensureBackupDir();
        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error('Backup file does not exist');
        }

        // 1. Read and parse file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const players = JSON.parse(fileContent);

        if (!Array.isArray(players)) {
            throw new Error('Invalid backup file structure: expected array of players');
        }

        // 2. Clear current Player collection
        const deleteRes = await Player.deleteMany({});
        console.log(`[Backup System] Deleted ${deleteRes.deletedCount} existing players for restore`);

        // 3. Clean players array of _id and __v before bulk inserting (mongoose will generate new ObjectIds)
        // Mongoose insertMany works great this way
        const cleanedPlayers = players.map(p => {
            const { _id, __v, ...rest } = p;
            return rest;
        });

        // 4. Bulk insert players
        const insertRes = await Player.insertMany(cleanedPlayers);
        console.log(`[Backup System] Restored ${insertRes.length} players successfully from ${filename}`);

        // 5. Update client player JSON source
        const clientDataDir = path.dirname(CLIENT_PLAYER_JSON);
        if (fs.existsSync(clientDataDir)) {
            const cleanedForClientData = cleanForClient(cleanedPlayers);
            fs.writeFileSync(CLIENT_PLAYER_JSON, JSON.stringify(cleanedForClientData, null, 2), 'utf-8');
            console.log(`[Backup System] Restored & updated client player.json`);
        }

        return { success: true, count: insertRes.length };
    } catch (err) {
        console.error(`[Backup System] Error restoring from backup ${filename}:`, err.message);
        throw err;
    }
};

/**
 * Delete a backup file
 * @param {string} filename 
 */
const deleteBackup = (filename) => {
    ensureBackupDir();
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error('Backup file does not exist');
    }
    fs.unlinkSync(filePath);
    console.log(`[Backup System] Backup file deleted: ${filename}`);
    return { success: true };
};

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    deleteBackup,
    BACKUP_DIR
};
