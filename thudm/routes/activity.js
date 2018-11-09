const express = require('express');
let router = express.Router();
const assert = require('assert');
const errors = require('../common/errors');
const models = require('../models/models');
const User = models.Activity;

router.get('/activity/:activity_id', (req, res, next) => {
    let activity_id = req.params.activity_id;

    Activity.find({ _id: activity_id })
        .then(act => {
            if (act.length === 0)
                throw new errors.NotExistError('Wrong activity');

            return res.send(act);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.post('/activity', (req, res, next) => {
    

});

module.exports = router;
