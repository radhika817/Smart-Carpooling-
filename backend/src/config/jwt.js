export const getJwtSecret = () => process.env.JWT_SECRET || 'smartride_fallback_jwt_secret_key';
export const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';
