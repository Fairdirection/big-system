const Client = require('../models/client.model');
const { generateCode } = require('../utils/code-generator');
const { paginate } = require('../utils/pagination.utils');

const createClient = async (data) => {
  const code = await generateCode(Client, 'code', 'CLT');
  return await Client.create({ ...data, code });
};

const getClients = async (query) => {
  const { search, isActive, page, limit } = query;
  const filter = { isActive: true };
  if (isActive !== undefined) {
    if (isActive === 'all') {
      delete filter.isActive;
    } else {
      filter.isActive = isActive === 'true';
    }
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  return await paginate(Client, filter, { page, limit });
};

const getClientById = async (id) => {
  return await Client.findById(id);
};

const updateClient = async (id, data) => {
  return await Client.findByIdAndUpdate(id, data, { new: true });
};

const deleteClient = async (id) => {
  return await Client.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient
};
