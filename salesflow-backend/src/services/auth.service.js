const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { signToken } = require('../config/jwt');

const login = async (email, password) => {
  console.log(`[AUTH] Attempting login for: ${email}`);
  const user = await User.findOne({ 
    email: email?.toLowerCase(),
    isActive: true 
  });
  console.log(`[AUTH] User search complete. Found: ${!!user}`);

  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  console.log(`[AUTH] Comparing password hashes...`);
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(`[AUTH] Password comparison complete. Match: ${isMatch}`);

  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  console.log(`[AUTH] Signing JWT token...`);
  const token = signToken({ id: user._id, email: user.email, role: user.role });
  console.log(`[AUTH] Token signed successfully.`);
  
  const userObj = user.toObject();
  delete userObj.passwordHash;
  
  return { token, user: userObj };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.status = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  return { success: true, message: 'Password changed successfully' };
};

module.exports = { login, changePassword };
