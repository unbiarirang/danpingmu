"use strict"
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.send('Admin page. respond with a resourece');
});

module.exports = router;
