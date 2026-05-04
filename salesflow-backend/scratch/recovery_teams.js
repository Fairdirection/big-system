const mongoose = require('mongoose');
require('dotenv').config();

async function recovery() {
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

    // 1. Deactivate ALL teams first to be sure
    await Team.updateMany({}, { $set: { isActive: false } });
    
    // 2. Get all teams sorted by creation date (newest first)
    const allTeams = await Team.find({}).sort({ createdAt: -1 });
    
    const activatedLeaders = new Set();
    
    for (const team of allTeams) {
      if (!team.teamLeaderId) continue;
      
      const lId = team.teamLeaderId.toString();
      
      if (!activatedLeaders.has(lId)) {
        console.log(`Activating latest team: ${team.name} (ID: ${team._id}) for leader ${lId}`);
        team.isActive = true;
        await team.save();
        
        // Ensure leader points to this team
        await Employee.findByIdAndUpdate(lId, { $set: { currentTeamId: team._id } });
        
        // Ensure members of this team point to this team
        if (team.memberIds && team.memberIds.length > 0) {
            await Employee.updateMany({ _id: { $in: team.memberIds } }, { $set: { currentTeamId: team._id } });
        }
        
        activatedLeaders.add(lId);
      }
    }
    
    console.log('Recovery complete.');
    process.exit(0);
  } catch (error) {
    console.error('Recovery error:', error);
    process.exit(1);
  }
}

recovery();
