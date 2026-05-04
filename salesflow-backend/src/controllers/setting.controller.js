const Setting = require('../models/setting.model');
const { sendSuccess } = require('../utils/response.utils');

const getSettingsByType = async (req, res, next) => {
  try {
    const type = req.params.type || req.query.type;
    const filter = { isActive: true };
    if (type) filter.type = type;
    
    const settings = await Setting.find(filter).sort({ sortOrder: 1, label: 1 });
    return sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

const createSetting = async (req, res, next) => {
  try {
    const setting = await Setting.create(req.body);
    return sendSuccess(res, setting, 201);
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return sendSuccess(res, setting);
  } catch (error) {
    next(error);
  }
};

const deleteSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findById(req.params.id);
    if (!setting) throw new Error('Setting not found');
    if (setting.isDefault) throw new Error('Cannot delete default setting');
    
    setting.isActive = false;
    await setting.save();
    return sendSuccess(res, { message: 'Setting deactivated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettingsByType,
  createSetting,
  updateSetting,
  deleteSetting
};
