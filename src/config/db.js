const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../oquv_markaz.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'teacher',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration_months INTEGER DEFAULT 6,
    price INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    phone TEXT NOT NULL,
    course_id INTEGER REFERENCES courses(id),
    monthly_fee INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    month TEXT NOT NULL,
    year INTEGER DEFAULT (strftime('%Y', 'now')),
    payment_date TEXT,
    status TEXT DEFAULT 'paid',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Default admin (parol: admin123)
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@oquv.uz');
if (!adminExists) {
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`)
    .run('Admin', 'admin@oquv.uz', '$2b$10$jGndR3pcoxGu9zFrA6ImaOhlTvnxaZp5XdZkSlghbU9ji/oOuRmGi', 'admin');
}

// Default kurslar
const courseExists = db.prepare('SELECT id FROM courses LIMIT 1').get();
if (!courseExists) {
  const ins = db.prepare('INSERT INTO courses (name, duration_months, price) VALUES (?, ?, ?)');
  ins.run('Python', 6, 500000);
  ins.run('Web (Frontend)', 8, 600000);
  ins.run('Flutter', 7, 550000);
  ins.run('Backend (Node.js)', 8, 650000);
}

console.log('✅ SQLite bazaga ulandi');
module.exports = db;