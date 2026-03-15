const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./config/db');

const app = express();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/students.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/courses', require('./routes/courses.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT} da ishlamoqda`));
}).catch(err => {
  console.error('DB ulanish xatosi:', err);
  process.exit(1);
});