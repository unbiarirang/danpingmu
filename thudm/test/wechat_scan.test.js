const request = require('supertest');
const fs = require('fs');
const app = require('../app_test');
const utils = require('../common/utils');
const models = require('../models/models');

describe('User subscribed the service account', () => {
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc';

    test('It should return welcome message', (done) => {
        return request(app)
            .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
            .type('xml')
            .send('<xml>' +
                '<ToUserName>testname</ToUserName>' +
                '<FromUserName>testname</FromUserName>' +
                '<CreateTime>1348831860</CreateTime>' +
                '<MsgType>event</MsgType>' +
                '<Event>subscribe</Event>' +
                '<EventKey></EventKey>' +
                '</xml>')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('<MsgType><![CDATA[text]]></MsgType>\n    <Content><![CDATA[Welcome to DANPINGMU]]></Content>\n</xml>');
                    done();
                }, 1000);
            });
    });
});

describe('User(both old and new subscriber) entered a activity', () => {
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc';
    const activity_id = '5bfaca2ac045082acf9c5a72';

    test('It should return welcome message and record activity_id', (done) => {
        return request(app)
            .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
            .type('xml')
            .send('<xml>' +
                '<ToUserName>testname</ToUserName>' +
                '<FromUserName>testname</FromUserName>' +
                '<CreateTime>1348831860</CreateTime>' +
                '<MsgType>event</MsgType>' +
                '<Event>SCAN</Event>' +
                '<EventKey>' + activity_id + '</EventKey>' +
                '</xml>')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('<MsgType><![CDATA[text]]></MsgType>\n    <Content><![CDATA[Welcome to DANPINGMU]]></Content>\n</xml>');
                    utils.get_user_info({ app: app, query: { openid: open_id } })
                        .then(user_info => {
                            expect(user_info.activity_id).toBe(activity_id);
                            done();
                        });
                }, 1000);
            });
    });
});
