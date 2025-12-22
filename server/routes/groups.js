const express = require('express');
const { getGroups, addPlayersToGroup, removePlayerFromGroup, clearGroup } = require('../controllers/groupController');

const apiRouter = express.Router();

apiRouter.get('/', getGroups);
apiRouter.post('/add', addPlayersToGroup);
apiRouter.post('/remove', removePlayerFromGroup);
apiRouter.post('/clear', clearGroup); // Helper to clear teams

module.exports = apiRouter;
