var xmlparser = require('express-xml-bodyparser');
var express = require('express');
var router = express.Router();
var utils = require('../common/utils');
var socketApi = require('../common/socketApi');

// FIXME
session = {};

// Parse WeChat XML POST request
router.use(xmlparser());

router.post('/', (req, res, next) => {
    console.log(req.query, req.params, req.body);
    let body = req.body.xml;

    let room_id;
    switch (body.msgtype[0]) {
        case 'text':
            room_id = session[body.fromusername[0]];
            console.log('Send to room', room_id);
            socketApi.sendNotification(room_id, JSON.stringify({
                "msg_type": body.msgtype[0],
                "content": body.content[0]
            }));
            break;

        case 'event':
            if (body.event[0] === 'SCAN')
                room_id = body.eventkey[0];
            else if (body.event[0] === 'subscribe')
                room_id = body.eventkey[0].split('_')[1];
            session[body.fromusername[0]] = room_id;
            console.log('Entered room', room_id);
            break;
    }

    // Empty response
    res.send("");
});

router.use('/', utils.sign());

module.exports = router;
