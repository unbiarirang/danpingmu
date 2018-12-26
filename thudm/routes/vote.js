const express = require('express');
let router = express.Router();
const assert = require('assert');
const fs = require('fs-extra');
const errors = require('../common/errors');
const utils = require('../common/utils');
const models = require('../models/models');
const Vote = models.Vote;

router.get('/list', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    Vote.find({ activity_id: activity_id })
        .then(votes => {
            return res.render('vote/list', { items: votes });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/detail', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    const vote_id = req.session.vote_id;
    Vote.findById(vote_id)
        .then(vote => {
            if (!vote)
                throw new errors.NotExistError('No voting Activity exists.');

            return res.render('vote/detail', { items: vote });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/create', (req, res, next) =>{
    res.render('vote/create');
});


// Admin get vote result
router.get('/result', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    const activity_id = req.session.activity_id;
    const vote_id = req.session.vote_id;
    const redis = req.app.get('redis');
    const key = 'vote_' + vote_id;
    let sendData = {};
    redis.hgetallAsync(key)
        .then(data => {
            sendData.result = data;
        })
        .then(() => {
            return Vote.findById(vote_id)
                .then(vote => {
                    if (!vote)
                        throw new errors.NotExistError('No voting Activity exists.');
                    
                    sendData.activity_id = vote.activity_id;
                    sendData.title= vote.title;
                    sendData.options = vote.options;
                    sendData.pic_urls = vote.pic_urls;
                    return res.render('result', { 'candidate': sendData });
                });
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

    req.session.vote_id = req.params.vote_id;
    return res.redirect('/vote/result');
});

// User get vote information
router.get('/:vote_id/user', (req, res, next) => {
    let vote_id = req.params.vote_id;

    Vote.findById(vote_id)
        .then(vote => {
            if (!vote || vote.status !== 'ONGOING')
                throw new errors.NotExistError('No voting Activity exists.');
            console.log(vote);
            return res.render('vote', vote);
       })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// User vote for one option
router.post('/:vote_id/votefor/:option_id', (req, res, next) => {
    const redis = req.app.get('redis');
    const open_id = req.query.open_id; // FIXME: front should send open_id query string
    //const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc';
    const vote_id = req.params.vote_id;
    const option_id = req.params.option_id;

    redis.hgetAsync('voteuser_' + vote_id, open_id)
        .then(data => {
            // Check duplicate voting
            if (data)
                throw new errors.DuplicatedError('You have already voted.');

            return redis.hsetAsync('voteuser_' + vote_id, open_id, 1);
        })

        .then(data => {
            return redis.hincrbyAsync('vote_' + vote_id, option_id, 1)
        })
        .then(data => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

const upload_candidate = utils.get_multer('candidate');
router.post('/upload/candidate', upload_candidate.single('candidate_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let path = req.file.path
    path = path.slice(path.indexOf('/images'));

    return res.send(path);
});

// Admin get vote info
router.get('/:vote_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    req.session.vote_id = req.params.vote_id;
    return res.redirect('detail');
});

router.post('/:vote_id/start', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let vote_id = req.params.vote_id;

    Vote.findById(vote_id)
        .then(vote => {
            if (!vote)
                throw new errors.NotExistError('No voting Activity exists.');

            vote.status = 'ONGOING';
            vote.save();
        })
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.post('/:vote_id/finish', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;
    let vote_id = req.params.vote_id;

    Vote.findById(vote_id)
        .then(vote => {
            if (!vote)
                throw new errors.NotExistError('No voting Activity exists.');

            vote.status = 'OVER';
            vote.save();
        })
        .then(() => {
            // Remove directory
            const dir_name = 'public/images/activity/' + activity_id + '/' + vote_id + '*';
            fs.removeAsync(dir_name)
                .then(() => { console.log('rmdir'); });

            req.session.vote_id = null;
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

const createVote = (req) => {
    let vote = new Vote();
    return updateVote(vote, req);
}
const updateVote = (vote, req) => {
    vote.activity_id = req.session.activity_id;
    vote.title = req.body.title;
    vote.sub_title = req.body.sub_title;
    vote.option_num = req.body.option_num;
    vote.options = req.body.options;
    vote.pic_urls = req.body.pic_urls;
    return vote.save();
}

// Create vote activity
router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();
    console.log(req.title);
    createVote(req)
        .then(vote => {
            req.session.vote_id = vote._id;
            return res.send(vote);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Update vote activity
router.put('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let vote_id = req.session.vote_id;

    Vote.findById(vote_id)
        .then(vote => {
            if (!vote)
                throw new errors.NotExistError('No voting Activity exists.');

            return updateVote(vote, req);
        })
        .then(vote => {
            return res.send(vote);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

module.exports = router;
