var express = require('express');
var router = express.Router();
const models = require('../models/models');
const User = models.User;

var auth_router = require('./auth');

router.use('/auth', auth_router);

router.get('/msgList', (req, res, next) => {
    res.render('msgList');
});

router.get('/screen', (req, res, next) => {
    res.render('screen');
});

router.get('/', (req, res, next) => {
    res.render('index');
});

module.exports = router;
