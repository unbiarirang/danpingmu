var xmlparser = require('express-xml-bodyparser');
var express = require('express');
var router = express.Router();
var utils = require('../common/utils');
var socketApi = require('../common/socketApi');

// Parse WeChat XML POST request
router.use(xmlparser());

router.post('/', (req, res, next) => {
    console.log(req.query, req.params, req.body);
    console.log('post req.wsessionID: ', req.wsessionID);
    console.log('post req.session: ', req.session);
    console.log('post maxAge: ', req.session.cookie.maxAge);

    let msg_type = utils.get_input(req, 'msgtype');
    switch (msg_type) {
        // User sent a text message
        case 'text':
            utils.get_sess_info(req)
                .then((sess_info) => {
                    let room_id = sess_info.room_id;
                    let nickname = sess_info.nickname;
                    let head_img_url = sess_info.head_img_url;
                    let content = utils.get_input(req, 'content');
                    console.log('Send to room', room_id);
                    socketApi.sendNotification(room_id, JSON.stringify({
                        "msg_type": 'text',
                        "content": content,
                        "nickname": nickname,
                        "head_img_url": head_img_url
                    }));
                })
                .catch((err) => { // TODO
                    console.log(err);
                });
            break;

        // User sent an image
        case 'image':
            utils.get_sess_info(req)
                .then((sess_info) => {
                    let room_id = sess_info.room_id;
                    let nickname = sess_info.nickname;
                    let head_img_url = sess_info.head_img_url;
                    let content = utils.get_input(req, 'picurl');
                    console.log('Send to room', room_id);
                    socketApi.sendNotification(room_id, JSON.stringify({
                        "msg_type": 'image',
                        "content": content,
                        "nickname": nickname,
                        "head_img_url": head_img_url
                    }));
                })
                .catch((err) => { // TODO
                    console.log(err);
                });
            break;

        // User entered a specific room
        case 'event':
            let event = utils.get_input(req, 'event');
            let event_key = utils.get_input(req, 'eventkey');
            if (event === 'SCAN')
                room_id = eventkey;
            else if (event === 'subscribe')
                room_id = eventkey.split('_')[1];

            req.session.room_id = room_id;
            console.log('Entered room', room_id);

            utils.request_user_info(req)
                .catch((err) => { // TODO
                    console.log(err);
                });
            break;
    }
    // Send empty response
    res.send("");
});

router.use('/', utils.sign());

module.exports = router;
