const request = require('supertest');
const session = require('supertest-session');
const fs = require('fs-extra');
const app = require('../app_test');
const utils = require('../common/utils');
const models = require('../models/models');

const admin_id = 'bbb';
const admin_pw = '12345678';
const title = 'test activity';
const sub_title = 'sub title';
const vote_title = 'test vote';
const vote_sub_title = 'sub_title';
const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
let admin_session;
let activity_id;
let vote_id;

describe('Set up before test', () => {
    let test_session = session(app);

    beforeAll(done => {
        fs.copy('public/images/list.png', 'public/images/temp/list.png')
            .then(() => { done(); });
    });

    test('It should login success', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: admin_id, input_pw: admin_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    admin_session = test_session;
                    done();
                }, 500);
            });
    });

    test('It should create new Activity', (done) => {
        return admin_session
            .post('/activity')
            .send({
                title: title,
                sub_title: sub_title,
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                bg_img_url: '/images/temp/list.png',
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should get the Activity information', (done) => {
        models.Activity.findOne({ title: title })
            .then(act => {
                activity_id = act._id.toString();
                done();
            });
    });

    test('It should create new Vote', (done) => {
        return admin_session
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: vote_title,
                sub_title: vote_sub_title,
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "/images/anonymous.jpg", "/images/anonymous.jpg", "/images/anonymous.jpg" ]
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should start the vote activity', (done) => {
        models.Vote.findOne({ title: vote_title })
            .then(vote => {
                vote_id = vote._id.toString();
                return admin_session
                    .post('/vote/' + vote_id + '/start')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });
});

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

afterAll(() => {
    models.Activity.deleteOne({ title: title })
        .then(() => {});
    models.Vote.deleteOne({ title: vote_title })
        .then(() => {});
    app.get('redis').flushdb(() => {
        console.log('flush redis');
    });
});
