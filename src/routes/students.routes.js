const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/students.controller');

router.use(auth);
router.get('/export/excel', c.exportExcel);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;