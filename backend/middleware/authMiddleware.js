const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');

function authenticateToken(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Token richiesto', code: 'MISSING_TOKEN' });
    }
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      ruolo: decoded.ruolo,
      nome: decoded.nome,
      cognome: decoded.cognome,
      enabled_projects: decoded.enabled_projects || ['dashboard'],
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: e.message || 'Token non valido', code: 'INVALID_TOKEN' });
  }
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato', code: 'NOT_AUTHENTICATED' });
    }
    if (!roles.includes(req.user.ruolo)) {
      return res.status(403).json({
        error: 'Permessi insufficienti',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.ruolo,
      });
    }
    next();
  };
}

/** Admin e tecnico stessi privilegi (come TicketApp). */
function requireAdminOrTecnico(req, res, next) {
  return requireRole(['admin', 'tecnico'])(req, res, next);
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdminOrTecnico,
};
