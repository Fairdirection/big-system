const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response.utils');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);
    
    // Send token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, { user, token });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  res.clearCookie('token');
  return sendSuccess(res, { message: 'Logged out successfully' });
};

const getMe = async (req, res, next) => {
  // User info is attached to req.user by auth middleware
  return sendSuccess(res, req.user);
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    const { avatarUrl, avatarOriginalUrl, avatarCrop } = req.body;
    const User = require('../models/user.model');
    
    const updateData = {};
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
    if (avatarOriginalUrl !== undefined) updateData.avatarOriginalUrl = avatarOriginalUrl || null;
    if (avatarCrop !== undefined) updateData.avatarCrop = avatarCrop || null;
    
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-passwordHash');
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getMe, changePassword, updateAvatar };
