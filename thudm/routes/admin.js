const express = require('express');
const rp = require('request-promise');
const promise = require('bluebird');
const router = express.Router();
const utils = require('../common/utils');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
const models = require('../models/models');
const Message = models.Message;

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
    res.redirect('/msglist/' + room_id + '/page/1');
});

let NUM_MSG_PER_PAGE = 15;
router.get('/msglist/:room_id/page/:page_id', (req, res, next) => {
    let rsmq = req.app.get('rsmq');
    let room_id = req.params.room_id;
    let page_id = req.params.page_id;

    let promise_chain = Promise.resolve();
    let ret_promises = [];
    let not_ret_promises = [];

    promise_chain = promise_chain.then(() => {
            return rsmq.getQueueAttributes({ qname: room_id });
        })
        .then(attr => {
            console.log('attr: ', attr);
            const request_min_id = NUM_MSG_PER_PAGE * (page_id - 1);
            const request_max_id = NUM_MSG_PER_PAGE * page_id;
            let totalrecv = attr.totalrecv;
            let totalsent = attr.totalsent;

            // Pop messages before reqest min id
            while(totalrecv < request_min_id) {
                not_ret_promises.push(new Promise((resolve, reject) => {
                        rsmq.popMessage({ qname: room_id })
                            .then(data => {
                                console.log("RSMQ pop data");
                                let msg_obj = JSON.parse(data.message);

                                let msg = new Message(msg_obj);
                                msg.save();
                                console.log("Msg was stored in Mongodb");
                                return resolve(msg_obj);
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    })
                );

                totalrecv += 1;
            }

            // Retrieve request messages
            for (let i = 0; i < NUM_MSG_PER_PAGE; i++) {
                let msg_id = request_min_id + i;

                // Message not exist for the msg_id
                if (msg_id >= totalsent)
                    break;

                // Requested message was already in Mongodb
                if (msg_id < totalrecv) {
                    console.log('msg_id, totalsent', msg_id, totalsent);
                    ret_promises.push(new Promise((resolve, reject) => {
                            Message.findOne({ id: msg_id })
                                .then(msg => {
                                    console.log('Get from mongodb');
                                    if (!msg)
                                        throw new errors.NotExistError("Message not exists.");

                                    return resolve(msg);
                                })
                                .catch(err => {
                                    console.log(err);
                                });
                        })
                    );
                }

                // Pop message from redis queue and store it in Mongodb
                else if (msg_id <= totalsent) {
                    console.log('msg_id, totalrecv', msg_id, totalrecv);
                    ret_promises.push(new Promise((resolve, reject) => {
                            rsmq.popMessage({ qname: room_id })
                                .then(data => {
                                    console.log("RSMQ pop data");
                                    let msg_obj = JSON.parse(data.message);

                                    let msg = new Message(msg_obj);
                                    msg.save();
                                    console.log("Msg was stored in Mongodb");
                                    return resolve(msg_obj);
                                })
                                .catch(err => {
                                    console.log(err);
                                });
                        })
                    );

                    totalrecv += 1;
                }
            }
        });

    promise_chain = promise_chain
        .then(() => {
            return Promise
                .all(not_ret_promises);
        })
        .then(() => {
            return Promise
                .all(ret_promises);
        })
        .then((msg_list) => {
            console.log(msg_list);
            let sendData = {};
            sendData.msg_list = msg_list;
            sendData.room_id = room_id;

            res.render('msglist', sendData);
        })
        .catch(err => {
            console.log(err);
        });

    return promise_chain;
});

router.get('/screen/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;
    let rsmq = req.app.get('rsmq');

    // FIXME: for test. create queue in create activity
    rsmq.createQueue({ qname: room_id })
        .then(done => {
            console.log("QUEUE created");
        })
        .catch(err => {
            console.error("QUEUE already exists");
        })
        .finally(() => {
            let sendData = {};
            sendData.room_id = room_id;

            console.log('screen room_id: ', room_id);
            res.render('screen', sendData);
        });
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
    // scene_id 1~100000, scene_str
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
    return Promise.resolve(res);
});

module.exports = router;
