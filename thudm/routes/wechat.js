var xmlparser = require('express-xml-bodyparser');
var express = require('express');
var router = express.Router();
var utils = require('../common/utils');
var socketApi = require('../common/socketApi');

// Parse WeChat XML POST request
router.use(xmlparser());

router.post('/', (req, res, next) => {
    console.log(req.query, req.params, req.body);
    console.log('SID: ', req.session.id);
    console.log('session: ', req.session);
    console.log('maxAge: ', req.session.cookie.maxAge);
    let body = req.body.xml;

    let room_id;
    switch (body.msgtype[0]) {
        // User sent a text message
        case 'text':
            room_id = req.session.room_id;
            console.log('Send to room', room_id);
            socketApi.sendNotification(room_id, JSON.stringify({
                "msg_type": 'text',
                "content": body.content[0]
            }));
            break;

        // User sent a image
        case 'image':
            room_id = req.session.room_id;
            console.log('Send to room', room_id);
            socketApi.sendNotification(room_id, JSON.stringify({
                "msg_type": 'image',
                "content": body.picurl[0]
            }));
            break;

        // User entered a specific room
        case 'event':
            if (body.event[0] === 'SCAN')
                room_id = body.eventkey[0];
            else if (body.event[0] === 'subscribe')
                room_id = body.eventkey[0].split('_')[1];

            req.session.room_id = room_id;
            console.log('Entered room', room_id);

            utils.get_user_info(req, body.fromusername[0])
                .then((user_info) => {
                    console.log('User info: ', user_info);
                    req.session.nickname = user_info.nickname;
                    req.session.head_img_url = user_info.headimgurl;
                    req.session.open_id = user_info.openid;
                    req.session.save();
                })
                .catch((err) => {
                    console.log(err);
                    next(err);
                });
            break;
    }

    // Empty response
    res.send("");
});

router.use('/', utils.sign());

module.exports = router;
