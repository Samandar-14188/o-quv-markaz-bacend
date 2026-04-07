const cron = require('node-cron');
const { pool } = require('./config/db');
// Har oy 1-sanada soat 00:00 da ishlaydi
cron.schedule('0 0 1 * *', async () => {
  console.log('🕐 Oylik to\'lovlar yaratilmoqda...');
  
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  
  const now = new Date();
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();
  const lastMonth = months[now.getMonth() === 0 ? 11 : now.getMonth() - 1];
  const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  try {
    // O'tgan oy "pending" larni "overdue" ga o'tkazish
    await pool.query(`
      UPDATE payments SET status='overdue'
      WHERE status='pending' AND month=$1 AND year=$2
    `, [lastMonth, lastYear]);

    // Barcha aktiv o'quvchilar uchun yangi oy to'lovlarini yaratish
    const students = await pool.query(
      "SELECT * FROM students WHERE status='active'"
    );

    for (const student of students.rows) {
      // Bu oy uchun to'lov allaqachon bormi?
      const exists = await pool.query(
        "SELECT id FROM payments WHERE student_id=$1 AND month=$2 AND year=$3",
        [student.id, currentMonth, currentYear]
      );

      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO payments (student_id, amount, month, year, status)
          VALUES ($1, $2, $3, $4, 'pending')
        `, [student.id, student.monthly_fee, currentMonth, currentYear]);
      }
    }

    console.log(`✅ ${currentMonth} uchun to'lovlar yaratildi`);
  } catch (err) {
    console.error('Cron xatosi:', err.message);
  }
});

console.log('⏰ Cron job ishga tushdi');