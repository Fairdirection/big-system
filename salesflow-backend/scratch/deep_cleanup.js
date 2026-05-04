const mongoose = require('mongoose');
require('dotenv').config();

async function deepCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({
      name: String,
      teamLeaderId: mongoose.Schema.Types.ObjectId,
      memberIds: [mongoose.Schema.Types.ObjectId],
      isActive: { type: Boolean, default: true }
    }, { timestamps: true }));

    const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({
      currentTeamId: mongoose.Schema.Types.ObjectId
    }));

    const activeTeams = await Team.find({ isActive: true }).sort({ createdAt: -1 });
    
    const seenLeaders = new Set();
    
    for (const team of activeTeams) {
      const lId = team.teamLeaderId.toString();
      
      if (seenLeaders.has(lId)) {
        console.log(`Deactivating duplicate team: ${team.name} (ID: ${team._id}) for Leader ID: ${lId}`);
        team.isActive = false;
        await team.save();
        
        // Also release members from this specific team if they point to it
        await Employee.updateMany({ currentTeamId: team._id }, { $set: { currentTeamId: null } });
      } else {
        console.log(`Keeping primary team: ${team.name} (ID: ${team._id})`);
        seenLeaders.add(lId);
        
        // Ensure the leader's currentTeamId points to this team
        await Employee.findByIdAndUpdate(team.teamLeaderId, { $set: { currentTeamId: team._id } });
        
        // Clean up member list (remove leader from members)
        const originalCount = team.memberIds.length;
        team.memberIds = team.memberIds.filter(id => id && id.toString() !== lId);
        if (team.isModified('memberIds')) {
          await team.save();
          console.log(`  Cleaned members for ${team.name}.`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Deep cleanup error:', error);
    process.exit(1);
  }
}

deepCleanup();
