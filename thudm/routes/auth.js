const express = require('express');
let router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const models = require('../models/models');
const User = models.User;
const Activity = models.Activity;
const crypto = require('crypto');

router.get('/login', (req, res, next) => {
    console.log('+++req.session:', req.session);
    console.log('+++req.session.id:', req.session.id);
    console.log('+++req.sessionID:', req.sessionID);
    res.render('login');
});

router.post('/login', (req, res, next) => {
    let input_id = req.body.input_id;
    let input_pw = req.body.input_pw;

    User.findOne({ id: input_id })
        .then(user => {
            if (!user)
                throw new errors.NotLoggedInError('Wrong id or password.');

            let salt = user.salt;
            crypto.pbkdf2(input_pw, salt, 10000, 50, 'sha512', (err, key) => {
                if (user.password !== key.toString('base64'))
                    return next(new errors.NotLoggedInError('Wrong id or password.'));

                // Login succeed, Creaste a new admin session
                req.session.login = true;
                req.session.admin_id = input_id;

                res.redirect("../activity/list");
            });
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
        
    User.findOne({ id: input_id })
        .then(user => {
            if (user)
                throw new errors.DuplicatedError('The id already exists');

            let salt = crypto.randomBytes(64);
            console.log('salt_new: ', salt.toString('base64'));
            crypto.pbkdf2(input_pw, salt.toString('base64'), 10000, 50, 'sha512', (err, key) => {
                user = new User();
                user.id = input_id;
                user.password = key.toString('base64');
                user.email = input_email;
                console.log("salt2:", salt.toString('base64'));
                user.salt = salt.toString('base64');
                return user.save();
            });
        })
        .then(() => {
            res.redirect('login');
        })
        .catch(err => {
            console.error(err);
            //res.render('signup', { err: err });
            next(err);
        });
});

router.get('/find', (req, res, next) => {
    res.send('/auth/find => render find id/password page');
});

module.exports = router;
