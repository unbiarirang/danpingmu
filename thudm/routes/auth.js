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
    var input_confirm = req.body.input_confirm;
    var input_email = req.body.input_email;

    if(!(input_confirm == input_pw))
        return res.render('signup',{warning:'Please confirm your password!'})
    
    if(input_pw.length < 7){
        return res.render('signup',{warning: 'The length of password should be longer than 7'})
    }

    var reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$");
    if (!reg.test(input_email)) {
        return res.render('signup',{warning: 'Please confirm your Email!'})
    }
          
    User.find({id: input_id}, (err, user) => {
        if (err) return res.render('signup',{warning: 'Id already exists'});

        var buf = crypto.randomBytes(64);
        crypto.pbkdf2(input_pw, buf.toString('base64'), 10000, 50, 'sha512', (err,user)=>{
            if (err)
                throw err;
            input_pw = key.toString('base64');
        })
        
        user = new User();
        user.id = input_id;
        user.salt = buf;//要保存salt值，登录时才能比较密码
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
