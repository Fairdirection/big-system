const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { createSaleSchema, updateSaleSchema } = require('../validators/sale.validator');
const {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  confirmSale,
  getCommissionPreview,
  getSalesByQuarter
} = require('../controllers/sale.controller');

router.get('/',      getSales);
router.get('/:id',   getSale);
router.post('/',     validate(createSaleSchema), createSale);
router.get('/quarter/:quarterId', getSalesByQuarter);
router.get('/:id/commission-preview', getCommissionPreview);
router.post('/:id/confirm', confirmSale);
router.patch('/:id', validate(updateSaleSchema), updateSale);
router.delete('/:id', deleteSale);

module.exports = router;
