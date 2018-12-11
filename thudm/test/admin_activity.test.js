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
                    expect(res.text).toMatch('admin_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('status');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
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
                    expect(res.text).toBe('{"result":1}');
                    expect(res.statusCode).toBe(200);
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

describe('GET /activity/:activity_id/blacklist/user', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';

    test('It should get user blacklist', (done) => {
        return auth_session
            .get('/activity/' + activity_id + '/blacklist/user')
            .then(res => {
                setTimeout(() => {
                    expect(Array.isArray(JSON.parse(res.text))).toBe(true);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('PUT /activity/:activity_id/blacklist/user', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';
    const open_id = 'testopenid';

    test('It should append a user to the user blacklist', (done) => {
        return auth_session
            .put('/activity/' + activity_id + '/blacklist/user')
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

describe('DELETE /activity/:activity_id/blacklist/user', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';
    const open_id = 'testopenid';

    test('It should delete a user from the user blacklist', (done) => {
        return auth_session
            .delete('/activity/' + activity_id + '/blacklist/user')
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

describe('GET /activity/:activity_id/blacklist/word', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';

    test('It should get word blacklist', (done) => {
        return auth_session
            .get('/activity/' + activity_id + '/blacklist/word')
            .then(res => {
                setTimeout(() => {
                    expect(Array.isArray(JSON.parse(res.text))).toBe(true);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('PUT /activity/:activity_id/blacklist/word', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';
    const word = 'xxx';

    test('It should append a user to the word blacklist', (done) => {
        return auth_session
            .put('/activity/' + activity_id + '/blacklist/word')
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

describe('DELETE /activity/:activity_id/blacklist/word', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';
    const word = 'xxx';

    test('It should delete a word from the word blacklist', (done) => {
        return auth_session
            .delete('/activity/' + activity_id + '/blacklist/word')
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

describe('POST /activity/:activity_id/upload/list', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';
    const file_name = 'public/images/list.png'; // dummy image

    test('It should upload a list image', (done) => {
        return auth_session
            .post('/activity/' + activity_id + '/upload/list')
            .attach('list_image', file_name)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('POST /activity/:activity_id/upload/bg', () => {
    const activity_id = '5c03ba2fec64483fe182a7d2';
    const file_name = 'public/images/list.png'; // dummy image

    test('It should upload a background image', (done) => {
        return auth_session
            .post('/activity/' + activity_id + '/upload/bg')
            .attach('bg_image', file_name)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});
