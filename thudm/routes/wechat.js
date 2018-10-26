var xmlparser = require('express-xml-bodyparser');
var express = require('express');
var router = express.Router();
var utils = require('../common/utils');
var socketApi = require('../common/socketApi');
var config = require('../config.json');

// Parse WeChat XML POST request
router.use(xmlparser());

router.post('/', (req, res, next) => {
    console.log(req.query, req.params, req.body);
    socketApi.sendNotification(req.body.xml.content[0]);
});

router.use('/', utils.sign(config));

module.exports = router;
