const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { status, student_id, month } = req.query;
    let query = `
      SELECT p.*, s.firstname, s.lastname, s.phone, c.name as course_name
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { params.push(status); query += ` AND p.status = $${params.length}`; }
    if (student_id) { params.push(student_id); query += ` AND p.student_id = $${params.length}`; }
    if (month) { params.push(month); query += ` AND p.month = $${params.length}`; }

    query += ' ORDER BY p.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  const { student_id, amount, month, year, payment_date, status, note } = req.body;
  if (!student_id || !amount || !month)
    return res.status(400).json({ message: 'student_id, amount, month kerak' });
  try {
    const result = await pool.query(`
      INSERT INTO payments (student_id, amount, month, year, payment_date, status, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [
      student_id, amount, month,
      year || new Date().getFullYear(),
      payment_date || new Date().toISOString().split('T')[0],
      status || 'paid',
      note || ''
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  const { amount, month, year, payment_date, status, note } = req.body;
  try {
    const result = await pool.query(`
      UPDATE payments SET amount=$1, month=$2, year=$3, payment_date=$4, status=$5, note=$6
      WHERE id=$7 RETURNING *
    `, [amount, month, year, payment_date, status, note, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id=$1', [req.params.id]);
    res.json({ message: 'To\'lov o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalStudents, totalIncome, pending, overdue, monthlyIncome] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM students WHERE status='active'"),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='paid'"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status='pending'"),
      pool.query("SELECT COUNT(*) as count FROM payments WHERE status='overdue'"),
      pool.query(`
        SELECT month, year, SUM(amount) as total
        FROM payments WHERE status='paid'
        GROUP BY month, year
        ORDER BY year DESC
        LIMIT 12
      `)
    ]);
    res.json({
      totalStudents: parseInt(totalStudents.rows[0].count),
      totalIncome: parseInt(totalIncome.rows[0].total),
      pendingCount: parseInt(pending.rows[0].count),
      overdueCount: parseInt(overdue.rows[0].count),
      monthlyIncome: monthlyIncome.rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportExcel = async (req, res) => {
  const ExcelJS = require('exceljs');
  try {
    const result = await pool.query(`
      SELECT s.firstname || ' ' || s.lastname as student, c.name as course,
             p.month, p.year, p.amount, p.payment_date, p.status, p.note
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      ORDER BY p.created_at DESC
    `);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("To'lovlar");
    ws.columns = [
      { header: 'O\'quvchi', key: 'student', width: 25 },
      { header: 'Kurs', key: 'course', width: 20 },
      { header: 'Oy', key: 'month', width: 12 },
      { header: 'Yil', key: 'year', width: 10 },
      { header: 'Miqdor', key: 'amount', width: 15 },
      { header: 'Sana', key: 'payment_date', width: 15 },
      { header: 'Holat', key: 'status', width: 12 },
      { header: 'Izoh', key: 'note', width: 20 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    result.rows.forEach(row => ws.addRow(row));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, create, update, remove, getStats, exportExcel };