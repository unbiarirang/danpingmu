const request = require('supertest');
const session = require('supertest-session');
const fs = require('fs-extra');
const app = require('../app_test');
const models = require('../models/models');
const utils = require('../common/utils');

let admin_session = null;

const admin_id = 'bbb';
const admin_pw = '12345678';
const title = 'test activity';
const sub_title = 'sub title';
let activity_id;
const wrong_activity_id = 'aaa3ba2fec64483fe182a7d2';
const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
const word = 'xxx';
const wrong_type_word = { word: 'xxx' };

describe('Set up before test', () => {
    test_session = session(app);

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
                // admin session get one actiivty information
                admin_session
                    .get('/activity/' + activity_id)
                    .then(() => {
                        done();
                    });
            });
    });

    test('It should send a message', (done) => {
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
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /', () => {
    test('It should return main admin page', () => {
        return request(app)
            .get('/')
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});

describe('GET /screen', () => {
    test('It should not return screen page with wrong activity_id', (done) => {
        return admin_session
            .get('/activity/' + wrong_activity_id)
            .then(() => {
                admin_session
                    .get('/screen')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(204);
                            done();
                        }, 500);
                    });
            });
    });

    test('It should return screen page', (done) => {
        return admin_session
            .get('/activity/' + activity_id)
            .then(() => {
                admin_session
                    .get('/screen')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('It needs login to return screen page', (done) => {
        return request(app)
            .get('/screen')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('GET /msglist', () => {
    test('It should redirect to /msglist/page/1', (done) => {
        return admin_session
            .get('/msglist')
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It needs login to return msglist page', (done) => {
        return request(app)
            .get('/msglist')
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });
});

describe('GET /msglist/page/:page_id', () => {
    test('It should return messages from redis', (done) => {
        const page_id = 1;
        return admin_session
            .get('/msglist/page/' + page_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should return messages from mongoDB', (done) => {
        const page_id = 1;
        return admin_session
            .get('/msglist/page/' + page_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to return msglist page', (done) => {
        const page_id = 1;
        return request(app)
            .get('/msglist/page/' + page_id)
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should send a message', (done) => {
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
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should return empty msglist page with a large page_id', (done) => {
        const page_id = 100;
        return admin_session
            .get('/msglist/page/' + page_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /blacklist', () => {
    test('It should return user and word blacklist', (done) => {
        return admin_session
            .get('/blacklist')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to return blacklist', () => {
        return request(app)
            .get('/blacklist')
            .then(res => {
                expect(res.statusCode).toBe(401);
            });
    });
});

describe('PUT /blacklist', () => {
    test('It should append a user to the user blacklist', (done) => {
        return admin_session
            .put('/blacklist')
            .send({
                blocked_id: JSON.stringify({ open_id: open_id, nickname: 'testnickname' })
            })
            .then(res => {
                setTimeout(() => {
                    expect(JSON.parse(res.text).blacklist_user)
                        .toContain(open_id + ',testnickname');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });


    test('It should append a word to the word blacklist', (done) => {
        return admin_session
            .put('/blacklist')
            .send({
                blocked_word: word
            })
            .then(res => {
                setTimeout(() => {
                    expect(JSON.parse(res.text).blacklist_word).toContain(word);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to update blacklist', () => {
        return request(app)
            .put('/blacklist')
            .send({
                blocked_word: word
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
            });
    });

    test('It fails to update blacklist with wrong type word', () => {
        return admin_session
            .put('/blacklist')
            .send({
                blocked_word: wrong_type_word
            })
            .then(res => {
                expect(res.statusCode).toBe(500);
            });
    });
});

describe('DELETE /blacklist', () => {
    test('It should delete a user from the user blacklist', (done) => {
        return admin_session
            .delete('/blacklist')
            .send({
                blocked_id: open_id
            })
            .then(res => {
                setTimeout(() => {
                    expect(JSON.parse(res.text).blacklist_user).not.toContain(open_id);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should delete a word from the word blacklist', (done) => {
        return admin_session
            .delete('/blacklist')
            .send({
                blocked_word: word
            })
            .then(res => {
                setTimeout(() => {
                    expect(JSON.parse(res.text).blacklist_word).not.toContain(word);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to delete items from blacklist', () => {
        return request(app)
            .delete('/blacklist')
            .send({
                blocked_word: word
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
            });
    });

    test('It fails to delete wrong type word but it\'s ok', () => {
        return admin_session
            .delete('/blacklist')
            .send({
                blocked_word: wrong_type_word
            })
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});

describe('GET /qrcode', () => {
    test('It should return qrcode', () => {
        return admin_session
            .get('/qrcode')
            .then(res => {
                expect(res.statusCode).toBe(302);
            });
    });

    test('It needs login to return qrcode', () => {
        return request(app)
            .get('/qrcode')
            .then(res => {
                expect(res.statusCode).toBe(401);
            });
    });
});

describe('GET /ticket', () => {
    test('It should return ticket', () => {
        return admin_session
            .get('/ticket')
            .then(res => {
                expect(res.statusCode).toBe(302);
            });
    });

    test('It needs login to return ticket', () => {
        return request(app)
            .get('/ticket')
            .then(res => {
                expect(res.statusCode).toBe(401);
            });
    });

    const retNull = () => { return Promise.resolve(null); };

    test('It should fail to return ticket', () => {
        utils.get_access_token = retNull;
        return admin_session
            .get('/ticket')
            .then(res => {
                expect(res.statusCode).toBe(500);
            });
    });
});

afterAll(() => {
    models.Activity.deleteMany({ title: title })
        .then(() => {});
    app.get('redis').flushall(() => {
        console.log('flushall redis');
    });
});
