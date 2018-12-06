const express = require('express');
let router = express.Router();
const fs = require('fs');
const assert = require('assert');
const errors = require('../common/errors');
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

router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    createActivity(req)
        .then(act => {
            req.session.activity_id = act._id;

            // Create a fromuser image directory
            fs.mkdir('public/images/fromuser/' + act._id, (res) => { console.log('mkdir'); });
            return res.json({ result: 1 });
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
    act.end_time = req.body.end_time;
    act.list_media_id = req.body.list_media_id;
    return act.save();
}

module.exports = router;
