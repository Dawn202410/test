const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.get('/', paymentController.getAllPayments);
router.post('/', paymentController.createPayment);
router.get('/:id', paymentController.getPayment);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;