const express = require('express');
const router = express.Router();
const { 
  getSettingsByType, 
  createSetting, 
  updateSetting, 
  deleteSetting 
} = require('../controllers/setting.controller');

router.get('/',      getSettingsByType);
router.get('/:type', getSettingsByType);
router.post('/',     createSetting);
router.patch('/:id', updateSetting);
router.delete('/:id', deleteSetting);

module.exports = router;
