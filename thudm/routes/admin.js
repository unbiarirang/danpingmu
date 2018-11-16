const express = require('express');
const rp = require('request-promise');
const router = express.Router();
const models = require('../models/models');
const utils = require('../common/utils');
const errors = require('../common/errors');

const auth_router = require('./auth');
const activity_router = require('./activity');
const vote_router = require('./vote');
const lottery_router = require('./lottery');

router.use('/auth', auth_router);
router.use('/activity', activity_router);
router.use('/vote', vote_router);
router.use('/lottery', lottery_router);

router.get('/msglist/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;
    res.redirect('/msglist/' + room_id + '/page/' + 1);
});

router.get('/msglist/:room_id/page/:page_id', (req, res, next) => {
    let room_id = req.params.room_id;
    let page_id = req.params.page_id;

    let sendData = {};
    sendData.room_id = room_id;

    res.render('msglist', sendData);
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
            res.redirect('http://123.206.96.15/QRCODE/1');
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
