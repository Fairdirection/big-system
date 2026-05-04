const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/response.utils');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return sendSuccess(res, employee, 201);
  } catch (error) {
    next(error);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const { data, pagination } = await employeeService.getEmployees(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.status = 404;
      throw err;
    }
    return sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    return sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);
    return sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
};

const getTeamHistory = async (req, res, next) => {
  try {
    const history = await employeeService.getTeamHistory(req.params.id);
    return sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

const transferTeam = async (req, res, next) => {
  try {
    const employee = await employeeService.transferTeam(req.params.id, req.body);
    return sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
};

const getTargetProgress = async (req, res, next) => {
  try {
    const progress = await employeeService.getTargetProgress(req.params.id, req.query.quarterId);
    return sendSuccess(res, progress);
  } catch (error) {
    next(error);
  }
};

const getSalesDeptEmployees = async (req, res, next) => {
  try {
    const employees = await employeeService.getSalesDeptEmployees();
    return sendSuccess(res, employees);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getTeamHistory,
  transferTeam,
  getTargetProgress,
  getSalesDeptEmployees
};
