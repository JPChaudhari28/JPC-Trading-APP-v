import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { requireAuth, signJwt } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, bankDetail } = req.body;
    if (!email || !password || !fullName) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, fullName, bankDetail });
    const token = signJwt(user._id.toString());
    return res.status(201).json({ token, user: { id: user._id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt(user._id.toString());
    return res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('email fullName kycVerified bankDetail');
  return res.json({ user });
});

export default router;

