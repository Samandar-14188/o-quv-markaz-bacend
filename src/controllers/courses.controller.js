const db = require('../config/db');

const getAll = (req, res) => {
  const courses = db.prepare(`
    SELECT c.*, COUNT(s.id) as student_count
    FROM courses c
    LEFT JOIN students s ON s.course_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(courses);
};

const create = (req, res) => {
  const { name, duration_months, price } = req.body;
  if (!name || !price)
    return res.status(400).json({ message: 'Nom va narx kerak' });

  const result = db.prepare(
    'INSERT INTO courses (name, duration_months, price) VALUES (?, ?, ?)'
  ).run(name, duration_months || 6, price);

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(course);
};

const update = (req, res) => {
  const { name, duration_months, price } = req.body;
  db.prepare(
    'UPDATE courses SET name=?, duration_months=?, price=? WHERE id=?'
  ).run(name, duration_months, price, req.params.id);

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json(course);
};

const remove = (req, res) => {
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ message: 'Kurs o\'chirildi' });
};

module.exports = { getAll, create, update, remove };