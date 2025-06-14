const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');

router.get('/', financeController.getAllFinances);
router.post('/', financeController.createFinance);
router.get('/:id', financeController.getFinance);
router.put('/:id', financeController.updateFinance);
router.delete('/:id', financeController.deleteFinance);

module.exports = router;