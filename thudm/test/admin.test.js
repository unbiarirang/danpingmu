const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');
const utils = require('../common/utils');

let admin_session = null;

const input_id = 'bbb';
const input_pw = '12345678';
const activity_id = '5c03ba2fec64483fe182a7d2';

describe('POST /auth/login/', () => {
    test_session = session(app);

    test('It should login success', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    admin_session = test_session;
                    // admin session get one actiivty information
                    admin_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            done();
                        });
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
    test('It should return screen page', (done) => {
        return admin_session
            .get('/screen')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
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
    test('It should return msglist page', (done) => {
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
    test('It should get user and word blacklist', (done) => {
        return admin_session
            .get('/blacklist')
            .then(res => {
                setTimeout(() => {
                    expect(Object.keys(JSON.parse(res.text))).toContain('blacklist_user');
                    expect(Object.keys(JSON.parse(res.text))).toContain('blacklist_word');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('PUT /blacklist', () => {
    test('It should append a user to the user blacklist', (done) => {
        const open_id = 'testopenid';
        return admin_session
            .put('/blacklist')
            .send({
                blocked_id: open_id
            })
            .then(res => {
                setTimeout(() => {
                    expect(JSON.parse(res.text).blacklist_user).toContain(open_id);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });


    test('It should append a word to the word blacklist', (done) => {
        const word = 'xxx';
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
});

describe('DELETE /blacklist', () => {
    test('It should delete a user from the user blacklist', (done) => {
    const open_id = 'testopenid';
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
        const word = 'xxx';
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
                expect(res.text).toMatch('invalid credential, access_token is invalid or not latest');
            });
    });
});
