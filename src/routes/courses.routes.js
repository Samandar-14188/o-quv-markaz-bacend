const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/courses.controller');

router.use(auth);
router.get('/', c.getAll);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;