const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparePart.controller');

router.get('/', sparePartController.getAllSpareParts);
router.post('/', sparePartController.createSparePart);
router.get('/:id', sparePartController.getSparePart);
router.put('/:id', sparePartController.updateSparePart);
router.delete('/:id', sparePartController.deleteSparePart);

module.exports = router;