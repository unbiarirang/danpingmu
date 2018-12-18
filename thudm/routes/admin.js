const express = require('express');
const rp = require('request-promise');
const router = express.Router();
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

router.get('/', (req, res, next) => {
    console.log(req.session.id);
    return res.render('index');
});

router.get('/screen', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    Activity.findById(activity_id)
        .then(activity => {
            if (!activity)
                throw new errors.NotExistError('Activity does not exist.');

            let sendData = {};
            sendData.activity_id = activity_id;

            console.log('screen activity_id: ', activity_id);
            res.render('screen', sendData);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/msglist', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    res.redirect('msglist/page/1');
});

router.get('/msglist/page/:page_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();
    let rsmq = req.app.get('rsmq');
    let activity_id = req.session.activity_id;
    let page_id = req.params.page_id;

    let promise_chain = Promise.resolve();
    let ret_promises = [];
    let not_ret_promises = [];

    let totalsent = null;

    promise_chain = promise_chain.then(() => {
            return rsmq.getQueueAttributes({ qname: activity_id });
        })
        .then(attr => {
            console.log('attr: ', attr);
            const request_min_id = consts.MSG_PER_PAGE_NUM * (page_id - 1) + 1;
            const request_max_id = consts.MSG_PER_PAGE_NUM * page_id;
            let totalrecv = attr.totalrecv;
            totalsent = attr.totalsent;

            // Pop messages before reqest min id
            while(totalrecv < request_min_id - 1
                  && totalrecv < totalsent) {
                not_ret_promises.push(new Promise((resolve, reject) => {
                        rsmq.popMessage({ qname: activity_id })
                            .then(data => {
                                console.log("RSMQ pop data");
                                let msg_obj = JSON.parse(data.message);

                                let msg = new Message(msg_obj);
                                msg.save();
                                console.log("Msg was stored in Mongodb");
                                return resolve(msg_obj);
                            })
                            .catch(err => {
                                console.error(err);
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
                            Message.findOne({ activity_id: activity_id, id: msg_id })
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
                            rsmq.popMessage({ qname: activity_id })
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
            sendData.msg_total_num = totalsent;
            sendData.activity_id = activity_id;

            res.render('msglist', sendData);
        })
        .catch(err => {
            console.log(err);
        });

    return promise_chain;
});

router.get('/blacklist', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let room = utils.get_room_info(req, activity_id);

    res.render('blacklist', {
        blacklist_user: room.activity.blacklist_user,
        blacklist_word: room.activity.blacklist_word
    });
});

router.put('/blacklist', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let blocked_id = req.body.blocked_id;
    let blocked_word = req.body.blocked_word;

    let room = utils.get_room_info(req, activity_id);

    if (blocked_id)
        room.activity.blacklist_user.push(blocked_id);
    if (blocked_word)
        room.activity.blacklist_word.push(blocked_word);
    room.activity.save();

    res.send({
        blacklist_user: room.activity.blacklist_user,
        blacklist_word: room.activity.blacklist_word
    });
});

router.delete('/blacklist', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let blocked_id = req.body.blocked_id;
    let blocked_word = req.body.blocked_word;

    let room = utils.get_room_info(req, activity_id);

    let blacklist_user = room.activity.blacklist_user;
    let blacklist_word = room.activity.blacklist_word;

    let index = blacklist_user.indexOf(blocked_id);
    if (index >= 0)
        blacklist_user.splice(index, 1);
    index = blacklist_word.indexOf(blocked_word);
    if (index >= 0)
        blacklist_word.splice(index, 1);

    room.activity.save();
    res.send({
        blacklist_user: room.activity.blacklist_user,
        blacklist_word: room.activity.blacklist_word
    });
});

router.get('/ticket', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    console.log('ticket activity_id: ', activity_id);

    let sendData = {};

    sendData.expire_seconds = consts.QRCODE_EXPIRE_SEC;
    sendData.action_name = 'QR_STR_SCENE';
    // QR_SCENE: scene_id (1~100000) QR_STR_SCENE: scene_str
    sendData.action_info = { 'scene': { 'scene_str': activity_id } };

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

            res.redirect(utils.get_url_ip('/qrcode?ticket='
                         + body.ticket));
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/qrcode', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let ticket = req.query.ticket;

    res.redirect('https://mp.weixin.qq.com/cgi-bin/showqrcode'
        + '?ticket=' + ticket);
});

module.exports = router;
