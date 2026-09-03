const express = require('express');
const {
    syncPlayers,
    getPlayers,
    getPlayerById,
    uploadPlayers,
    updatePlayer,
    addPlayer,
    deletePlayer,
    deleteAllPlayers,
    syncLiveMatchSquad,
    getReviewRequiredPlayers,
    resolvePlayerReview,
    getLiveMatches
} = require('../controllers/playerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const apiRouter = express.Router();

apiRouter.post('/sync', syncPlayers);
apiRouter.post('/upload', upload.single('file'), uploadPlayers);
apiRouter.post('/add', upload.single('image'), addPlayer);
apiRouter.post('/delete-all', deleteAllPlayers); // Delete all players with password
apiRouter.post('/sync-live-squad', syncLiveMatchSquad);
apiRouter.get('/review-list', getReviewRequiredPlayers);
apiRouter.post('/resolve-review/:id', resolvePlayerReview);
apiRouter.get('/live-matches', getLiveMatches);
apiRouter.get('/', getPlayers);
apiRouter.get('/:id', getPlayerById);
apiRouter.put('/:id', upload.single('image'), updatePlayer);
apiRouter.delete('/:id', deletePlayer);

module.exports = apiRouter;
