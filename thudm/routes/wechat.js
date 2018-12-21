const xmlparser = require('express-xml-bodyparser');
const express = require('express');
const router = express.Router();
const utils = require('../common/utils');
const socketApi = require('../common/socketApi');

// Parse WeChat XML POST request
router.use(xmlparser());

router.post('/', (req, res, next) => {
    console.log(req.query, req.params, req.body);

    let msg_type = utils.get_wechat_input(req, 'msgtype');
    let tmp_generated_id;
    switch (msg_type) {
        // User sent a text message
        case 'text':
            // Send empty response
            res.send("");

            utils.get_user_info(req)
                .then(user_info => {
                    let activity_id = user_info.activity_id;
                    // User not belong to any activityactivity_id;
                    // if (!activity_id) return;
                    if (!activity_id) activity_id = '5bfaca2ac045082acf9c5a72';// FIXME: for test
                    let room = utils.get_room_info(req, activity_id);
                    let content = utils.get_wechat_input(req, 'content');

                    if (room.is_blocked_user(user_info.open_id)
                        || room.is_blocked_word(content)
                        || content === '[Unsupported Message]')
                        return;

                    let nickname = user_info.nickname;
                    let head_img_url = user_info.head_img_url;

                    let msg_obj = {
                        "activity_id": activity_id,
                        "id": room.gen_id(req.app.get('redis')),
                        "type": "text",
                        "content": content,
                        "nickname": nickname,
                        "head_img_url": head_img_url,
                        "review_flag": false
                    };

                    let rsmq = req.app.get('rsmq');
                    rsmq.sendMessage({
                            qname: activity_id,
                            message: JSON.stringify(msg_obj)
                        })
                        .then(data => {
                            console.log("RSMQ data sent", data);
                        });

                    //socketApi.displayMessage(activity_id, JSON.stringify(msg_obj));
                })
                .catch(err => {
                    console.error(err);
                    next(err);
                });
            break;

        // User sent an image
        case 'image':
            // Send empty response
            res.send("");

            let activity_id, pic_url, msg_id;
            utils.get_user_info(req)
                .then(user_info => {
                    activity_id = user_info.activity_id;
                    // if (!activity_id) return;
                    if (!activity_id) activity_id = '5bfaca2ac045082acf9c5a72' // FIXME: for test

                    pic_url = utils.get_wechat_input(req, 'picurl');
                    msg_id = utils.get_wechat_input(req, 'msgid');
                    let nickname = user_info.nickname;
                    let head_img_url = user_info.head_img_url;
                    let room = utils.get_room_info(req, activity_id);
                    let msg_obj = {
                        "activity_id": activity_id,
                        "id": room.gen_id(req.app.get('redis')),
                        "type": "image",
                        "content": msg_id, // Save image as the msg_id
                        "nickname": nickname,
                        "head_img_url": head_img_url,
                        "review_flag": false
                    };
                    console.log('Send to room', activity_id);
                    return msg_obj;
                })
                .then(msg_obj => {
                    return utils.download_image(pic_url, msg_id, activity_id)
                                .then(() => {
                                    return msg_obj;
                                });
                })
                .then(msg_obj => {
                    socketApi.displayMessage(activity_id, JSON.stringify(msg_obj));

                    let rsmq = req.app.get('rsmq');
                    return rsmq.sendMessage({
                            qname: activity_id,
                            message: JSON.stringify(msg_obj)
                        })
                        .then(data => {
                            console.log("RSMQ data sent", data);
                        });
                })
                .then(() => {
                    utils.delete_image(activity_id);
                })
                .catch(err => {
                    console.error(err);
                    next(err);
                });
            break;

        case 'event': {
            let event = utils.get_wechat_input(req, 'event');
            let event_key = utils.get_wechat_input(req, 'eventkey');

            let data = {};
            data.to_user_name = utils.get_wechat_input(req, 'fromusername');
            data.from_user_name = utils.get_wechat_input(req, 'tousername');
            data.create_time = Math.floor(Date.now() / 1000);

            // User entered a specific room
            if (event === 'SCAN') {
                let activity_id = event_key;
                utils.update_user_info(req, { activity_id: activity_id });
                console.log('A user entered room', activity_id);
                data.content = "Welcome to DANPINGMU";
                utils.get_reply_text(data)
                    .then(xml => {
                        res.set('Content-Type', 'text/xml');
                        res.send(xml);
                    });
            }
            // FIXME: case of just subscribe activity_id=undefined
            else if (event === 'subscribe') {
                let activity_id = event_key.split('_')[1];
                utils.update_user_info(req, { activity_id: activity_id });
                console.log('A user entered room', activity_id);
                data.content = "Welcome to DANPINGMU";
                utils.get_reply_text(data)
                    .then(xml => {
                        res.set('Content-Type', 'text/xml');
                        res.send(xml);
                    });
            }
            else if (event === 'CLICK') {
                let pr_chain = Promise.resolve();
                switch (event_key) {
                    case 'KEY_VOTE':
                        let open_id;
                        pr_chain = pr_chain.then(() => {
                                return utils.get_user_info(req);
                            })
                            .then(user_info => {
                                open_id = user_info.open_id;
                                let activity_id = user_info.activity_id;
                                //if (!activity_id) return res.send("");

                                if (!activity_id) activity_id = '5bfaca2ac045082acf9c5a72' // FIXME: for test
                                let room = utils.get_room_info(req, activity_id);
                                return utils.get_vote_info(room);
                            })
                            .then(votes => {
                                if (votes.length === 0) {
                                    data.content = "No ongoing voting events";
                                    return utils.get_reply_text(data);
                                }

                                let articles = [];
                                for (let vote of votes) {
                                    let article = {};
                                    article.title = vote.title;
                                    article.desc = vote.sub_title;
                                    article.pic_url = utils.get_url('/images/eye.jpg');
                                    article.url = utils.get_url('/vote/' + vote._id + '/user?open_id=' + open_id);
                                    articles.push(article);
                                }

                                data.article_count = articles.length;
                                data.articles = articles;

                                return utils.get_reply_news(data);
                            });
                        break;
                    case 'KEY_LIST':
                        pr_chain = pr_chain.then(() => {
                                return utils.get_user_info(req);
                            })
                            .then(user_info => {
                                let activity_id = user_info.activity_id;
                                //if (!activity_id) return res.send("");

                                if (!activity_id) activity_id = '5bfaca2ac045082acf9c5a72' // FIXME: for test
                                let room = utils.get_room_info(req, activity_id);
                                data.media_id = room.activity.list_media_id;

                                return utils.get_reply_image(data);
                             });
                        break;
                    case 'KEY_HELP':
                        data.content = "Welcome to DANPINGMU";
                        pr_chain = pr_chain.then(() => {
                                return utils.get_reply_text(data);
                            });
                        break;
                }
                return pr_chain
                    .then(xml => {
                        res.set('Content-Type', 'text/xml');
                        return res.send(xml);
                    });
            }
            else { // Others
                res.send("");
            }

            // Store or refresh user info into cache
            utils.request_user_info(req)
                .catch(err => {
                    console.error(err);
                    next(err);
                });

        } break;
    }
});

router.use('/', utils.sign());

module.exports = router;
