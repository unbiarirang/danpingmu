const express = require('express');
let router = express.Router();
const fs = require('fs');
require('bluebird').promisifyAll(fs);
const assert = require('assert');
const multer = require('multer');
const errors = require('../common/errors');
const utils = require('../common/utils');
const consts = require('../common/consts');
const models = require('../models/models');
const Activity = models.Activity;

router.get('/:activity_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.params.activity_id;
    req.session.activity_id = activity_id;

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

const createActivity = (req) => {
    let act = new Activity();
    act.admin_id = req.session.admin_id;
    act.title = req.body.title;
    act.sub_title = req.body.sub_title;
    act.bullet_color_num = req.body.bullet_color_num;
    act.bullet_colors = req.body.bullet_colors;
    act.banned_words_url = req.body.banned_words_url;
    act.bg_img_url = req.body.bg_img_url;
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
                    return res.json({ result: 1 });
                });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/:activity_id/blacklist/user', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;

    let room = utils.get_room_info(req, room_id);
    let blacklist = room.activity.blacklist_user;

    res.send(blacklist);
});

router.put('/:activity_id/blacklist/user', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;
    let blocked_id = req.body.blocked_id;

    let room = utils.get_room_info(req, room_id);
    let blacklist = room.activity.blacklist_user;

    if (blocked_id)
        blacklist.push(blocked_id);

    room.activity.save();
    res.send(blacklist);
});

router.delete('/:activity_id/blacklist/user', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;
    let blocked_id = req.body.blocked_id;

    let room = utils.get_room_info(req, room_id);
    let blacklist = room.activity.blacklist_user;
    let index = blacklist.indexOf(blocked_id);
    if (index > -1)
        blacklist.splice(index, 1);

    room.activity.save();
    res.send(blacklist);
});

router.get('/:activity_id/blacklist/word', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;

    let room = utils.get_room_info(req, room_id);
    let blacklist = room.activity.blacklist_word;

    res.send(blacklist);
});

router.put('/:activity_id/blacklist/word', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;
    let blocked_word = req.body.blocked_word;

    let room = utils.get_room_info(req, room_id);
    let blacklist = room.activity.blacklist_word;
    blacklist.push(blocked_word);
    room.activity.save();

    res.send(blacklist);
});

router.delete('/:activity_id/blacklist/word', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;
    let blocked_word = req.body.blocked_word;

    let room = utils.get_room_info(req, room_id);
    let blacklist = room.activity.blacklist_word;
    let index = blacklist.indexOf(blocked_word);
    if (index > -1)
        blacklist.splice(index, 1);

    room.activity.save();
    res.send(blacklist);
});

let storage_list = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/activity/' + req.params.activity_id);
    },
    limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
    filename: function (req, file, cb) {
        cb(null, 'list.' + file.mimetype.split('/')[1]);
    }
});
let storage_bg = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/activity/' + req.params.activity_id);
    },
    limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
    filename: function (req, file, cb) {
        cb(null, 'bg.' + file.mimetype.split('/')[1]);
    }
});
const upload_list = multer({ storage: storage_list });
const upload_bg = multer({ storage: storage_bg });

router.post('/:activity_id/upload/list', upload_list.single('list_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let room_id = req.params.activity_id;

    return utils.upload_list_image(req, req.file.path)
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.post('/:activity_id/upload/bg', upload_bg.single('bg_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    return res.send(req.file.path);
});

module.exports = router;
