const request = require('supertest');
const fs = require('fs');
const app = require('../app_test');
const utils = require('../common/utils');
const models = require('../models/models');

const activity_id = '5c03ba2fec64483fe182a7d2';
const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'

describe('User clicked "help" button', () => {
    test('It should return help message', (done) => {
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testname</ToUserName>' +
                        '<FromUserName>testname</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>event</MsgType>' +
                        '<Event>CLICK</Event>' +
                        '<EventKey>KEY_HELP</EventKey>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('<MsgType><![CDATA[text]]></MsgType>\n    <Content><![CDATA[Welcome to DANPINGMU]]></Content>\n</xml>');
                    done();
                }, 500);
            });
    });
});

describe('User clicked "program list" button', () => {
    let list_media_id;

    test('It should return response with the list image\'s media_id', (done) => {
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return models.Activity.findById(activity_id)
                    .then(room => { list_media_id = room.list_media_id; });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testname</ToUserName>' +
                        '<FromUserName>testname</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>event</MsgType>' +
                        '<Event>CLICK</Event>' +
                        '<EventKey>KEY_LIST</EventKey>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('<MsgType><![CDATA[image]]></MsgType>\n    <Image><MediaId><![CDATA[' + list_media_id + ']]></MediaId></Image>\n</xml>');
                    done();
                }, 500);
            });
    });
});

describe('User clicked "vote" button', () => {
    test('It should return all ongoing vote events', (done) => {
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testname</ToUserName>' +
                        '<FromUserName>testname</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>event</MsgType>' +
                        '<Event>CLICK</Event>' +
                        '<EventKey>KEY_VOTE</EventKey>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    models.Vote.find({ status: 'ONGOING' })
                        .then(votes => {
                            let item_count = res.text.match(/<item>/g) ?
                                    res.text.match(/<item>/g).length : 0;
                            let len = votes ? votes.length : 0;
                            expect(item_count).toBe(len);
                            done();
                        });
                }, 500);
            });
    });
});

describe('User sends an event that is not "SCAN", "CLICK" or "subscribe"', () => {
    const wrong_event = 'EVENT';

    test('It should return nothing', (done) => {
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testname</ToUserName>' +
                        '<FromUserName>testname</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>event</MsgType>' +
                        '<Event>' + wrong_event + '</Event>' +
                        '<EventKey>KEY_HELP</EventKey>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    expect(res.text).toBe('');
                    done();
                }, 500);
            });
    });
});

