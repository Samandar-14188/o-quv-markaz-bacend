const express = require('express');
const cors = require('cors');
require('dotenv').config();

// DB ni ishga tushirish
require('./config/db');

const app = express();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/students.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/courses', require('./routes/courses.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT} da ishlamoqda`));