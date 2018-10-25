var express = require('express');
var router = express.Router();

function init(app) {
    var user_router = require('./user');
    var admin_router = require('./admin');
    var admin_page_router = require('./admin_page');

    app.use('/u', user_router);
    app.use('/a', admin_router);
    app.use('/', admin_page_router);
}

exports.init = init;
