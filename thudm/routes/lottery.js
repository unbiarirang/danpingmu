const express = require('express');
let router = express.Router();
const utils = require('../common/utils');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
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

// Draw for winners // FIXME: temporary
router.get('/:lottery_id/draw', (req, res, next) => {
    // FIXME: for test
    //if (!req.session.login)
    //    throw new errors.NotLoggedInError();

    let sendData = {};
    let users = req.app.get('cache');
    sendData.users = JSON.stringify([...users]);

    let winner_num = 1;
    let min_num = 1;
    let max_num = users.size;
    utils.request_random_nums(winner_num, 0, max_num)
        .then(data => {
            sendData.data = data;
            console.log('sendData: ', sendData);
            socketApi.displayMessage(1, sendData);
            res.render('lottery',sendData);
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
    //lottery.activity_id = req.session.activity_id;
    lottery.activity_id = 1; //FIXME: for test
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
