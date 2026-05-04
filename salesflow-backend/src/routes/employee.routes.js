const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { 
  createEmployeeSchema, 
  updateEmployeeSchema, 
  transferTeamSchema 
} = require('../validators/employee.validator');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTeamHistory,
  transferTeam,
  getTargetProgress,
  getSalesDeptEmployees
} = require('../controllers/employee.controller');

router.get('/',              getEmployees);
router.get('/sales-dept',    getSalesDeptEmployees);
router.get('/:id',           getEmployee);
router.post('/',             validate(createEmployeeSchema), createEmployee);
router.patch('/:id',         validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id',        deleteEmployee);
router.get('/:id/team-history',    getTeamHistory);
router.patch('/:id/transfer-team', validate(transferTeamSchema), transferTeam);
router.get('/:id/target-progress', getTargetProgress);

module.exports = router;
