const express = require('express');
const router = express.Router();
const processController = require('../controllers/process.controller');

router.get('/', processController.getAllProcesses);
router.post('/', processController.createProcess);
router.get('/:id', processController.getProcess);
router.put('/:id', processController.updateProcess);
router.delete('/:id', processController.deleteProcess);

module.exports = router;