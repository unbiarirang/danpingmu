var express = require('express');
var router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const models = require('../models/models');
const User = models.User;

router.get('/login', (req, res, next) => {
    res.render('login');
});

router.post('/login', (req, res, next) => {
    var input_id = req.body.input_id;
    var input_pw = req.body.input_pw;

    return User.find({id: input_id, password: input_pw})
        .then(user => {
            if (user.length === 0)
                throw new errors.NotExistError('Wrong id or password');

            return res.json({result: 1});
        })
        .catch(err => {
            console.error(err);
            return res.json({
                result: 0,
                code: err.code,
                message: err.message
            });
        });
});

router.get('/signup', (req, res, next) => {
    res.render('signup');
});

router.post('/signup', (req, res, next) => {
    var input_id = req.body.input_id;
    var input_pw = req.body.input_pw;
    var input_email = req.body.input_email;
        
    return User.find({id: input_id})
        .then(user => {
            if (user.length !== 0)
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
            return res.json({
                result: 0,
                code: err.code,
                message: err.message
            });
        });
});

router.get('/find', (req, res, next) => {
    res.send('/auth/find => render find id/password page');
});

router.get('/', (req, res, next) => {
    res.send('/auth');
});

module.exports = router;
