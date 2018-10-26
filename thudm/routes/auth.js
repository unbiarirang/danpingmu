var express = require('express');
var router = express.Router();
const models = require('../models/models');
const User = models.User;
var crypto = require('crypto');

router.get('/login', (req, res, next) => {
    res.render('login');
});

router.post('/login', (req, res, next) => {
    var input_id = req.body.input_id;
    var input_pw = req.body.input_pw;
    console.log(input_id);
    console.log(input_pw);

    User.find({id: input_id, password: input_pw}, (err, user) => {
        if (err) return res.render('login',{warning: 'Wrong id or password'});
        return res.render('../');
    });
});

router.get('/signup', (req, res, next) => {
    res.render('signup');
});

router.post('/signup', (req, res, next) => {
    var input_id = req.body.input_id;
    var input_pw = req.body.input_pw;
    var salt = req.body.salt;
    var input_email = req.body.input_email;
        
    User.find({id: input_id}, (err, user) => {
        if (err) return res.render('signup',{warning: 'Id already exists'});

        user = new User();
        user.id = input_id;
        user.salt = salt;//要保存salt值，登录时才能比较密码
        user.password = input_pw;
        user.email = input_email;
        user.save((err) => {
            if (err) return res.render('signup',{warning: 'Signup failed'});

            return res.render('../');
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
