const express = require('express');
let router = express.Router();
const utils = require('../common/utils');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
const models = require('../models/models');
const Lottery = models.Lottery;

router.get('/list', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    Lottery.find({ activity_id: activity_id })
        .then(lotteries => {
            console.log(lotteries);
            return res.send(lotteries);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/detail', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.session.lottery_id;

    Lottery.findById(lottery_id)
        .then(lottery => {
            if (!lottery)
                throw new errors.NotExistError('No lottery activity exists.');

            return res.render('list', lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/create', (req, res, next) =>{
    res.render('create');
});

router.get('/:lottery_id/draw', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.params.lottery_id;
    let sendData = {};

    Lottery.findById(lottery_id)
        .then(lottery => {
            if (!lottery)
                throw new errors.NotExistError('No lottery activity exists.');

            // get all users in the activity
            let users = req.app.get('cache').user_info;
            sendData.users = JSON.stringify([...users].filter(user => user.activity_id === lottery.activity_id));

            let winner_num = lottery.winner_num;
            let max_num = users.size;
            let min_num = 1;

            if (max_num === 0)
                return [];
            if (max_num <= winner_num)
                return Array.from(Array(max_num).keys()).map(e => e + 1);

            return utils.request_random_nums(winner_num, min_num, max_num)
        })
        .then(data => {
            sendData.data = data;
            console.log('sendData: ', sendData);
            res.render('lottery', sendData);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/:lottery_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    req.session.lottery_id = req.params.lottery_id;
    return res.redirect('detail');
});

const createLottery = (req) => {
    let lottery = new Lottery();
    return updateLottery(lottery, req);
}
const updateLottery = (lottery, req) => {
    lottery.activity_id = req.session.activity_id;
    lottery.title = req.body.title;
    lottery.sub_title = req.body.sub_title;
    lottery.winner_num = req.body.winner_num;
    return lottery.save();
}

// Create lottery activity
router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    createLottery(req)
        .then(lottery => {
            return res.send(lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Update lottery activity
router.put('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let room = utils.get_room_info(req, activity_id);

    updateLottery(room.activity, req)
        .then(lottery => {
            return res.send(lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

module.exports = router;
