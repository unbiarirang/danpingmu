var xmlparser = require('express-xml-bodyparser');
var express = require('express');
var router = express.Router();
var utils = require('../common/utils');
var socketApi = require('../common/socketApi');

// Parse WeChat XML POST request
router.use(xmlparser());

router.post('/', (req, res, next) => {
    console.log(req.query, req.params, req.body);

    let msg_type = utils.get_wechat_input(req, 'msgtype');
    let tmp_generated_id;
    switch (msg_type) {
        // User sent a text message
        case 'text':
            utils.get_user_info(req)
                .then((user_info) => {
                    let room_id = user_info.room_id; // FIXME: for test
                    //let room_id = 1;
                    let content = utils.get_wechat_input(req, 'content');
                    let nickname = user_info.nickname;
                    let head_img_url = user_info.head_img_url;
                    let room = req.app.get('room_' + room_id);
                    let msg_obj = {
                        "id": room.gen_id(req.app.get('redis')),
                        "type": "text",
                        "content": content,
                        "nickname": nickname,
                        "head_img_url": head_img_url,
                        "review_flag": 0
                    };

                    let rsmq = req.app.get('rsmq');
                    rsmq.sendMessage({
                            qname: room_id,
                            message: JSON.stringify(msg_obj)
                        })
                        .then(data => {
                            console.log("RSMQ data sent", data);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                })
                .catch((err) => { // TODO
                    console.log(err);
                });
            break;

        // User sent an image
        case 'image':
            utils.get_user_info(req)
                .then((user_info) => {
                    //let room_id = user_info.room_id;
                    let room_id = 1;
                    let nickname = user_info.nickname;
                    let head_img_url = user_info.head_img_url;
                    let content = utils.get_wechat_input(req, 'picurl');
                    console.log('Send to room', room_id);
                    socketApi.reviewContent(room_id, JSON.stringify({
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
            let event = utils.get_wechat_input(req, 'event');
            let event_key = utils.get_wechat_input(req, 'eventkey');
            let room_id;

            if (event === 'SCAN')
                room_id = event_key;
            else if (event === 'subscribe')
                room_id = event_key.split('_')[1];

            utils.update_user_info(req, { room_id: room_id });
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
