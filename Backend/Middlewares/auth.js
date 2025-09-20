

// import jwt from 'jsonwebtoken';

// export function requireAuth(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ error: 'No token provided.' });
//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).json({ error: 'Invalid token.' });
//   }
// }

// middleware/auth.js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  // Allow CORS preflight requests through without auth
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload to request
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    console.error('JWT verification error:', err);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
}
