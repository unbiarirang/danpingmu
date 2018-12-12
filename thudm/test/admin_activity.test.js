const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models');
const fs = require('fs-extra');

let test_session = null;
let auth_session = null;

beforeEach(() => {
    test_session = session(app);
});

describe('POST /auth/login/', () => {
    test('It should login success', (done) => {
        const input_id = 'bbb';
        const input_pw = '12345678';
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    auth_session = test_session;
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/:activity_id', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';

    test('It should get activity information with the activity id', (done) => {
        return auth_session
            .get('/activity/' + activity_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/detail', () => {
    test('It should get activity information with the activity id', (done) => {
        return auth_session
            .get('/activity/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('admin_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('status');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/blacklist/user', () => {
    test('It should get user blacklist', (done) => {
        return auth_session
            .get('/activity/blacklist/user')
            .then(res => {
                setTimeout(() => {
                    expect(Array.isArray(JSON.parse(res.text))).toBe(true);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('PUT /activity/blacklist/user', () => {
    const open_id = 'testopenid';

    test('It should append a user to the user blacklist', (done) => {
        return auth_session
            .put('/activity/blacklist/user')
            .send({
                blocked_id: open_id
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch(open_id);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('DELETE /activity/blacklist/user', () => {
    const open_id = 'testopenid';

    test('It should delete a user from the user blacklist', (done) => {
        return auth_session
            .delete('/activity/blacklist/user')
            .send({
                blocked_id: open_id
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).not.toMatch(open_id);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/blacklist/word', () => {

    test('It should get word blacklist', (done) => {
        return auth_session
            .get('/activity/blacklist/word')
            .then(res => {
                setTimeout(() => {
                    expect(Array.isArray(JSON.parse(res.text))).toBe(true);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('PUT /activity/blacklist/word', () => {
    const word = 'xxx';

    test('It should append a user to the word blacklist', (done) => {
        return auth_session
            .put('/activity/blacklist/word')
            .send({
                blocked_word: word
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch(word);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('DELETE /activity/blacklist/word', () => {
    const word = 'xxx';

    test('It should delete a word from the word blacklist', (done) => {
        return auth_session
            .delete('/activity/blacklist/word')
            .send({
                blocked_word: word
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).not.toMatch(word);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

//describe('POST /activity/upload/list', () => {
//    const file_name = 'public/images/list.png'; // dummy image
//
//    test('It should upload a list image', (done) => {
//        return auth_session
//            .post('/activity/upload/list')
//            .attach('list_image', file_name)
//            .then(res => {
//                setTimeout(() => {
//                    expect(res.statusCode).toBe(200);
//                    done();
//                }, 500);
//            });
//    });
//});

describe('POST /activity/upload/bg', () => {
    const file_name = 'public/images/list.png'; // dummy image

    test('It should upload a background image', (done) => {
        return auth_session
            .post('/activity/upload/bg')
            .attach('bg_image', file_name)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/msglist', () => {
    test('It should return msglist page', (done) => {
        return auth_session
            .get('/activity/msglist')
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });
});

describe('GET /activity/msglist/page/:page_id', () => {
    test('It should return msglist page', (done) => {
        const page_id = 1;
        return auth_session
            .get('/activity/msglist/page/' + page_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

// FIXME: for test. create queue in create activity
describe('GET /activity/screen', () => {
    test('It should return screen page', (done) => {
        return auth_session
            .get('/activity/screen')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/qrcode', () => {
    test('It should return qrcode', () => {
        return auth_session
            .get('/activity/qrcode')
            .then(res => {
                expect(res.statusCode).toBe(302);
            });
    });
});

describe('GET /activity/ticket', () => {
    test('It should return ticket', () => {
        return auth_session
            .get('/activity/ticket')
            .then(res => {
                expect(res.statusCode).toBe(302);
            });
    });
});

describe('GET /activity/list', () => {
    test('It should return activity list that the admin has', (done) => {
        return auth_session
            .get('/activity/list')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /activity/create', () => {
    test('It should return create activity page', (done) => {
        return auth_session
            .get('/activity/create')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('POST /activity', () => {
    const test_title = 'test activity';

    test('It should create new Activity', (done) => {
        return auth_session
            .post('/activity')
            .type('form')
            .send({
                title: test_title,
                sub_title: 'sub title',
                bullet_color_num: 3,
                bullet_colors: [ 'red', 'yellow', 'white' ],
                banned_words_url: 'some.url',
                bg_img_url: 'some.url',
                list_media_id: 'test media id'
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    done();
                }, 500);
            });
    });

    test('It should destroy the Activity', (done) => {
        let room_info = app.get('cache').room_info;
        const dir_name = 'public/images/activity/';
        const dir_list = fs.readdirSync(dir_name);
        const act_id = dir_list[dir_list.length - 1];
        let room = room_info.get(act_id);

        room.destroy(app.get('redis'))
            .then(() => { done(); });
    });

    afterAll(() => {
        models.Activity.deleteOne({ title: test_title })
            .then(() => {});
    });
});
