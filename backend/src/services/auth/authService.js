import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'smartride_fallback_jwt_secret_key';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() }
  );
};

export const registerUser = async (data) => {
  const { name, email, password, phone, organization, role, preferences } = data;

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password with bcrypt (cost factor = 12)
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const safeRole = role === 'admin' ? 'passenger' : role || 'passenger';

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? phone.trim() : '',
    organization: organization ? organization.trim() : '',
    role: safeRole,
    preferences: preferences || {
      smoking: false,
      music: true,
      petFriendly: false,
      quietRide: false,
    },
  });

  const token = generateToken(user);
  return { user: user.toJSON(), token };
};

export const loginUser = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.isSuspended) {
    const reason = user.suspendedReason ? `: ${user.suspendedReason}` : '';
    const error = new Error(`Your account has been suspended by an administrator${reason}`);
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return { user: user.toJSON(), token };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user.toJSON();
};
