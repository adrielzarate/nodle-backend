var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    const list = ['item1', 'item2', 'item3'];
    res.json(list);
});

module.exports = router;