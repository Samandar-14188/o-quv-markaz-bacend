const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT s.*, c.name as course_name,
        (SELECT status FROM payments WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as last_payment_status
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE s.firstname ILIKE $1 OR s.lastname ILIKE $1 OR s.phone ILIKE $1`;
    }

    query += ' ORDER BY s.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as course_name
      FROM students s LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'O\'quvchi topilmadi' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  const { firstname, lastname, phone, course_id, monthly_fee, start_date } = req.body;
  if (!firstname || !lastname || !phone || !course_id || !monthly_fee || !start_date)
    return res.status(400).json({ message: 'Barcha maydonlar kerak' });
  try {
    const result = await pool.query(`
      INSERT INTO students (firstname, lastname, phone, course_id, monthly_fee, start_date)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [firstname, lastname, phone, course_id, monthly_fee, start_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { firstname, lastname, phone, course_id, monthly_fee, start_date, status } = req.body;
  try {
    const result = await pool.query(`
      UPDATE students SET firstname=$1, lastname=$2, phone=$3, course_id=$4,
      monthly_fee=$5, start_date=$6, status=$7 WHERE id=$8 RETURNING *
    `, [firstname, lastname, phone, course_id, monthly_fee, start_date, status || 'active', req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id=$1', [req.params.id]);
    res.json({ message: 'O\'quvchi o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportExcel = async (req, res) => {
  const ExcelJS = require('exceljs');
  try {
    const result = await pool.query(`
      SELECT s.firstname, s.lastname, s.phone, c.name as course,
             s.monthly_fee, s.start_date, s.status
      FROM students s LEFT JOIN courses c ON s.course_id = c.id
    `);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("O'quvchilar");
    ws.columns = [
      { header: 'Ism', key: 'firstname', width: 15 },
      { header: 'Familiya', key: 'lastname', width: 15 },
      { header: 'Telefon', key: 'phone', width: 18 },
      { header: 'Kurs', key: 'course', width: 20 },
      { header: 'Oylik to\'lov', key: 'monthly_fee', width: 15 },
      { header: 'Boshlanish', key: 'start_date', width: 15 },
      { header: 'Holat', key: 'status', width: 12 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    result.rows.forEach(row => ws.addRow(row));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, exportExcel };