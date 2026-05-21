/**
 * fix_phantom_gaps.js
 *
 * Removes phantom null-teamId history records that were created by the
 * leaveDate/joinDate mismatch bug in updateEmployee.
 *
 * A phantom record has:
 *   - teamId = null
 *   - a closed leaveDate (not null)
 *   - duration of 1 day or less
 *   - sits exactly between two real team records with no real gap
 *
 * For each such record we:
 *   1. Delete it.
 *   2. Patch the PREVIOUS team's leaveDate to match the NEXT team's joinDate
 *      so the timeline is seamless.
 *
 * Run once: node scratch/fix_phantom_gaps.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all closed null-team records
  const nullRecords = await EmployeeTeamHistory.find({
    teamId: null,
    leaveDate: { $ne: null }
  }).lean();

  console.log(`Found ${nullRecords.length} closed null-team record(s) to inspect`);

  let fixed = 0;

  for (const rec of nullRecords) {
    const gapMs   = new Date(rec.leaveDate) - new Date(rec.joinDate);
    const gapDays = gapMs / (1000 * 60 * 60 * 24);

    if (gapDays > 1) {
      console.log(`  Skipping ${rec._id} — gap is ${gapDays.toFixed(1)} days (legitimate)`);
      continue;
    }

    // Find the team record immediately before this gap
    const prevRecord = await EmployeeTeamHistory.findOne({
      employeeId: rec.employeeId,
      teamId: { $ne: null },
      leaveDate: rec.joinDate
    });

    // Find the team record immediately after this gap
    const nextRecord = await EmployeeTeamHistory.findOne({
      employeeId: rec.employeeId,
      teamId: { $ne: null },
      joinDate: rec.leaveDate
    });

    if (!prevRecord || !nextRecord) {
      console.log(`  Skipping ${rec._id} — could not find surrounding team records`);
      continue;
    }

    console.log(`  Fixing employee ${rec.employeeId}:`);
    console.log(`    Delete null-team record ${rec._id} (${rec.joinDate} → ${rec.leaveDate})`);
    console.log(`    Patch prev record ${prevRecord._id} leaveDate: ${prevRecord.leaveDate} → ${nextRecord.joinDate}`);

    // Remove the ghost record
    await EmployeeTeamHistory.deleteOne({ _id: rec._id });

    // Stitch prev record's leaveDate to next record's joinDate
    prevRecord.leaveDate = nextRecord.joinDate;
    await prevRecord.save();

    fixed++;
  }

  console.log(`\nDone — fixed ${fixed} phantom gap(s)`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
