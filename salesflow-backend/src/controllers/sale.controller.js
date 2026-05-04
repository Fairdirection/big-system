const saleService = require('../services/sale.service');
const { sendSuccess } = require('../utils/response.utils');

const createSale = async (req, res, next) => {
  try {
    const sale = await saleService.createSale(req.body);
    return sendSuccess(res, sale, 201);
  } catch (error) {
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { data, pagination } = await saleService.getSales(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

const getSale = async (req, res, next) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    if (!sale) {
      const err = new Error('Sale not found');
      err.status = 404;
      throw err;
    }
    return sendSuccess(res, sale);
  } catch (error) {
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const sale = await saleService.updateSale(req.params.id, req.body);
    return sendSuccess(res, sale);
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const sale = await saleService.deleteSale(req.params.id);
    return sendSuccess(res, sale);
  } catch (error) {
    next(error);
  }
};

const confirmSale = async (req, res, next) => {
  try {
    const sale = await saleService.confirmSale(req.params.id);
    return sendSuccess(res, sale);
  } catch (error) {
    next(error);
  }
};

const getCommissionPreview = async (req, res, next) => {
  try {
    const preview = await saleService.getCommissionPreview(req.params.id, req.query);
    return sendSuccess(res, preview);
  } catch (error) {
    next(error);
  }
};

const getSalesByQuarter = async (req, res, next) => {
  try {
    req.query.quarterId = req.params.quarterId;
    const { data, pagination } = await saleService.getSales(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSale,
  updateSale,
  deleteSale,
  confirmSale,
  getCommissionPreview,
  getSalesByQuarter
};
