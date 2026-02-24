const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'paradiso-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    ruolo: user.ruolo,
    nome: user.nome,
    cognome: user.cognome,
    enabled_projects: user.enabled_projects || ['dashboard'],
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw new Error('Token scaduto');
    if (e.name === 'JsonWebTokenError') throw new Error('Token non valido');
    throw e;
  }
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.type !== 'refresh') throw new Error('Token non è un refresh token');
  return decoded;
}

function extractTokenFromHeader(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function generateLoginResponse(user) {
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  const enabledProjects = Array.isArray(user.enabled_projects)
    ? user.enabled_projects
    : (user.enabled_projects ? JSON.parse(user.enabled_projects) : ['dashboard']);
  return {
    success: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      ruolo: user.ruolo,
      nome: user.nome,
      cognome: user.cognome,
      enabled_projects: enabledProjects,
    },
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generateLoginResponse,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
