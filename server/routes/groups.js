const express = require('express');
const { getGroups, addPlayersToGroup, removePlayerFromGroup, clearGroup, createGroup, deleteGroup, updateGroupType } = require('../controllers/groupController');

const apiRouter = express.Router();

apiRouter.get('/', getGroups);
apiRouter.post('/create', createGroup);
apiRouter.delete('/:id', deleteGroup);
apiRouter.put('/update-type/:id', updateGroupType);
apiRouter.post('/add', addPlayersToGroup);
apiRouter.post('/remove', removePlayerFromGroup);
apiRouter.post('/clear', clearGroup); // Helper to clear teams

module.exports = apiRouter;
