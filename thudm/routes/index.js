var express = require('express');
var router = express.Router();

function init(app) {
    var wechat_router = require('./wechat');
    var admin_router = require('./admin');

    app.use('/wechat', wechat_router);
    app.use('/', admin_router);
}

exports.init = init;
