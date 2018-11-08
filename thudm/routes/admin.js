const express = require('express');
const rp = require('request-promise');
const router = express.Router();
const models = require('../models/models');
const utils = require('../common/utils');
const errors = require('../common/errors');
const User = models.User;

var auth_router = require('./auth');

router.use('/auth', auth_router);

router.get('/msgList', (req, res, next) => {
    res.render('msgList');
});

router.get('/screen/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;

    let sendData = {};
    sendData.room_id = room_id;

    console.log('screen room_id: ', room_id);
    res.render('screen', sendData);
});

router.get('/qrcode/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;

    console.log('ticket:', req.app.get('ticket' + room_id));
    res.redirect('https://mp.weixin.qq.com/cgi-bin/showqrcode'
        + '?ticket=' + req.app.get('ticket' + room_id));
});

router.get('/ticket/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;

    let sendData = {};

    sendData.expire_seconds = 86400; // 3hours
    sendData.action_name = 'QR_SCENE';
    // scene_id : 1~100000, scene_str
    sendData.action_info = {'scene': {'scene_id': room_id}};

    utils.get_access_token(req)
        .then((access_token) => {
            let options = {
                method: 'POST',
                uri: 'https://api.weixin.qq.com/cgi-bin/qrcode/create' +
                     '?access_token=' + access_token,
                body: sendData,
                json: true
            };
            return rp(options);
        })
        .then((body) => {
            // POST succeeded
            // Error from wechat
            if (body.errcode)
                throw new errors.WeChatResError(body.errmsg);

            req.app.set('ticket' + room_id, body.ticket);
            res.status(200).send('Get ticket OK');
        })
        .catch((err) => {
            // POST failed
            console.log(err);
            next(err);
        });
});

router.get('/', (req, res, next) => {
    console.log(req.session.id);
    res.render('index');
});

module.exports = router;
