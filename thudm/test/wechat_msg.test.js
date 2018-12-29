const request = require('supertest');
const session = require('supertest-session');
const fs = require('fs-extra');
const app = require('../app_test');
const models = require('../models/models');
const utils = require('../common/utils');

const admin_id = 'bbb';
const admin_pw = '12345678';
const title = 'test activity';
const sub_title = 'sub title';
const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
const wrong_open_id = 'aaa2M1c89iwXQ4RG7pdEOzfa55sc';
let admin_session;
let activity_id;

describe('Set up before test - use review message feature', () => {
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
});

let log_output = "";
const storeLog = input => (log_output += input);

describe('User send a text type message', () => {
    test('It should save the content to rsmq', (done) => {
        console.log = jest.fn(storeLog);
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testuser</ToUserName>' +
                        '<FromUserName>testuser</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>text</MsgType>' +
                        '<Content>testcontent</Content>' +
                        '<MsgId>1234567890</MsgId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(log_output).toMatch('RSMQ data sent');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('User send an image type message', () => {
    const msg_id = '1234567890'

    beforeAll(() => {
        const dir_name = 'public/images/activity/' + activity_id + '/fromuser';
        const file_list = fs.readdirSync(dir_name);
        file_list.forEach(file_name => {
            fs.unlink(dir_name + file_name, () => {});
        });
    });

    test('It should save the image in fromuser direcoty', (done) => {
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
                        '<MsgType>image</MsgType>' +
                        '<PicUrl>http://techidiocy.com/wp-content/uploads/2014/04/id-and-ObjectIds-in-MongoDB-11.png</PicUrl>' +
                        '<MsgId>' + msg_id + '</MsgId>' +
                        '<MediaId>1234567890</MediaId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    const dir_name = 'public/images/activity/' + activity_id + '/fromuser';
                    const file_list = fs.readdirSync(dir_name);
                    expect(file_list).toContain(msg_id + '.png');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 1000);
            });
    });
});

describe('User send an invalid type message', () => {
    test('It should do nothing', (done) => {
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
                        '<MsgType>text</MsgType>' +
                        '<Content>[Unsupported Message]</Content>' +
                        '<MsgId>1234567890</MsgId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('Illegal user send a text type message', () => {
    test('It should do nothing', (done) => {
        console.log = jest.fn(storeLog);
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: wrong_open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + wrong_open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testuser</ToUserName>' +
                        '<FromUserName>testuser</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>text</MsgType>' +
                        '<Content>testcontent</Content>' +
                        '<MsgId>1234567890</MsgId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('Turn off the review message feature then send a message', () => {
    test('It should turn off the review message feature', (done) => {
        admin_session
            .put('/activity/review_flag')
            .send({ review_flag: false })
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });

    test('It should not save the content to rsmq', (done) => {
        console.log = jest.fn(storeLog);
        log_output = '';
        utils.load_activities(app)
            .then(() => {
                utils.update_user_info({ app: app, query: { openid: open_id } }, { activity_id: activity_id });
            })
            .then(() => {
                return request(app)
                    .post('/wechat?signature=123&timestamp=123&nonce=123&openid=' + open_id)
                    .type('xml')
                    .send('<xml>' +
                        '<ToUserName>testuser</ToUserName>' +
                        '<FromUserName>testuser</FromUserName>' +
                        '<CreateTime>1348831860</CreateTime>' +
                        '<MsgType>text</MsgType>' +
                        '<Content>testcontent</Content>' +
                        '<MsgId>1234567890</MsgId>' +
                        '</xml>');
            })
            .then(res => {
                setTimeout(() => {
                    expect(log_output).not.toMatch('RSMQ data sent');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

afterAll(() => {
    models.Activity.deleteOne({ title: title })
        .then(() => {});
});
