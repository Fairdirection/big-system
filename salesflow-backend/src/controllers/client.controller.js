const clientService = require('../services/client.service');
const { sendSuccess } = require('../utils/response.utils');

const createClient = async (req, res, next) => {
  try {
    const client = await clientService.createClient(req.body);
    return sendSuccess(res, client, 201);
  } catch (error) {
    next(error);
  }
};

const getClients = async (req, res, next) => {
  try {
    const { data, pagination } = await clientService.getClients(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

const getClient = async (req, res, next) => {
  try {
    const client = await clientService.getClientById(req.params.id);
    if (!client) {
      const err = new Error('Client not found');
      err.status = 404;
      throw err;
    }
    return sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await clientService.updateClient(req.params.id, req.body);
    return sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const client = await clientService.deleteClient(req.params.id);
    return sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
};

const getClientSales = async (req, res, next) => {
  try {
    const saleService = require('../services/sale.service');
    req.query.clientId = req.params.id;
    const { data, pagination } = await saleService.getSales(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientSales
};
