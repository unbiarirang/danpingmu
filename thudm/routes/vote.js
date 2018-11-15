const express = require('express');
let router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const models = require('../models/models');
const Vote = models.Vote;

router.get('/:vote_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let vote_id = req.params.vote_id;

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

router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let vote = new Vote();
    vote.activity_id = req.session.activity_id;
    vote.title = req.body.title;
    vote.sub_title = req.body.sub_title;
    vote.option_num = req.body.option_num;
    vote.options = req.body.options;
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
