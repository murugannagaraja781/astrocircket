const express = require('express');
const { syncPlayers, getPlayers, getPlayerById, uploadPlayers, updatePlayer, addPlayer, deletePlayer } = require('../controllers/playerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const apiRouter = express.Router();

apiRouter.post('/sync', syncPlayers);
apiRouter.post('/upload', upload.single('file'), uploadPlayers);
apiRouter.post('/add', upload.single('image'), addPlayer);
apiRouter.get('/', getPlayers);
apiRouter.get('/:id', getPlayerById);
apiRouter.put('/:id', upload.single('image'), updatePlayer);
apiRouter.delete('/:id', deletePlayer);

module.exports = apiRouter;
