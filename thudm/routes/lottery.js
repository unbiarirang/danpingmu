const express = require('express');
let router = express.Router();
const utils = require('../common/utils');
const errors = require('../common/errors');
const models = require('../models/models');
const Lottery = models.Lottery;

router.get('/:lottery_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.params.lottery_id;

    Lottery.findById(lottery_id)
        .then(lottery => {
            if (!lottery)
                throw new errors.NotExistError('No lottery activity exists.');

            return res.send(lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Draw for winners
router.get('/:lottery_id/draw', (req, res, next) => {
    // FIXME: for test
    //if (!req.session.login)
    //    throw new errors.NotLoggedInError();

    utils.request_random_nums(10, 1, 100)
        .then(data => {
            console.log('random data: ', data);
            res.send(data);
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
