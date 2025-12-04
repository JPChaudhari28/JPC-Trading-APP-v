import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : (req.cookies?.token || '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function signJwt(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
}

