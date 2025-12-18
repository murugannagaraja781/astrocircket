const express = require('express');
const { syncPlayers, getPlayers, getPlayerById, uploadPlayers } = require('../controllers/playerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const apiRouter = express.Router();

apiRouter.post('/sync', syncPlayers);
apiRouter.post('/upload', upload.single('file'), uploadPlayers);
apiRouter.get('/', getPlayers);
apiRouter.get('/:id', getPlayerById);

module.exports = apiRouter;
