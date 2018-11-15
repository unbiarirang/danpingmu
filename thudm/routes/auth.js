const express = require('express');
let router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const models = require('../models/models');
const User = models.User;

router.get('/login', (req, res, next) => {
    console.log('+++req.session:', req.session);
    console.log('+++req.session.id:', req.session.id);
    console.log('+++req.sessionID:', req.sessionID);
    res.render('login');
});

router.post('/login', (req, res, next) => {
    let input_id = req.body.input_id;
    let input_pw = req.body.input_pw;

    User.findOne({id: input_id, password: input_pw})
        .then(user => {
            if (!user)
                throw new errors.NotExistError('Wrong id or password');

            console.log('login success!');
            req.session.login = true;
            req.session.admin_id = input_id;
            return res.json({result: 1});
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/signup', (req, res, next) => {
    console.log('+++req.session:', req.session);
    console.log('+++req.session.id:', req.session.id);
    res.render('signup');
});

router.post('/signup', (req, res, next) => {
    let input_id = req.body.input_id;
    let input_pw = req.body.input_pw;
    let input_email = req.body.input_email;
        
    User.findOne({id: input_id})
        .then(user => {
            if (!user)
                throw new errors.DuplicatedError('The id already exists');

            user = new User();
            user.id = input_id;
            user.password = input_pw;
            user.email = input_email;
            return user.save();
        })
        .then(() => {
            return res.json({result: 1});
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/find', (req, res, next) => {
    res.send('/auth/find => render find id/password page');
});

router.get('/', (req, res, next) => {
    res.send('/auth');
});

module.exports = router;
