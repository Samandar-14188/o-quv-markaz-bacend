const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/login
const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email va parol kerak' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user)
    return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch)
    return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });

  const { accessToken, refreshToken } = generateTokens(user);
  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

// POST /api/auth/refresh
const refresh = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: 'Refresh token kerak' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(401).json({ message: 'Refresh token yaroqsiz' });
  }
};

module.exports = { login, refresh };