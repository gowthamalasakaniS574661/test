const express = require('express');
const router = express.Router();

router.use('/matching', require('./matching'));

module.exports = router;
