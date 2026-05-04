const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({
      name: String,
      teamLeaderId: mongoose.Schema.Types.ObjectId,
      memberIds: [mongoose.Schema.Types.ObjectId],
      isActive: { type: Boolean, default: true }
    }));

    const teams = await Team.find({ isActive: true });
    
    for (const team of teams) {
      console.log(`Cleaning team: ${team.name}`);
      
      // 1. Remove leader from memberIds if present
      const originalCount = team.memberIds.length;
      team.memberIds = team.memberIds.filter(id => id && id.toString() !== team.teamLeaderId.toString());
      
      // 2. Remove duplicates
      const uniqueIds = [];
      const seen = new Set();
      for (const id of team.memberIds) {
        if (!seen.has(id.toString())) {
          uniqueIds.push(id);
          seen.add(id.toString());
        }
      }
      team.memberIds = uniqueIds;
      
      if (team.isModified('memberIds')) {
        await team.save();
        console.log(`  Done. Reduced members from ${originalCount} to ${team.memberIds.length}`);
      } else {
        console.log(`  Already clean.`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning teams:', error);
    process.exit(1);
  }
}

cleanupTeams();
