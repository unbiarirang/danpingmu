var express = require('express');
var router = express.Router();

function init(app) {
    var user_router = require('./user');
    var admin_router = require('./admin');

    app.use('/u', user_router);
    app.use('/', admin_router);
}

exports.init = init;
