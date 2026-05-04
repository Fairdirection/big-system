const teamService = require('../services/team.service');
const { sendSuccess } = require('../utils/response.utils');

const createTeam = async (req, res, next) => {
  try {
    const team = await teamService.createTeam(req.body);
    return sendSuccess(res, team, 201);
  } catch (error) {
    next(error);
  }
};

const getTeams = async (req, res, next) => {
  try {
    const { includePerformance, quarterId } = req.query;
    let teams;
    if (includePerformance === 'true' && quarterId) {
      teams = await teamService.getTeamsWithPerformance(quarterId);
    } else {
      teams = await teamService.getTeams();
    }
    return sendSuccess(res, teams);
  } catch (error) {
    next(error);
  }
};

const getTeam = async (req, res, next) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }
    return sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    return sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const team = await teamService.deleteTeam(req.params.id);
    return sendSuccess(res, team);
  } catch (error) {
    next(error);
  }
};

const getTeamTargetSummary = async (req, res, next) => {
  try {
    const summary = await teamService.getTeamTargetSummary(req.params.id, req.query.quarterId);
    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

const reassignMembers = async (req, res, next) => {
  try {
    const result = await teamService.reassignMembers(req.params.id, req.body);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamTargetSummary,
  reassignMembers
};
