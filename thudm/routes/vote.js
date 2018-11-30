const express = require('express');
let router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
const models = require('../models/models');
const Vote = models.Vote;

// Admin get vote info
router.get('/:vote_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    const vote_id = req.params.vote_id;

    Vote.findById(vote_id)
        .then(vote => {
            if (!vote)
                throw new errors.NotExistError('No voting Activity exists.');

            return res.send(vote);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Admin get vote result
router.get('/:vote_id/result', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    const vote_id = req.params.vote_id;
    const redis = req.app.get('redis');
    const key = 'vote_' + req.params.vote_id;
    let sendData = {};

    redis.hgetallAsync(key)
        .then(data => {
            console.log('data: ', data);
            sendData.result = data;
        })
        .then(data => {
            return Vote.findById(vote_id)
                .then(vote => {
                    if (!vote)
                        throw new errors.NotExistError('No voting Activity exists.');

                    return vote;
                });
        })
        .then(vote => {
            sendData.options = vote.options;
            sendData.pic_urls = vote.pic_urls;
            res.send(sendData);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// User get vote information
// FIXME: 
router.get('/:vote_id/user', (req, res, next) => {
    let vote_id = req.params.vote_id;

    Vote.findById(vote_id)
        .then(vote => {
            if (!vote)
                throw new errors.NotExistError('No voting Activity exists.');

            console.log('vote: ', vote);

            return res.render('vote', vote);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// User vote for one option
router.get('/:vote_id/votefor/:option_id', (req, res, next) => {
    const redis = req.app.get('redis');
    //const open_id = req.query.get('open_id'); // FIXME: front should send open_id query string
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc';
    const vote_id = req.params.vote_id;
    const option_id = req.params.option_id;
    console.log(vote_id, option_id);

    redis.hgetAsync('voteuser_' + vote_id, open_id)
        .then(data => {
            console.log('data: ', data);
            // Duplicate voting
            if (data)
                throw new errors.DuplicatedError('You have already voted.');

            return redis.hsetAsync('voteuser_' + vote_id, open_id, 1);
        })
        .then(data => {
            console.log('data: ', data);
            return redis.hincrbyAsync('vote_' + vote_id, option_id, 1)
        })
        .then(data => {
            console.log('data: ', data);
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Admin create vote activity
router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let vote = new Vote();
    //vote.activity_id = req.session.activity_id;
    vote.activity_id = 1 // FIXME: for test
    vote.title = req.body.title;
    vote.sub_title = req.body.sub_title;
    vote.option_num = req.body.option_num;
    vote.options = req.body.options;
    vote.pic_urls = req.body.pic_urls;
    vote.start_time = new Date(req.body.start_time);
    vote.end_time = new Date(req.body.end_time);
    vote.save()
        .then(() => {
            return res.json({ result: 1 });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

module.exports = router;
