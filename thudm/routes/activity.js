const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fs = require('fs');
const promise = require('bluebird');
promise.promisifyAll(fs);
const assert = require('assert');
const multer = require('multer');
const errors = require('../common/errors');
const utils = require('../common/utils');
const consts = require('../common/consts');
const models = require('../models/models');
const Activity = models.Activity;
const Message = models.Message;

router.get('/list', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let admin_id = req.session.admin_id;

    Activity.find({ admin_id: admin_id })
        .then(activities => {
            return res.render('list', { items: activities });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/detail', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    Activity.findById(activity_id)
        .then(act => {
            if (!act)
                throw new errors.NotExistError('Activity does not exist.');

            return res.send(act);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/create', (req, res, next) =>{
    res.render('create');
});

router.get('/screen', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let rsmq = req.app.get('rsmq');

    // FIXME: for test. create queue in create activity
    rsmq.createQueue({ qname: activity_id })
        .then(done => {
            console.log("QUEUE created");
        })
        .catch(err => {
            console.error(err);
        })
        .finally(() => {
            let sendData = {};
            sendData.activity_id = activity_id;

            console.log('screen activity_id: ', activity_id);
            res.render('screen', sendData);
        });
});

const createActivity = (req) => {
    let act = new Activity();
    act.admin_id = req.session.admin_id;
    act.title = req.body.title;
    act.sub_title = req.body.sub_title;
    act.bullet_color_num = req.body.bullet_color_num;
    act.bullet_colors = req.body.bullet_colors;
    act.banned_words_url = req.body.banned_words_url;
    act.bg_img_url = req.body.bg_img_url;
router.get('/screen', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let rsmq = req.app.get('rsmq');

    // FIXME: for test. create queue in create activity
    rsmq.createQueue({ qname: activity_id })
        .then(done => {
            console.log("QUEUE created");
        })
        .catch(err => {
            console.error(err);
        })
        .finally(() => {
            let sendData = {};
            sendData.activity_id = activity_id;

            console.log('screen activity_id: ', activity_id);
            res.render('screen', sendData);
        });
});

    act.list_media_id = req.body.list_media_id;
    return act.save();
}
router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    createActivity(req)
        .then(act => {
            req.session.activity_id = act._id.toString();
            utils.load_activity(req, req.session.activity_id);

            // Create the activity's image directory
            // mkdir public/images/activity/:activity_id/fromuser
            fs.mkdirAsync('public/images/activity/' + act._id)
                .then(() => {
                    return fs.mkdirAsync('public/images/activity/' + act._id + '/fromuser');
                })
                .then(() => {
                    console.log('mkdir');
                    return res.redirect('detail');
                });
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
    res.redirect('page/1');
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

    promise_chain = promise_chain.then(() => {
            return rsmq.getQueueAttributes({ qname: activity_id });
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
            sendData.activity_id = activity_id;

            res.render('msglist', sendData);
        })
        .catch(err => {
            console.log(err);
        });

    return promise_chain;
});

router.get('/blacklist/user', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    let room = utils.get_room_info(req, activity_id);
    let blacklist = room.activity.blacklist_user;

    res.send(blacklist);
});

router.put('/blacklist/user', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let blocked_id = req.body.blocked_id;

    let room = utils.get_room_info(req, activity_id);
    let blacklist = room.activity.blacklist_user;

    if (blocked_id)
        blacklist.push(blocked_id);

    room.activity.save();
    res.send(blacklist);
});

router.delete('/blacklist/user', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let blocked_id = req.body.blocked_id;

    let room = utils.get_room_info(req, activity_id);
    let blacklist = room.activity.blacklist_user;
    let index = blacklist.indexOf(blocked_id);

    if (index > -1)
        blacklist.splice(index, 1);

    room.activity.save();
    res.send(blacklist);
});

router.get('/blacklist/word', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    let room = utils.get_room_info(req, activity_id);
    let blacklist = room.activity.blacklist_word;

    res.send(blacklist);
});

router.put('/blacklist/word', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let blocked_word = req.body.blocked_word;

    let room = utils.get_room_info(req, activity_id);
    let blacklist = room.activity.blacklist_word;
    blacklist.push(blocked_word);
    room.activity.save();

    res.send(blacklist);
});

router.delete('/blacklist/word', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let blocked_word = req.body.blocked_word;

    let room = utils.get_room_info(req, activity_id);
    let blacklist = room.activity.blacklist_word;
    let index = blacklist.indexOf(blocked_word);
    if (index > -1)
        blacklist.splice(index, 1);

    room.activity.save();
    res.send(blacklist);
});

let storage_list = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/activity/' + req.session.activity_id);
    },
    limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
    filename: function (req, file, cb) {
        cb(null, 'list.' + file.mimetype.split('/')[1]);
    }
});
let storage_bg = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/activity/' + req.session.activity_id);
    },
    limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
    filename: function (req, file, cb) {
        cb(null, 'bg.' + file.mimetype.split('/')[1]);
    }
});
const upload_list = multer({ storage: storage_list });
const upload_bg = multer({ storage: storage_bg });

router.post('/upload/list', upload_list.single('list_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    return utils.upload_list_image(req, req.file.path)
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.post('/upload/bg', upload_bg.single('bg_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    return res.send(req.file.path);
});

router.get('/qrcode', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let ticket = req.query.ticket;

    res.redirect('https://mp.weixin.qq.com/cgi-bin/showqrcode'
        + '?ticket=' + ticket);
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
    sendData.action_info = {'scene': {'scene_str': activity_id}};

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

            res.redirect(utils.get_url('/activity/qrcode/'
                         + '?ticket=' + body.ticket));
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/:activity_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    req.session.activity_id = req.params.activity_id;
    return res.redirect('detail');
});

module.exports = router;
