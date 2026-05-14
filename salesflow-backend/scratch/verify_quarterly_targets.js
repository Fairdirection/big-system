const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');
const QuarterlyTarget = require('../src/models/quarterly-target.model');
const employeeService = require('../src/services/employee.service');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    // 1. Find a regular Sales agent (excluding TeamLeader and SalesManager)
    const employee = await Employee.findOne({
      department: 'Sales',
      seniorityLevel: { $nin: ['TeamLeader', 'SalesManager'] },
      isActive: true
    });
    if (!employee) {
      console.log('No Sales employee found to verify!');
      return;
    }

    const empId = employee._id;
    const quarterId = 'Q2-2026';
    console.log(`Verifying target logic for employee: ${employee.name} (${employee.code})`);
    console.log(`Baseline Target: ${employee.target}`);

    // 2. Fetch baseline progress (before custom target)
    const baselineProgress = await employeeService.getTargetProgress(empId, quarterId);
    console.log('Baseline Progress calculated successfully.');
    console.log(`  - Full Target: ${baselineProgress.fullTarget}`);
    console.log(`  - Adjusted Target: ${baselineProgress.adjustedTarget}`);

    // 3. Create a custom quarterly target
    const customTargetValue = 750000;
    console.log(`Creating custom target of ${customTargetValue} for ${quarterId}...`);
    
    await QuarterlyTarget.findOneAndUpdate(
      { employeeId: empId, quarterId },
      { target: customTargetValue },
      { upsert: true, new: true }
    );

    // 4. Fetch custom target progress
    const customProgress = await employeeService.getTargetProgress(empId, quarterId);
    console.log('Custom target progress calculated successfully.');
    console.log(`  - Custom Full Target: ${customProgress.fullTarget}`);
    console.log(`  - Custom Adjusted Target: ${customProgress.adjustedTarget}`);

    // Verification check
    if (customProgress.fullTarget === customTargetValue) {
      console.log('✅ Custom target was successfully loaded and used in progress calculation!');
    } else {
      console.log('❌ Error: Progress calculation did not use the custom target!');
    }

    // 5. Delete custom target to test fallback
    console.log('Deleting custom target record to test fallback...');
    await QuarterlyTarget.deleteOne({ employeeId: empId, quarterId });

    const fallbackProgress = await employeeService.getTargetProgress(empId, quarterId);
    console.log('Fallback progress calculated successfully.');
    console.log(`  - Fallback Full Target: ${fallbackProgress.fullTarget}`);

    if (fallbackProgress.fullTarget === employee.target) {
      console.log('✅ Fallback mechanism is working perfectly!');
    } else {
      console.log('❌ Error: Fallback mechanism failed!');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  }

  await mongoose.disconnect();
}

verify().catch(console.error);
