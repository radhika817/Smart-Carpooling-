import dotenv from 'dotenv';

dotenv.config();

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET environment variable is missing or empty. Please set JWT_SECRET.');
  }
  return secret;
};

export const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

