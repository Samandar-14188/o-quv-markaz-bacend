const db = require('../config/db');

const getAll = (req, res) => {
  const { status, student_id, month } = req.query;
  let query = `
    SELECT p.*, s.firstname, s.lastname, s.phone, c.name as course_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN courses c ON s.course_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (student_id) { query += ' AND p.student_id = ?'; params.push(student_id); }
  if (month) { query += ' AND p.month = ?'; params.push(month); }

  query += ' ORDER BY p.created_at DESC';
  const payments = db.prepare(query).all(...params);
  res.json(payments);
};

const create = (req, res) => {
  const { student_id, amount, month, year, payment_date, status, note } = req.body;
  if (!student_id || !amount || !month)
    return res.status(400).json({ message: 'student_id, amount, month kerak' });

  const result = db.prepare(`
    INSERT INTO payments (student_id, amount, month, year, payment_date, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    student_id, amount, month,
    year || new Date().getFullYear(),
    payment_date || new Date().toISOString().split('T')[0],
    status || 'paid',
    note || ''
  );

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(payment);
};

const update = (req, res) => {
  const { amount, month, year, payment_date, status, note } = req.body;
  db.prepare(`
    UPDATE payments SET amount=?, month=?, year=?, payment_date=?, status=?, note=?
    WHERE id=?
  `).run(amount, month, year, payment_date, status, note, req.params.id);

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  res.json(payment);
};

const remove = (req, res) => {
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ message: 'To\'lov o\'chirildi' });
};

const getStats = (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status='active'").get();
  const totalIncome = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='paid'").get();
  const pending = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status='pending'").get();
  const overdue = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status='overdue'").get();
  const monthlyIncome = db.prepare(`
    SELECT month, year, SUM(amount) as total
    FROM payments WHERE status='paid'
    GROUP BY month, year
    ORDER BY year DESC, created_at DESC
    LIMIT 12
  `).all();

  res.json({
    totalStudents: totalStudents.count,
    totalIncome: totalIncome.total,
    pendingCount: pending.count,
    overdueCount: overdue.count,
    monthlyIncome
  });
};

const exportExcel = (req, res) => {
  const ExcelJS = require('exceljs');
  const payments = db.prepare(`
    SELECT s.firstname || ' ' || s.lastname as student, c.name as course,
           p.month, p.year, p.amount, p.payment_date, p.status, p.note
    FROM payments p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN courses c ON s.course_id = c.id
    ORDER BY p.created_at DESC
  `).all();

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
  payments.forEach(row => ws.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
  wb.xlsx.write(res).then(() => res.end());
};

module.exports = { getAll, create, update, remove, getStats, exportExcel };