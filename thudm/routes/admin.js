const express = require('express');
const rp = require('request-promise');
const router = express.Router();
const utils = require('../common/utils');
const consts = require('../common/consts');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
const models = require('../models/models');
const Message = models.Message;
const Activity = models.Activity;

const auth_router = require('./auth');
const activity_router = require('./activity');
const vote_router = require('./vote');
const lottery_router = require('./lottery');

router.use('/auth', auth_router);
router.use('/activity', activity_router);
router.use('/vote', vote_router);
router.use('/lottery', lottery_router);

router.get('/', (req, res, next) => {
    console.log(req.session.id);
    return res.render('index');
});

module.exports = router;
