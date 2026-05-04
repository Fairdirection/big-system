const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { createClientSchema, updateClientSchema } = require('../validators/client.validator');
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientSales
} = require('../controllers/client.controller');

router.get('/',      getClients);
router.get('/:id',   getClient);
router.post('/',     validate(createClientSchema), createClient);
router.get('/:id/sales', getClientSales);
router.patch('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
