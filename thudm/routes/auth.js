var express = require('express');
var router = express.Router();
const models = require('../models/models');
const User = models.User;

router.get('/login', (req, res, next) => {
    res.send('/auth/login => render login page');
});

router.post('/login', (req, res, next) => {
    var input_id = req.body.input_id;
    var input_pw = req.body.input_pw;

    User.find({id: input_id, password: input_pw}, (err, user) => {
        if (err) return res.json({
            result: 0, 
            message: 'Wrong id or password'
        });

        return res.json({result: 1});
    });
});

router.get('/signup', (req, res, next) => {
    res.send('/auth/signup => render signup page');
});

router.post('/signup', (req, res, next) => {
    var input_id = req.body.input_id;
    var input_pw = req.body.input_pw;
    var input_email = req.body.input_email;

    User.find({id: input_id}, (err, user) => {
        if (err) return res.json({
            result: 0,
            message: 'Id already exists'
        });

        user = new User();
        user.id = input_id;
        user.password = input_pw;
        user.email = input_email;
        user.save((err) => {
            if (err) return res.json({
                result: 0,
                message: 'Signup failed'
            });

            return res.json({result: 1});
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
