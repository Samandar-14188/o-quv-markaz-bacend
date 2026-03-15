const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'teacher',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      duration_months INTEGER DEFAULT 6,
      price INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(100) NOT NULL,
      lastname VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      course_id INTEGER REFERENCES courses(id),
      monthly_fee INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      month VARCHAR(20) NOT NULL,
      year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
      payment_date TEXT,
      status VARCHAR(20) DEFAULT 'paid',
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const adminRes = await pool.query("SELECT id FROM users WHERE email='admin@oquv.uz'");
  if (adminRes.rows.length === 0) {
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)",
      ['Admin', 'admin@oquv.uz', '$2b$10$jGndR3pcoxGu9zFrA6ImaOhlTvnxaZp5XdZkSlghbU9ji/oOuRmGi', 'admin']
    );
  }

  const courseRes = await pool.query("SELECT id FROM courses LIMIT 1");
  if (courseRes.rows.length === 0) {
    await pool.query("INSERT INTO courses (name, duration_months, price) VALUES ($1,$2,$3)", ['Python', 6, 500000]);
    await pool.query("INSERT INTO courses (name, duration_months, price) VALUES ($1,$2,$3)", ['Web (Frontend)', 8, 600000]);
    await pool.query("INSERT INTO courses (name, duration_months, price) VALUES ($1,$2,$3)", ['Flutter', 7, 550000]);
    await pool.query("INSERT INTO courses (name, duration_months, price) VALUES ($1,$2,$3)", ['Backend (Node.js)', 8, 650000]);
  }

  console.log('✅ PostgreSQL bazaga ulandi');
};

module.exports = { pool, initDB };