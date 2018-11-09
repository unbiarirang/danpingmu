const express = require('express');
let router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const models = require('../models/models');
const Lottery = models.Lottery;

router.get('/:lottery_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.params.lottery_id;

    Lottery.find({ _id: lottery_id })
        .then(lottery => {
            if (lottery.length === 0)
                throw new errors.NotExistError('No lottery activity exists.');

            return res.send(lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery = new Lottery();
    lottery.activity_id = req.session.activity_id;
    lottery.title = req.body.title;
    lottery.sub_title = req.body.sub_title;
    lottery.winner_num = req.body.winner_num;
    lottery.save()
        .then(() => {
            return res.json({ result: 1 });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

module.exports = router;
