const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/payments.controller');

router.use(auth);
router.get('/stats', c.getStats);
router.get('/export/excel', c.exportExcel);
router.get('/', c.getAll);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;