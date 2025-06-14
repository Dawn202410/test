const express = require('express');
const router = express.Router();
const { getAllProcesses, createProcess, getProcess, updateProcess, deleteProcess } = require('../controllers/process.controller');

router.post('/', createProcess);
router.get('/', getAllProcesses);

module.exports = router;