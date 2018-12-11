const express = require('express');
const rp = require('request-promise');
const promise = require('bluebird');
const router = express.Router();
const config = require('../config');
const utils = require('../common/utils');
const consts = require('../common/consts');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
const models = require('../models/models');
const Message = models.Message;
const Activity = models.Activity;

const auth_router = require('./auth');
const activity_router = require('./activity');
const vote_router = require('./vote');
const lottery_router = require('./lottery');

router.use('/auth', auth_router);
router.use('/activity', activity_router);
router.use('/vote', vote_router);
router.use('/lottery', lottery_router);

router.get('/activity-list', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let admin_id = req.session.admin_id;

    Activity.find({ admin_id: admin_id })
        .then(activities => {
            return res.send(activities);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/msglist/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;
    res.redirect('/msglist/' + room_id + '/page/1');
});

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
            const request_min_id = consts.MSG_PER_PAGE_NUM * (page_id - 1) + 1;
            const request_max_id = consts.MSG_PER_PAGE_NUM * page_id;
            let totalrecv = attr.totalrecv;
            let totalsent = attr.totalsent;

            // Pop messages before reqest min id
            while(totalrecv < request_min_id - 1) {
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
            for (let i = 0; i < consts.MSG_PER_PAGE_NUM; i++) {
                let msg_id = request_min_id + i;

                // Message not exist for the msg_id
                if (msg_id > totalsent)
                    break;

                // Requested message was already in Mongodb
                if (msg_id <= totalrecv) {
                    console.log('from mongodb', msg_id);
                    ret_promises.push(new Promise((resolve, reject) => {
                            Message.findOne({ activity_id: room_id, id: msg_id })
                                .then(msg => {
                                    console.log('Get from mongodb');
                                    if (!msg)
                                        console.error(new errors.NotExistError("Message not exists. msg_id: " + msg_id));

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
                    console.log('from redis', msg_id);
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
        .then(msg_list => {
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

//some additional html
router.get('/msglist', (req, res, next) => {
    res.render('msglist');
});

router.get('/activity-list', (req, res, next) => {
    res.render('activity-list');
});

router.get('/create-activity', (req, res, next) =>{
    res.render('create-activity');
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
            console.error(err);
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
    let ticket = req.query.ticket;

    res.redirect('https://mp.weixin.qq.com/cgi-bin/showqrcode'
        + '?ticket=' + ticket);
});

router.get('/ticket/:room_id', (req, res, next) => {
    let room_id = req.params.room_id;
    console.log('ticket room_id: ', room_id);

    let sendData = {};

    sendData.expire_seconds = consts.QRCODE_EXPIRE_SEC;
    sendData.action_name = 'QR_STR_SCENE';
    // QR_SCENE: scene_id (1~100000) QR_STR_SCENE: scene_str
    sendData.action_info = {'scene': {'scene_str': room_id}};

    utils.get_access_token(req)
        .then(access_token => {
            let options = {
                method: 'POST',
                uri: 'https://api.weixin.qq.com/cgi-bin/qrcode/create' +
                     '?access_token=' + access_token,
                body: sendData,
                json: true
            };
            return rp(options);
        })
        .then(body => {
            // Error from wechat
            if (body.errcode)
                throw new errors.WeChatResError(body.errmsg);

            res.redirect('http://' + config.SERVER_IP + '/qrcode/' + room_id
                          + '?ticket=' + body.ticket);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/', (req, res, next) => {
    console.log(req.session.id);
    res.render('index');
    return Promise.resolve(res);
});

module.exports = router;
