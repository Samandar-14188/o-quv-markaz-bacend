const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(s.id) as student_count
      FROM courses c
      LEFT JOIN students s ON s.course_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  const { name, duration_months, price } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'Nom va narx kerak' });
  try {
    const result = await pool.query(
      'INSERT INTO courses (name, duration_months, price) VALUES ($1,$2,$3) RETURNING *',
      [name, duration_months || 6, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { name, duration_months, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE courses SET name=$1, duration_months=$2, price=$3 WHERE id=$4 RETURNING *',
      [name, duration_months, price, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
    res.json({ message: 'Kurs o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, create, update, remove };