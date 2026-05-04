const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { 
  createTeamSchema, 
  updateTeamSchema, 
  reassignMembersSchema 
} = require('../validators/team.validator');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamTargetSummary,
  reassignMembers
} = require('../controllers/team.controller');

router.get('/',              getTeams);
router.get('/:id',           getTeam);
router.post('/',             validate(createTeamSchema), createTeam);
router.patch('/:id',         validate(updateTeamSchema), updateTeam);
router.delete('/:id',        deleteTeam);
router.get('/:id/target-summary', getTeamTargetSummary);
router.post('/:id/reassign-members', validate(reassignMembersSchema), reassignMembers);

module.exports = router;
