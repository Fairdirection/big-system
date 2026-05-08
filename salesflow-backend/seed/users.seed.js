const bcrypt = require('bcrypt');
const User = require('../src/models/user.model');

const seedUsers = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    
    // 1. Ensure Adham User
    const adhamEmail = 'adham54732@gmail.com';
    const adhamExists = await User.findOne({ email: adhamEmail });
    if (!adhamExists) {
      const passwordHash = await bcrypt.hash('adham2002', salt);
      await User.create({
        name: 'Adham',
        email: adhamEmail,
        passwordHash,
        role: 'admin'
      });
      console.log(`Seeded user: ${adhamEmail}`);
    }

    // 2. Ensure System Admin
    const adminEmail = 'admin@salesflow.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const adminPasswordHash = await bcrypt.hash('adminpassword123', salt);
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin'
      });
      console.log(`Seeded user: ${adminEmail}`);
    }

    // 3. Ensure Ahmed Zidan User (Full Email)
    const zidanEmail = 'ahmed.zidan@salesflow.com';
    const zidanExists = await User.findOne({ email: zidanEmail });
    if (!zidanExists) {
      const zidanPasswordHash = await bcrypt.hash('zidan1234', salt);
      await User.create({
        name: 'Ahmed Zidan',
        email: zidanEmail,
        passwordHash: zidanPasswordHash,
        role: 'admin'
      });
      console.log(`Seeded user: ${zidanEmail}`);
    }

    // 4. Ensure Ahmed Zidan User (Short Email)
    const zidanShortEmail = 'zidan@salesflow.com';
    const zidanShortExists = await User.findOne({ email: zidanShortEmail });
    if (!zidanShortExists) {
      const zidanPasswordHash = await bcrypt.hash('zidan1234', salt);
      await User.create({
        name: 'Ahmed Zidan',
        email: zidanShortEmail,
        passwordHash: zidanPasswordHash,
        role: 'admin'
      });
      console.log(`Seeded user: ${zidanShortEmail}`);
    }

    console.log('User seeding synchronization complete');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

module.exports = seedUsers;
