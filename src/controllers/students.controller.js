const db = require('../config/db');

const getAll = (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT s.*, c.name as course_name,
      (SELECT status FROM payments WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as last_payment_status
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.id
  `;
  const params = [];

  if (search) {
    query += ` WHERE s.firstname LIKE ? OR s.lastname LIKE ? OR s.phone LIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.created_at DESC';
  const students = db.prepare(query).all(...params);
  res.json(students);
};

const getOne = (req, res) => {
  const student = db.prepare(`
    SELECT s.*, c.name as course_name
    FROM students s LEFT JOIN courses c ON s.course_id = c.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!student) return res.status(404).json({ message: 'O\'quvchi topilmadi' });
  res.json(student);
};

const create = (req, res) => {
  const { firstname, lastname, phone, course_id, monthly_fee, start_date } = req.body;
  if (!firstname || !lastname || !phone || !course_id || !monthly_fee || !start_date)
    return res.status(400).json({ message: 'Barcha maydonlar kerak' });

  const result = db.prepare(`
    INSERT INTO students (firstname, lastname, phone, course_id, monthly_fee, start_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(firstname, lastname, phone, course_id, monthly_fee, start_date);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(student);
};

const update = (req, res) => {
  const { firstname, lastname, phone, course_id, monthly_fee, start_date, status } = req.body;
  db.prepare(`
    UPDATE students SET firstname=?, lastname=?, phone=?, course_id=?,
    monthly_fee=?, start_date=?, status=? WHERE id=?
  `).run(firstname, lastname, phone, course_id, monthly_fee, start_date, status || 'active', req.params.id);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  res.json(student);
};

const remove = (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ message: 'O\'quvchi o\'chirildi' });
};

const exportExcel = (req, res) => {
  const ExcelJS = require('exceljs');
  const students = db.prepare(`
    SELECT s.firstname, s.lastname, s.phone, c.name as course,
           s.monthly_fee, s.start_date, s.status
    FROM students s LEFT JOIN courses c ON s.course_id = c.id
  `).all();

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
  students.forEach(row => ws.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
  wb.xlsx.write(res).then(() => res.end());
};

module.exports = { getAll, getOne, create, update, remove, exportExcel };